import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad, must, signedUrls } from '../../lib/api';
import { Body, Empty, Head } from '../../components/kg/ui';
import { DisputeList } from '../../components/kg/Lists';

const Disputes = () => {
  const q = useLoad(async () => {
    const ds = must(await supabase.from('disputes').select('*, bookings(jobs(title))').order('status').order('created_at', { ascending: false }).limit(200)) ?? [];
    const ids = [...new Set(ds.map((d) => d.raised_by))];
    const ps = ids.length ? must(await supabase.from('profiles').select('id, full_name').in('id', ids)) ?? [] : [];
    return { ds, names: Object.fromEntries(ps.map((p) => [p.id, p.full_name])), urls: await signedUrls(ds.map((d) => d.photo_path)) };
  }, []);
  return (
    <Body q={q}>{({ ds, names, urls }) => <>
      <Head title="Disputes" sub="Open the work to see OTP, GPS distances, check-out photos and the job chat before deciding." />
      {ds.length ? <DisputeList rows={ds} urls={urls} admin names={names} onDone={q.reload} /> : <Empty>No disputes.</Empty>}
    </>}</Body>
  );
};

export default Disputes;
