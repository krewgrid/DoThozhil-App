import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { adminAdjustSlots, adminClearFlags, adminSetBan } from '../../lib/actions';
import { ActionForm, Body, H, Head, Level, Pill } from '../../components/kg/ui';

// Workers and clients: bans, slot adjustments, client flags.
const Users = () => {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'clients' ? 'clients' : 'workers';
  const search = sp.get('q') ?? '';
  const flagged = sp.get('flagged');

  const q = useLoad(async () => {
    let pq = supabase.from('profiles').select('*').eq('role', tab === 'workers' ? 'worker' : 'client').order('created_at', { ascending: false }).limit(200);
    if (search) pq = pq.ilike('full_name', `%${search}%`);
    const ps = must(await pq) ?? [];
    const ids = ps.map((p) => p.id);
    const [rows, phones] = await Promise.all([
      ids.length ? supabase.from(tab).select('*').in('id', ids).then(must) : [],
      ids.length ? supabase.from('private_contacts').select('*').in('id', ids).then(must) : [],
    ]);
    return { ps, R: Object.fromEntries((rows ?? []).map((r) => [r.id, r])), PH: Object.fromEntries((phones ?? []).map((r) => [r.id, r.phone])) };
  }, [tab, search]);

  const banForm = (p) => {
    const susp = p.banned || (p.banned_until && new Date(p.banned_until) > new Date());
    return (
      <ActionForm run={adminSetBan} className="inline" confirm={susp ? undefined : 'Ban? Tap again'} onDone={q.reload}>
        <H name="user" value={p.id} /><H name="banned" value={susp ? 'false' : 'true'} />
        <button className={'btn sm' + (susp ? '' : ' d')}>{susp ? 'Unban' : 'Ban'}</button>
      </ActionForm>
    );
  };

  return (
    <Body q={q}>{({ ps, R, PH }) => {
      let list = ps;
      if (tab === 'clients' && flagged) list = list.filter((p) => (R[p.id]?.flags ?? 0) > 0);
      return <>
        <Head title="Users" sub="Worker bans are tied to Aadhaar. Clients are never banned automatically: flags show here and you decide.">
          <div className="seg"><Link className={tab === 'workers' ? 'on' : ''} to="/control-centre/users?tab=workers">Workers</Link><Link className={tab === 'clients' ? 'on' : ''} to="/control-centre/users?tab=clients">Clients</Link></div>
        </Head>
        <form className="row" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get('q'); setSp({ tab, ...(v ? { q: v } : {}), ...(flagged ? { flagged } : {}) }); }}>
          <input name="q" defaultValue={search} placeholder="Search by name" style={{ maxWidth: 280 }} /><button className="btn">Search</button>
          {tab === 'clients' && <Link className="btn ghost" to={flagged ? '/control-centre/users?tab=clients' : '/control-centre/users?tab=clients&flagged=1'}>{flagged ? 'Show all' : 'Flagged only'}</Link>}
        </form>
        <div className="tw"><table>
          {tab === 'workers' ? <>
            <thead><tr><th>Worker</th><th>Phone</th><th>Level</th><th>Rating</th><th>No-shows</th><th>Slots</th><th>KYC</th><th>Status</th><th></th></tr></thead>
            <tbody>{list.map((p) => { const w = R[p.id]; return (
              <tr key={p.id}>
                <td><b>{p.full_name}</b><div className="faint" style={{ fontSize: 12 }}>{p.area}</div></td><td className="mono">{PH[p.id]}</td>
                <td><Level jobs={w?.completed_jobs ?? 0} /> {w?.completed_jobs}</td>
                <td className="num">{w?.rating_count ? (w.rating_sum / w.rating_count).toFixed(1) : '—'}</td><td className="num">{w?.no_shows}</td>
                <td><ActionForm run={adminAdjustSlots} className="inline" onDone={q.reload}><H name="worker" value={p.id} />
                  <span className="num">{w?.slots}</span><input name="delta" type="number" placeholder="±" style={{ width: 64 }} required /><H name="reason" value="manual adjustment" /><button className="btn sm">Adjust</button></ActionForm></td>
                <td>{w?.kyc_status === 'verified' ? <Pill tone="good">…{w.aadhaar_last4}</Pill> : <Pill tone="warn">{w?.kyc_status}</Pill>}</td>
                <td>{p.banned ? <Pill tone="bad">Banned</Pill> : p.banned_until && new Date(p.banned_until) > new Date() ? <Pill tone="warn">Suspended</Pill> : <Pill tone="good">Active</Pill>}{p.ban_reason && <div className="faint" style={{ fontSize: 11.5 }}>{p.ban_reason}</div>}</td>
                <td>{banForm(p)}</td>
              </tr>); })}</tbody>
          </> : <>
            <thead><tr><th>Client</th><th>Phone</th><th>Verified</th><th>Rating</th><th>Flags</th><th>Status</th><th></th></tr></thead>
            <tbody>{list.map((p) => { const c = R[p.id]; return (
              <tr key={p.id}>
                <td><b>{c?.org_name}</b><div className="faint" style={{ fontSize: 12 }}>{p.full_name}</div></td><td className="mono">{PH[p.id]}</td>
                <td>{c?.verified ? <Pill tone="good">Verified</Pill> : <Pill tone="warn">Waiting</Pill>}</td>
                <td className="num">{c?.rating_count ? (c.rating_sum / c.rating_count).toFixed(1) : '—'}</td>
                <td>{c?.flags ? <div className="row"><Pill tone="warn">{c.flags} flag(s)</Pill><ActionForm run={adminClearFlags} className="inline" onDone={q.reload}><H name="client" value={p.id} /><button className="btn sm ghost">Clear</button></ActionForm></div> : <span className="faint">—</span>}</td>
                <td>{p.banned ? <Pill tone="bad">Banned</Pill> : <Pill tone="good">Active</Pill>}</td>
                <td>{banForm(p)}</td>
              </tr>); })}</tbody>
          </>}
        </table></div>
      </>;
    }}</Body>
  );
};

export default Users;
