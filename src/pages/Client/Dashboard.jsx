import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { useMe } from '../../lib/session';
import { clock, day, money, todayIST } from '../../lib/format';
import { Body, Empty, Head, Pill, Stat } from '../../components/kg/ui';

const Dashboard = () => {
  const { client } = useMe();
  const q = useLoad(async () => {
    const jobs = must(await supabase.from('jobs').select('*, bookings(*)').eq('client_id', client.id).order('starts_at', { ascending: false }).limit(100)) ?? [];
    const all = jobs.flatMap((j) => j.bookings.map((b) => ({ ...b, job: j })));
    const waiting = all.filter((b) => b.job.status === 'open' && (b.status === 'applied' || b.early_status === 'pending'));
    const ids = [...new Set(waiting.map((b) => b.worker_id))];
    const wp = ids.length ? must(await supabase.from('worker_public').select('id, full_name').in('id', ids)) : [];
    return { jobs, all, waiting, wname: Object.fromEntries((wp ?? []).map((w) => [w.id, w.full_name])) };
  }, [client.id]);

  return (
    <Body q={q}>{({ jobs, all, waiting, wname }) => {
      const booked = all.filter((b) => b.status === 'approved');
      const inNow = booked.filter((b) => b.check_in_at && !b.check_out_at).length;
      const due = booked.filter((b) => b.check_in_at && !b.paid_at).reduce((s, b) => s + (b.final_pay ?? b.job.pay), 0);
      const today = todayIST();
      const nowIso = new Date().toISOString();
      return <>
        <Head title={client.org_name} sub={client.verified ? 'Verified by krewgrid · posting is free' : 'Verification pending'}>
          {client.verified && <Link className="btn p" to="/client/post-work">Post a work</Link>}
        </Head>
        <div className="grid g5">
          <Stat k="Open works" v={jobs.filter((j) => j.status === 'open' && j.ends_at > nowIso).length} />
          <Stat k="Workers booked" v={booked.length} />
          <Stat k="Checked in now" v={inNow} s="OTP + GPS" />
          <Stat k="Payments due" v={money(due)} s="pay workers directly" />
        </div>
        {waiting.length > 0 && (
          <div className="card warn stack">
            <h3>Needs your answer</h3>
            {waiting.map((b) => (
              <div key={b.id} className="row between"><span><b>{wname[b.worker_id]}</b> {b.status === 'applied' ? 'applied to' : 'asks to leave early from'} {b.job.title}</span>
                <Link className="btn sm" to={`/client/works/${b.job_id}`}>Open</Link></div>
            ))}
          </div>
        )}
        <div className="stack"><h2>Your works</h2>
          {jobs.length === 0 ? <Empty>No works yet.{client.verified && <> <Link to="/client/post-work">Post your first work</Link>.</>}</Empty> : (
            <div className="tw"><table>
              <thead><tr><th>Work</th><th>Date</th><th>Booked</th><th>Applicants</th><th>Checked in</th><th>Status</th></tr></thead>
              <tbody>{jobs.map((j) => {
                const label = j.status === 'cancelled' ? 'Cancelled' : j.work_date === today ? 'Today' : j.ends_at < nowIso ? 'Finished' : 'Open';
                const tone = j.status === 'cancelled' ? 'muted' : j.work_date === today ? 'accent' : j.ends_at < nowIso ? 'muted' : 'info';
                return (
                  <tr key={j.id}>
                    <td><Link to={`/client/works/${j.id}`}><b>{j.title}</b></Link><div className="faint" style={{ fontSize: 12.5 }}>{j.venue}</div></td>
                    <td className="num">{day(j.work_date)} · {clock(j.start_time)}</td>
                    <td className="num">{j.bookings.filter((b) => b.status === 'approved').length}/{j.workers_needed}</td>
                    <td className="num">{j.bookings.filter((b) => b.status === 'applied').length}</td>
                    <td className="num">{j.bookings.filter((b) => b.check_in_at).length}</td>
                    <td><Pill tone={tone}>{label}</Pill></td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          )}
        </div>
      </>;
    }}</Body>
  );
};

export default Dashboard;
