import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, useLive, must, signedUrls } from '../../lib/api';
import { useMe } from '../../lib/session';
import {
  approveBooking, rejectBooking, cancelJob, releaseAll, decideEarly, reportNoShow, reportLeftEarly, markPaid, rateBooking,
} from '../../lib/actions';
import { bookingStatus, clock, day, money, time } from '../../lib/format';
import { ActionForm, Avatar, Body, Empty, H, Head, Level, Loading, Page, Pill } from '../../components/kg/ui';

// One work for the client: applicants, OTPs, live attendance, early check-out, no-shows, payment and ratings.
const WorkDetail = () => {
  const { id } = useParams();
  const { client } = useMe();
  const q = useLoad(async () => {
    const j = must(await supabase.from('jobs').select('*').eq('id', id).eq('client_id', client.id).maybeSingle());
    if (!j) return { missing: true };
    const bookings = must(await supabase.from('bookings').select('*').eq('job_id', id).order('created_at')) ?? [];
    const wIds = bookings.map((b) => b.worker_id);
    const [wp, otps, contacts, ratings] = await Promise.all([
      wIds.length ? supabase.from('worker_public').select('*').in('id', wIds).then(must) : [],
      supabase.rpc('job_otps', { p_job: id }).then((r) => r.data),
      supabase.rpc('get_job_contacts', { p_job: id }).then((r) => r.data),
      bookings.length ? supabase.from('ratings').select('booking_id, stars').eq('rater', 'client').in('booking_id', bookings.map((b) => b.id)).then(must) : [],
    ]);
    const urls = await signedUrls([...(wp ?? []).map((w) => w.avatar_path), ...bookings.map((b) => b.check_out_photo)]);
    return {
      j, bookings, urls,
      W: Object.fromEntries((wp ?? []).map((w) => [w.id, w])),
      otp: Object.fromEntries((otps ?? []).map((o) => [o.booking_id, o.otp])),
      phone: Object.fromEntries((contacts ?? []).map((c) => [c.person_id, c.phone])),
      rated: Object.fromEntries((ratings ?? []).map((r) => [r.booking_id, r.stars])),
    };
  }, [id, client.id]);
  useLive('bookings', `job_id=eq.${id}`, q.reload);
  const done = q.reload;

  if (q.data?.missing) return <Page><Loading error="Work not found." /></Page>;

  return (
    <Body q={q}>{({ j, bookings, urls, W, otp, phone, rated }) => {
      const apps = bookings.filter((b) => b.status === 'applied');
      const booked = bookings.filter((b) => b.status === 'approved');
      const early = booked.filter((b) => b.early_status === 'pending');
      const started = Date.now() > new Date(j.starts_at).getTime() + 30 * 60e3;
      const open = j.status === 'open';

      return <>
        <Head title={j.title} sub={`${day(j.work_date)} · ${clock(j.start_time)} · ${j.hours} hrs · ${j.venue}, ${j.area} · ${money(j.pay)} each · pay by ${day(j.payment_date)}`}>
          <Link className="btn" to={`/client/chat/${j.id}`}>Job chat</Link>
          {open && booked.some((b) => b.check_in_at && !b.check_out_at) && <ActionForm run={releaseAll} className="inline" confirm="Release everyone? Tap again" onDone={done}><H name="job" value={j.id} /><button className="btn w">Release all workers</button></ActionForm>}
          {open && !booked.some((b) => b.check_in_at) && <ActionForm run={cancelJob} className="inline" confirm="Cancel this work? Tap again" onDone={done}><H name="job" value={j.id} /><button className="btn d">Cancel work</button></ActionForm>}
          {!open && <Pill>{j.status === 'cancelled' ? 'Cancelled' : 'Closed'}</Pill>}
        </Head>

        {early.length > 0 && (
          <div className="card warn stack">
            <h3>Early check-out requests</h3>
            {early.map((b) => (
              <div key={b.id} className="row between">
                <div><b>{W[b.worker_id]?.full_name}</b> · {b.early_reason}<div className="faint" style={{ fontSize: 12.5 }}>In since {time(b.check_in_at)}</div></div>
                <div className="row">
                  <ActionForm run={decideEarly} className="inline" onDone={done}>
                    <H name="booking" value={b.id} /><H name="decision" value="approve" />
                    <select name="pay_mode" aria-label="Pay"><option value="full">Full pay {money(j.pay)}</option><option value="hours">Pay for hours worked</option></select>
                    <button className="btn sm p">Approve</button>
                  </ActionForm>
                  <ActionForm run={decideEarly} className="inline" onDone={done}><H name="booking" value={b.id} /><H name="decision" value="reject" /><button className="btn sm">Say no</button></ActionForm>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="stack">
          <div className="row between"><h2>Applicants</h2><span className="faint">{j.approval_mode === 'auto' ? 'Auto-approve is on' : 'You approve each worker'}{j.photo_approval && ' · photo approval'}</span></div>
          {apps.length === 0 ? <Empty>No new applicants.</Empty> : (
            <div className="grid g2">{apps.map((b) => { const w = W[b.worker_id]; return (
              <div key={b.id} className="card row between">
                <div className="row nowrap"><Avatar name={w?.full_name ?? '?'} url={w?.avatar_path ? urls[w.avatar_path] : null} lg={j.photo_approval} />
                  <div><b>{w?.full_name}</b> <Level jobs={w?.completed_jobs ?? 0} /> {w?.kyc_verified && <Pill tone="good">Aadhaar ✓</Pill>}
                    <div className="faint" style={{ fontSize: 12.5 }}>★ {w?.rating ?? 'new'} · {w?.completed_jobs} jobs · {w?.no_shows} no-shows · {w?.early_exits} early exits · {w?.area}</div></div></div>
                <div className="row">
                  <ActionForm run={approveBooking} className="inline" onDone={done}><H name="booking" value={b.id} /><button className="btn sm p">Approve</button></ActionForm>
                  <ActionForm run={rejectBooking} className="inline" onDone={done}><H name="booking" value={b.id} /><button className="btn sm">Reject</button></ActionForm>
                </div>
              </div>); })}</div>
          )}
        </div>

        <div className="stack">
          <div className="row between"><h2>Booked workers · {booked.length}/{j.workers_needed}</h2><span className="note">Show each worker their OTP at the venue. This page updates live.</span></div>
          {booked.length === 0 ? <Empty>No one booked yet.</Empty> : (
            <div className="tw"><table>
              <thead><tr><th>Worker</th><th>OTP</th><th>Check-in</th><th>Check-out</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>{booked.map((b) => { const w = W[b.worker_id]; const [label, tone] = bookingStatus(b, j); return (
                <tr key={b.id}>
                  <td><div className="row nowrap" style={{ gap: 8 }}><Avatar name={w?.full_name ?? '?'} url={w?.avatar_path ? urls[w.avatar_path] : null} />
                    <div><b>{w?.full_name}</b><div><Level jobs={w?.completed_jobs ?? 0} /> {phone[b.worker_id] && <a className="mono faint" style={{ fontSize: 12 }} href={`tel:${phone[b.worker_id].replace(/\s/g, '')}`}>{phone[b.worker_id]}</a>}</div></div></div></td>
                  <td><span className="otpbox" style={{ fontSize: 16 }}>{otp[b.id]}</span></td>
                  <td className="num">{b.check_in_at ? <>{time(b.check_in_at)}<div className="faint" style={{ fontSize: 11.5 }}>{b.check_in_dist_m != null ? `${b.check_in_dist_m} m away` : 'OTP'}</div></> : '—'}</td>
                  <td className="num">{b.check_out_at ? <>{time(b.check_out_at)}{b.check_out_photo && urls[b.check_out_photo] && <div><a href={urls[b.check_out_photo]} target="_blank" rel="noreferrer" style={{ fontSize: 11.5 }}>photo</a></div>}</> : '—'}</td>
                  <td><Pill tone={tone}>{label}</Pill>{b.final_pay != null && b.final_pay !== j.pay && <div className="faint" style={{ fontSize: 11.5 }}>{money(b.final_pay)} for hours worked</div>}</td>
                  <td><div className="row" style={{ justifyContent: 'flex-end' }}>
                    {!b.check_in_at && !b.no_show && started && <ActionForm run={reportNoShow} className="inline" confirm="Report no-show? Tap again" onDone={done}><H name="booking" value={b.id} /><button className="btn sm d">Report no-show</button></ActionForm>}
                    {b.check_in_at && !b.check_out_at && !b.left_early && b.early_status !== 'approved' && <ActionForm run={reportLeftEarly} className="inline" confirm="Left without approval? Tap again" onDone={done}><H name="booking" value={b.id} /><button className="btn sm">Left early</button></ActionForm>}
                    {b.check_in_at && !b.paid_at && <ActionForm run={markPaid} className="inline" onDone={done}><H name="booking" value={b.id} /><button className="btn sm p">Mark paid</button></ActionForm>}
                    {b.paid_at && <Pill tone="good">Paid</Pill>}
                    {(b.check_out_at || b.left_early) && (rated[b.id] ? <Pill>★ {rated[b.id]}</Pill> : (
                      <ActionForm run={rateBooking} className="inline" onDone={done}><H name="booking" value={b.id} />
                        <select name="stars" aria-label="Stars" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select>
                        <button className="btn sm">Rate</button></ActionForm>))}
                  </div></td>
                </tr>); })}</tbody>
            </table></div>
          )}
        </div>
      </>;
    }}</Body>
  );
};

export default WorkDetail;
