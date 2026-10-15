import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad, must, signedUrls } from '../../lib/api';
import { useMe } from '../../lib/session';
import { Avatar, Body, Empty, Head, Level } from '../../components/kg/ui';

/** Workers this client rated 4★ or 5★: the people worth booking again. */
const Saved = () => {
  const { client } = useMe();
  const q = useLoad(async () => {
    const jobs = must(await supabase.from('jobs').select('id').eq('client_id', client.id)) ?? [];
    const jobIds = jobs.map((j) => j.id);
    const bks = jobIds.length ? must(await supabase.from('bookings').select('id, worker_id').in('job_id', jobIds).not('check_out_at', 'is', null)) ?? [] : [];
    const bIds = bks.map((b) => b.id);
    const rs = bIds.length ? must(await supabase.from('ratings').select('booking_id, stars').eq('rater', 'client').gte('stars', 4).in('booking_id', bIds)) ?? [] : [];
    const good = new Set(rs.map((r) => r.booking_id));
    const ids = [...new Set(bks.filter((b) => good.has(b.id)).map((b) => b.worker_id))];
    const wp = ids.length ? must(await supabase.from('worker_public').select('*').in('id', ids)) ?? [] : [];
    return { wp, urls: await signedUrls(wp.map((w) => w.avatar_path)) };
  }, [client.id]);
  return (
    <Body q={q}>{({ wp, urls }) => <>
      <Head title="Saved workers" sub="Workers you rated 4★ or 5★. Call them directly or book them on your next job." />
      {!wp.length ? <Empty>Rate workers after a job and your favourites appear here.</Empty> : (
        <div className="grid g3">{wp.map((w) => (
          <div key={w.id} className="card stack">
            <div className="row"><Avatar name={w.full_name} url={w.avatar_path ? urls[w.avatar_path] : null} /><div><b>{w.full_name}</b><div className="faint" style={{ fontSize: 12.5 }}>{w.area}</div></div></div>
            <div className="row"><Level jobs={w.completed_jobs} /><span className="pill">★ {w.rating ?? '—'}</span><span className="pill">{w.completed_jobs} jobs</span></div>
            <div className="row">{w.skills.map((s) => <span key={s} className="tag">{s}</span>)}</div>
          </div>
        ))}</div>
      )}
    </>}</Body>
  );
};

export default Saved;
