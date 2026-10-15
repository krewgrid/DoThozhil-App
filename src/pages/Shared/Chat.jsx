import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { useMe } from '../../lib/session';
import { day } from '../../lib/format';
import { Body, Head, Loading, Page } from '../../components/kg/ui';
import { ChatRoom } from '../../components/kg/Lists';

// Live job chat: the client, approved workers and admins. Kept as a record for disputes.
const Chat = () => {
  const { jobId } = useParams();
  const { user } = useMe();
  const q = useLoad(async () => {
    const { data: allowed } = await supabase.rpc('in_job_chat', { p_job: jobId });
    if (!allowed) return { denied: true };
    const [job, open, msgs, bks] = await Promise.all([
      supabase.from('jobs').select('id, title, work_date, client_id').eq('id', jobId).single().then(must),
      supabase.rpc('chat_open', { p_job: jobId }).then((r) => r.data),
      supabase.from('messages').select('*').eq('job_id', jobId).order('created_at').limit(500).then(must),
      supabase.from('bookings').select('worker_id').eq('job_id', jobId).eq('status', 'approved').then(must),
    ]);
    const ids = [job.client_id, ...(bks ?? []).map((b) => b.worker_id)];
    const [people, client] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', ids).then((r) => r.data),
      supabase.from('client_public').select('id, org_name').eq('id', job.client_id).single().then((r) => r.data),
    ]);
    const names = Object.fromEntries((people ?? []).map((p) => [p.id, p.full_name]));
    if (client) names[job.client_id] = `${names[job.client_id] ?? 'Client'} (${client.org_name})`;
    return { job, open, msgs: msgs ?? [], names, count: ids.length };
  }, [jobId]);

  if (q.data?.denied) return <Page><Loading error="You are not part of this job's chat." /></Page>;
  return (
    <Body q={q}>{({ job, open, msgs, names, count }) => <>
      <Head title="Job chat" sub={`${job.title} · ${day(job.work_date)} · ${count} members. Messages are kept as a record for disputes.`} />
      <ChatRoom jobId={jobId} me={user.id} names={names} initial={msgs} open={!!open} />
    </>}</Body>
  );
};

export default Chat;
