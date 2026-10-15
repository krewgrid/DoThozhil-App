import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad, must, signedUrls } from '../../lib/api';
import { useMe } from '../../lib/session';
import { day } from '../../lib/format';
import { Body, Empty, Head } from '../../components/kg/ui';
import { DisputeForm } from '../../components/kg/Forms';
import { DisputeList } from '../../components/kg/Lists';

const Disputes = () => {
  const { user, worker } = useMe();
  const q = useLoad(async () => {
    const [bks, ds] = await Promise.all([
      supabase.from('bookings').select('id, jobs(title, work_date)').eq('worker_id', worker.id).eq('status', 'approved').order('created_at', { ascending: false }).limit(30).then(must),
      supabase.from('disputes').select('*, bookings(jobs(title))').order('created_at', { ascending: false }).then(must),
    ]);
    return { bks: bks ?? [], ds: ds ?? [], urls: await signedUrls((ds ?? []).map((d) => d.photo_path)) };
  }, [worker.id]);
  return (
    <Body q={q}>{({ bks, ds, urls }) => <>
      <Head title="Disputes" sub="Photos come from the in-app camera only, stamped with time and GPS." />
      <div className="card"><DisputeForm uid={user.id} bookings={bks.map((b) => ({ id: b.id, label: `${b.jobs.title} · ${day(b.jobs.work_date)}` }))} onDone={q.reload} /></div>
      <div className="stack"><h2>Your cases</h2>{ds.length ? <DisputeList rows={ds} urls={urls} /> : <Empty>No disputes.</Empty>}</div>
    </>}</Body>
  );
};

export default Disputes;
