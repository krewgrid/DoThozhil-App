import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad, must, signedUrls } from '../../lib/api';
import { adminReviewDocument } from '../../lib/actions';
import { dateTime } from '../../lib/format';
import { ActionForm, Body, Empty, H, Head, Pill } from '../../components/kg/ui';

const docName = (t) => (t === 'driving_licence' ? 'Driving licence' : 'Police clearance');

const Documents = () => {
  const q = useLoad(async () => {
    const docs = must(await supabase.from('documents').select('*').order('status').order('created_at', { ascending: false }).limit(200)) ?? [];
    const ps = docs.length ? must(await supabase.from('profiles').select('id, full_name').in('id', docs.map((d) => d.worker_id))) ?? [] : [];
    return { docs, name: Object.fromEntries(ps.map((p) => [p.id, p.full_name])), urls: await signedUrls(docs.filter((d) => d.status === 'pending').map((d) => d.photo_path)) };
  }, []);
  return (
    <Body q={q}>{({ docs, name, urls }) => {
      const soon = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
      const pending = docs.filter((d) => d.status === 'pending');
      const expiring = docs.filter((d) => d.status === 'approved' && d.expires_on <= soon);
      return <>
        <Head title="Document review" sub="Check the photo matches the number and the worker's name. Expired documents stop counting automatically." />
        {pending.length === 0 ? <Empty>Nothing to review.</Empty> : (
          <div className="grid g2">{pending.map((d) => (
            <div key={d.id} className="card stack">
              <div className="row between"><b>{name[d.worker_id]}</b><span className="faint">{dateTime(d.created_at)}</span></div>
              <p>{docName(d.doc_type)} · <span className="mono">{d.doc_number}</span> · expires {d.expires_on}</p>
              {urls[d.photo_path] && <a href={urls[d.photo_path]} target="_blank" rel="noreferrer"><img src={urls[d.photo_path]} alt="Document" className="photo-img" /></a>}
              <div className="row">
                <ActionForm run={adminReviewDocument} className="inline" onDone={q.reload}><H name="doc" value={d.id} /><H name="decision" value="approve" /><button className="btn p sm">Approve</button></ActionForm>
                <ActionForm run={adminReviewDocument} className="inline" onDone={q.reload}><H name="doc" value={d.id} /><H name="decision" value="reject" />
                  <input name="note" placeholder="Reason, e.g. photo unclear" required /><button className="btn d sm">Reject</button></ActionForm>
              </div>
            </div>
          ))}</div>
        )}
        <div className="card stack"><h3>Expiring in 90 days</h3>
          {expiring.length === 0 ? <p className="muted">None.</p> : expiring.map((d) => <div key={d.id} className="row between"><span>{name[d.worker_id]} · {docName(d.doc_type)}</span><Pill tone="warn">{d.expires_on}</Pill></div>)}
        </div>
      </>;
    }}</Body>
  );
};

export default Documents;
