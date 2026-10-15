import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { money, todayIST } from '../../lib/format';
import { Body, Head, Stat } from '../../components/kg/ui';

// Control Centre overview.
const Dashboard = () => {
  const q = useLoad(async () => {
    const [s, today] = await Promise.all([
      supabase.rpc('admin_stats').then(must),
      supabase.from('jobs').select('id, title, client_id, bookings(status, check_in_at)').eq('work_date', todayIST()).eq('status', 'open').then(must),
    ]);
    return { s: s ?? {}, today: today ?? [] };
  }, []);
  return (
    <Body q={q}>{({ s, today }) => <>
      <Head title="Control Centre" sub="Everything happening on krewgrid, Kochi." />
      <div className="grid g5">
        <Stat k="Workers" v={s.workers} s={`+${s.workers_today} today`} />
        <Stat k="Verified clients" v={s.clients} s={`${s.clients_waiting} waiting`} />
        <Stat k="Works posted" v={s.jobs_month} s="this month" />
        <Stat k="Slot revenue" v={money((s.revenue_month_paise ?? 0) / 100)} s="this month" />
        <Stat k="Open disputes" v={s.disputes_open} />
      </div>
      <div className="grid g2">
        <div className="card stack"><h3>Needs attention</h3>
          <div className="row between"><span>Clients to verify</span><Link className="btn sm" to="/control-centre/verify">{s.clients_waiting} waiting</Link></div>
          <div className="row between"><span>Documents to review</span><Link className="btn sm" to="/control-centre/documents">{s.docs_pending} waiting</Link></div>
          <div className="row between"><span>Disputes</span><Link className="btn sm" to="/control-centre/disputes">{s.disputes_open} open</Link></div>
          <div className="row between"><span>Flagged clients</span><Link className="btn sm" to="/control-centre/users?tab=clients&flagged=1">{s.flagged_clients} flagged</Link></div>
        </div>
        <div className="card stack"><h3>Today's works</h3>
          {today.length === 0 && <p className="muted">No works today.</p>}
          {today.map((j) => {
            const bk = j.bookings.filter((b) => b.status === 'approved');
            return <div key={j.id} className="row between"><Link to={`/control-centre/works/${j.id}`}>{j.title}</Link><span className="num faint">{bk.filter((b) => b.check_in_at).length}/{bk.length} checked in</span></div>;
          })}
        </div>
      </div>
    </>}</Body>
  );
};

export default Dashboard;
