import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, useLive, must } from '../../lib/api';
import { useMe } from '../../lib/session';
import { checkIn, paymentNotReceived, rateBooking, requestEarly } from '../../lib/actions';
import { bookingStatus, clock, dateTime, day, money, time, todayIST } from '../../lib/format';
import { ActionForm, Body, H, Head, Loading, Page, Pill } from '../../components/kg/ui';
import { CheckOutPanel } from '../../components/kg/Forms';

// One booking: OTP + GPS check-in, early check-out request, photo check-out, rating, payment case.
const Job = () => {
  const { id } = useParams();
  const me = useMe();
  const { user, worker } = me;
  const q = useLoad(async () => {
    const b = must(await supabase.from('bookings').select('*, jobs(*)').eq('id', id).eq('worker_id', worker.id).maybeSingle());
    if (!b) return { missing: true };
    const [client, contacts, myRating] = await Promise.all([
      supabase.from('client_public').select('*').eq('id', b.jobs.client_id).single().then((r) => r.data),
      supabase.rpc('get_job_contacts', { p_job: b.jobs.id }).then((r) => r.data),
      supabase.from('ratings').select('stars').eq('booking_id', b.id).eq('rater', 'worker').maybeSingle().then((r) => r.data),
    ]);
    return { b, client, contact: (contacts ?? [])[0], myRating };
  }, [id, worker.id]);
  useLive('bookings', `id=eq.${id}`, q.reload);
  const done = () => { q.reload(); me.refresh(); };

  if (q.data?.missing) return <Page><Loading error="Booking not found." /></Page>;

  return (
    <Body q={q}>{({ b, client, contact, myRating }) => {
      const j = b.jobs;
      const [label, tone] = bookingStatus(b, j);
      const now = Date.now();
      const opensIn = new Date(j.starts_at).getTime() - 2 * 3600e3;
      const outOpens = new Date(j.ends_at).getTime() - 30 * 60e3;
      const active = b.status === 'approved' && j.status === 'open' && !b.no_show && !b.left_early;

      return <>
        <Head title={j.title} sub={`${day(j.work_date)} · ${clock(j.start_time)} · ${j.hours} hrs · ${j.venue}, ${j.area}`}>
          <Pill tone={tone}>{label}</Pill>
        </Head>

        <div className="grid g2">
          <div className="card stack">
            <dl className="kv">
              <dt>Pay</dt><dd><b>{money(b.final_pay ?? j.pay)}</b>{b.pay_mode === 'hours' && ' (hours worked)'}</dd>
              <dt>Paid by</dt><dd>{day(j.payment_date)} · {b.paid_at ? <Pill tone="good">Marked paid {dateTime(b.paid_at)}</Pill> : 'not yet'}</dd>
              <dt>Client</dt><dd>{client?.org_name}</dd>
              {contact && <><dt>Contact</dt><dd>{contact.name} · <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="mono">{contact.phone}</a></dd></>}
              <dt>Slots spent</dt><dd>{b.slots_spent}</dd>
              {b.check_in_at && <><dt>Checked in</dt><dd>{time(b.check_in_at)}{b.check_in_dist_m != null && ` · ${b.check_in_dist_m} m from venue`}</dd></>}
              {b.check_out_at && <><dt>Checked out</dt><dd>{time(b.check_out_at)}</dd></>}
            </dl>
            {j.description && <p className="faint">{j.description}</p>}
            <div className="row">
              {j.lat != null && <a className="btn sm" href={`https://maps.google.com/?q=${j.lat},${j.lng}`} target="_blank" rel="noreferrer">Open venue in Maps</a>}
              {b.status === 'approved' && <Link className="btn sm" to={`/worker/chat/${j.id}`}>Job chat</Link>}
            </div>
          </div>

          <div className="card stack">
            {b.status === 'applied' && <p>Waiting for the client to approve. If they reject you, your slot comes back.</p>}
            {active && !b.check_in_at && (now < opensIn
              ? <p>Check-in opens at {time(new Date(opensIn).toISOString())} on {day(j.work_date)}.</p>
              : <ActionForm run={checkIn} geo className="stack" onDone={done}>
                  <h3>Check in</h3>
                  <p className="muted">At the venue, ask the client for your 4-digit OTP. Location must be on, within 300 m.</p>
                  <H name="booking" value={b.id} />
                  <div className="fld"><label htmlFor="otp">OTP</label><input id="otp" name="otp" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" required className="mono" style={{ fontSize: 22, letterSpacing: '.3em', maxWidth: 160 }} autoComplete="one-time-code" /></div>
                  <div><button className="btn p">Check in</button></div>
                </ActionForm>)}

            {active && b.check_in_at && !b.check_out_at && (
              <div className="stack">
                <h3>Check out</h3>
                {now >= outOpens || b.early_status === 'approved'
                  ? <><p className="muted">Take a photo at the venue. Time and GPS are stamped on it.</p><CheckOutPanel uid={user.id} booking={b.id} onDone={done} /></>
                  : <>
                      <p className="muted">Check-out opens at {time(new Date(outOpens).toISOString())}.</p>
                      {b.early_status === 'pending' ? <div><Pill tone="warn">Early check-out requested. Waiting for the client.</Pill></div> : (
                        <ActionForm run={requestEarly} className="stack" onDone={done}>
                          {b.early_status === 'rejected' && <p className="msg err">The client said no to leaving early.</p>}
                          <H name="booking" value={b.id} />
                          <div className="fld"><label htmlFor="er">Need to leave early?</label>
                            <select id="er" name="reason"><option>Work finished early</option><option>Client released me</option><option>Family emergency</option><option>Feeling unwell</option><option>Other</option></select></div>
                          <div><button className="btn w">Request early check-out</button></div>
                          <p className="note">The client decides and chooses full pay or pay for hours worked. Leaving without approval goes on your record.</p>
                        </ActionForm>
                      )}
                    </>}
              </div>
            )}

            {(b.check_out_at || b.left_early) && (
              <div className="stack">
                {!myRating ? (
                  <ActionForm run={rateBooking} className="stack" onDone={done}>
                    <h3>Rate this client</h3>
                    <H name="booking" value={b.id} />
                    <div className="stars-in">{[5, 4, 3, 2, 1].map((n) => <span key={n} style={{ display: 'contents' }}><input type="radio" id={`s${n}`} name="stars" value={n} required /><label htmlFor={`s${n}`} aria-label={`${n} stars`}>★</label></span>)}</div>
                    <textarea name="comment" placeholder="Optional: paid on time? good to work for?" />
                    <div><button className="btn p">Submit rating</button></div>
                  </ActionForm>
                ) : <p>You rated this client {'★'.repeat(myRating.stars)}.</p>}
                {b.check_out_at && !b.paid_at && j.payment_date < todayIST() && (
                  <ActionForm run={paymentNotReceived} className="stack" onDone={done}>
                    <H name="booking" value={b.id} />
                    <input name="note" placeholder="Optional note for krewgrid" />
                    <div><button className="btn w">Payment not received</button></div>
                  </ActionForm>
                )}
              </div>
            )}
            {b.no_show && <p>Marked as a no-show. If that's wrong, <Link to="/worker/disputes">raise a dispute</Link> with photo proof.</p>}
            {(b.status === 'rejected' || b.status === 'cancelled') && <p className="muted">Your slot was refunded.</p>}
          </div>
        </div>
      </>;
    }}</Body>
  );
};

export default Job;
