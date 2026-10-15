import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { adminVerifyClient } from '../../lib/actions';
import { dateTime } from '../../lib/format';
import { ActionForm, Body, Empty, H, Head } from '../../components/kg/ui';

const Verify = () => {
  const q = useLoad(async () => {
    const cs = must(await supabase.from('clients').select('*').eq('verified', false)) ?? [];
    const ids = cs.map((c) => c.id);
    const [ph, ps] = await Promise.all([
      ids.length ? supabase.from('private_contacts').select('*').in('id', ids).then(must) : [],
      ids.length ? supabase.from('profiles').select('id, area, created_at').in('id', ids).then(must) : [],
    ]);
    return { cs, PH: Object.fromEntries((ph ?? []).map((r) => [r.id, r.phone])), P: Object.fromEntries((ps ?? []).map((r) => [r.id, r])) };
  }, []);
  return (
    <Body q={q}>{({ cs, PH, P }) => <>
      <Head title="Client verification" sub="Call each client, check the business or event, then verify. Only verified clients can post." />
      {!cs.length ? <Empty>Queue is clear.</Empty> : (
        <div className="grid g2">{cs.map((c) => (
          <div key={c.id} className="card stack">
            <div className="row between"><h3>{c.org_name}</h3><span className="faint">{dateTime(P[c.id]?.created_at)}</span></div>
            <p className="muted">{c.contact_name} · <a className="mono" href={`tel:${(PH[c.id] ?? '').replace(/\s/g, '')}`}>{PH[c.id]}</a> · {P[c.id]?.area}</p>
            {c.about && <p>{c.about}</p>}
            <ActionForm run={adminVerifyClient} className="inline" onDone={q.reload}><H name="client" value={c.id} /><H name="verified" value="true" /><button className="btn p sm">Verify client</button></ActionForm>
          </div>
        ))}</div>
      )}
    </>}</Body>
  );
};

export default Verify;
