import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { useMe } from '../../lib/session';
import { paymentNotReceived } from '../../lib/actions';
import { bookingStatus, clock, day, money, nextLevel, todayIST } from '../../lib/format';
import { ActionForm, Body, Empty, H, Head, Level, Pill, Stat } from '../../components/kg/ui';
import { WorksTable } from '../../components/kg/Lists';

export async function loadMyWorks(workerId) {
  const rows = must(await supabase.from('bookings').select('*, jobs(*)').eq('worker_id', workerId).order('created_at', { ascending: false })) ?? [];
  const ids = [...new Set(rows.map((r) => r.jobs.client_id))];
  const cl = ids.length ? must(await supabase.from('client_public').select('id, org_name').in('id', ids)) : [];
  return { rows, cname: Object.fromEntries((cl ?? []).map((c) => [c.id, c.org_name])) };
}

const Dashboard = () => {
  const me = useMe();
  const { profile, worker } = me;
  const q = useLoad(() => loadMyWorks(worker.id), [worker.id]);

  return (
    <Body q={q}>{({ rows, cname }) => {
      const today = todayIST();
      const next = rows
        .filter((r) => r.status === 'approved' && !r.check_out_at && !r.no_show && !r.left_early && r.jobs.status === 'open' && new Date(r.jobs.ends_at) > new Date())
        .sort((a, b) => a.jobs.starts_at.localeCompare(b.jobs.starts_at))[0];
      const credited = rows.filter((r) => r.paid_at).reduce((s, r) => s + (r.final_pay ?? r.jobs.pay), 0);
      const pending = rows.filter((r) => r.status === 'approved' && !r.paid_at && !r.no_show && r.jobs.status !== 'cancelled')
        .reduce((s, r) => s + (r.final_pay ?? r.jobs.pay), 0);
      const overdue = rows.filter((r) => r.check_out_at && !r.paid_at && r.jobs.payment_date < today);
      const nl = nextLevel(worker.completed_jobs);
      const rating = worker.rating_count ? (worker.rating_sum / worker.rating_count).toFixed(1) : '—';

      return <>
        <Head title={`Hi ${profile.full_name.split(' ')[0]}`} sub={`${day(today)} · ${profile.area ?? 'Kochi'}`}>
          <Link className="btn p" to="/worker/get-work">Find work →</Link>
        </Head>

        {worker.kyc_status !== 'verified' && (
          <div className="card warn row between">
            <div><h3>Verify your Aadhaar to start applying</h3><p className="muted">One Aadhaar, one account. Takes about two minutes.</p></div>
            <Link className="btn w" to="/worker/profile#kyc">Verify now</Link>
          </div>
        )}

        {next ? (
          <div className="next">
            <div className="stack" style={{ gap: 6 }}>
              <div className="row"><span className="eyebrow" style={{ color: '#7ee2a8' }}>Next job · {next.jobs.work_date === today ? 'Today' : day(next.jobs.work_date)}</span><Pill tone={bookingStatus(next, next.jobs)[1]}>{bookingStatus(next, next.jobs)[0]}</Pill></div>
              <h2>{next.jobs.title}</h2>
              <p className="muted">{next.jobs.venue}, {next.jobs.area} · {clock(next.jobs.start_time)} · {next.jobs.hours} hrs · <b style={{ color: '#fff' }}>{money(next.jobs.pay)}</b> · paid by {day(next.jobs.payment_date)}</p>
              <p className="faint" style={{ fontSize: 13 }}>{cname[next.jobs.client_id]}</p>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}><Link className="btn p" to={`/worker/job/${next.id}`}>{next.check_in_at ? 'Check out / details' : 'Check in / details'}</Link></div>
          </div>
        ) : <Empty>No upcoming jobs. <Link to="/worker/get-work">Find work near you</Link> and apply with a slot.</Empty>}

        <div className="grid g5">
          <Stat k="Works completed" v={worker.completed_jobs} s="counted with OTP + photo" />
          <Stat k="Credited earnings" v={money(credited)} s="marked paid by clients" />
          <Stat k="Pending earnings" v={money(pending)} s="booked or awaiting payment" />
          <Stat k="Average rating" v={rating} s={`${worker.rating_count} ratings`} />
          <Stat k="Available slots" v={worker.slots} s={<Link to="/worker/buy-slots">Buy more</Link>} />
        </div>

        <div className="grid g3">
          <div className="card stack"><div className="row between"><span className="eyebrow">Level</span><Level jobs={worker.completed_jobs} /></div>
            {nl ? <><p><b className="num">{worker.completed_jobs}/{nl.at}</b> jobs to <b>{nl.name}</b></p><div className="bar"><i style={{ width: `${(worker.completed_jobs / nl.at) * 100}%` }} /></div></> : <p>Top level reached.</p>}</div>
          <div className="card stack"><span className="eyebrow">Reliability</span>
            <div className="row"><Pill tone={worker.no_shows ? 'bad' : 'good'}>{worker.no_shows} no-shows</Pill><Pill tone={worker.early_exits ? 'warn' : 'good'}>{worker.early_exits} unapproved early exits</Pill></div>
            <p className="note">Clients see this when you apply.</p></div>
        </div>

        {overdue.length > 0 && (
          <div className="card warn stack">
            <h3>Payment overdue</h3>
            {overdue.map((r) => (
              <div key={r.id} className="row between">
                <div><b>{r.jobs.title}</b> · {cname[r.jobs.client_id]}<div className="faint" style={{ fontSize: 12.5 }}>{money(r.final_pay ?? r.jobs.pay)} was due {day(r.jobs.payment_date)}</div></div>
                <ActionForm run={paymentNotReceived} className="inline" onDone={q.reload}><H name="booking" value={r.id} /><button className="btn w sm">Payment not received</button></ActionForm>
              </div>
            ))}
          </div>
        )}

        <div className="stack"><h2>My works</h2><WorksTable rows={rows.slice(0, 8)} cname={cname} /></div>
      </>;
    }}</Body>
  );
};

export default Dashboard;
