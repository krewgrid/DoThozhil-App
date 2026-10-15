import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad, must, signedUrls } from '../../lib/api';
import { useMe } from '../../lib/session';
import { day } from '../../lib/format';
import { Body, Empty, Head } from '../../components/kg/ui';
import { DisputeForm } from '../../components/kg/Forms';
import { DisputeList } from '../../components/kg/Lists';

const Disputes = () => {
  const { user, client } = useMe();
  const q = useLoad(async () => {
    const jobs = must(await supabase.from('jobs').select('id, title, work_date').eq('client_id', client.id)) ?? [];
    const jobIds = jobs.map((j) => j.id);
    const jobBy = Object.fromEntries(jobs.map((j) => [j.id, j]));
    const [bks, ds] = await Promise.all([
      jobIds.length ? supabase.from('bookings').select('id, job_id, worker_id').in('job_id', jobIds).eq('status', 'approved').then(must) : [],
      supabase.from('disputes').select('*, bookings(jobs(title))').order('created_at', { ascending: false }).then(must),
    ]);
    const wIds = [...new Set((bks ?? []).map((b) => b.worker_id))];
    const wp = wIds.length ? must(await supabase.from('worker_public').select('id, full_name').in('id', wIds)) ?? [] : [];
    const wn = Object.fromEntries(wp.map((w) => [w.id, w.full_name]));
    const options = (bks ?? []).map((b) => ({ id: b.id, label: `${wn[b.worker_id]} · ${jobBy[b.job_id].title} · ${day(jobBy[b.job_id].work_date)}` }));
    return { options, ds: ds ?? [], wn, urls: await signedUrls((ds ?? []).map((d) => d.photo_path)) };
  }, [client.id]);
  return (
    <Body q={q}>{({ options, ds, wn, urls }) => <>
      <Head title="Disputes" sub="Cases on your works. krewgrid checks OTP, GPS, photos and the job chat before deciding." />
      <div className="card"><DisputeForm uid={user.id} bookings={options} onDone={q.reload} /></div>
      <div className="stack"><h2>Cases</h2>{ds.length ? <DisputeList rows={ds} urls={urls} names={wn} /> : <Empty>No disputes.</Empty>}</div>
    </>}</Body>
  );
};

export default Disputes;
