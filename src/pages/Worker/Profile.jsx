import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { api, useLoad, must, signedUrls } from '../../lib/api';
import { useMe } from '../../lib/session';
import { Avatar, Body, Head, Level, Pill } from '../../components/kg/ui';
import { DocumentForm, ProfileForm } from '../../components/kg/Forms';

// Worker profile: what clients see, Aadhaar KYC, details + camera photo, licences for review.
const Profile = () => {
  const me = useMe();
  const { user, profile, worker, phone } = me;
  const [sp] = useSearchParams();
  const [kycBusy, setKycBusy] = useState(false);
  const [kycErr, setKycErr] = useState(sp.get('kyc') === 'failed' ? 'Verification did not complete. Try again.' : null);

  const q = useLoad(async () => {
    const docs = must(await supabase.from('documents').select('*').eq('worker_id', worker.id).order('created_at', { ascending: false })) ?? [];
    return { docs, urls: await signedUrls([profile.avatar_path]) };
  }, [worker.id, profile.avatar_path]);

  async function startKyc() {
    setKycBusy(true); setKycErr(null);
    const r = await api('/api/kyc/start');
    if (r.ok && r.url) { window.location.assign(r.url); return; }
    setKycBusy(false);
    setKycErr(r.error ?? 'Could not start verification. Try again.');
  }

  const rating = worker.rating_count ? (worker.rating_sum / worker.rating_count).toFixed(1) : 'new';
  return (
    <Body q={q}>{({ docs, urls }) => <>
      <Head title="Profile" sub="What clients see when you apply." />
      <div className="card row" style={{ gap: 18, alignItems: 'flex-start' }}>
        <Avatar name={profile.full_name} url={profile.avatar_path ? urls[profile.avatar_path] : null} lg />
        <div className="stack" style={{ gap: 6, flex: 1, minWidth: 220 }}>
          <div className="row"><h2>{profile.full_name}</h2><Level jobs={worker.completed_jobs} /></div>
          <p className="muted">{profile.area} · {worker.languages.join(', ')} · ★ {rating} · {worker.completed_jobs} jobs</p>
          <div className="row">{worker.skills.map((s) => <span key={s} className="tag">{s}</span>)}</div>
        </div>
      </div>

      <div className="card stack" id="kyc">
        <div className="row between"><h3>Aadhaar verification</h3>
          {worker.kyc_status === 'verified' ? <Pill tone="good">Verified · XXXX XXXX {worker.aadhaar_last4}</Pill> : <Pill tone="warn">Not verified</Pill>}</div>
        {worker.kyc_status !== 'verified' && <>
          <p className="muted">Required before your first application. krewgrid stores only the last 4 digits. One Aadhaar can have one account.</p>
          {kycErr && <p className="msg err">{kycErr}</p>}
          <div><button className="btn p" onClick={startKyc} disabled={kycBusy}>{kycBusy ? 'Starting…' : 'Verify with Aadhaar'}</button></div>
        </>}
      </div>

      <div className="card stack"><h3>Your details</h3>
        <ProfileForm uid={user.id} name={profile.full_name} area={profile.area ?? ''} phone={phone ?? ''} skills={worker.skills} languages={worker.languages} worker onDone={me.refresh} />
      </div>

      <div className="card stack"><h3>Documents and licences</h3>
        <p className="muted">Valet jobs need a driving licence. A clear photo is enough; the krewgrid team checks it by hand.</p>
        {docs.map((d) => (
          <div key={d.id} className="row between"><div><b>{d.doc_type === 'driving_licence' ? 'Driving licence' : 'Police clearance'}</b>
            <div className="faint mono" style={{ fontSize: 12 }}>{d.doc_number} · expires {d.expires_on}{d.note && ` · ${d.note}`}</div></div>
            <Pill tone={d.status === 'approved' ? 'good' : d.status === 'rejected' ? 'bad' : 'warn'}>{d.status === 'pending' ? 'Pending review' : d.status}</Pill></div>
        ))}
        <DocumentForm uid={user.id} onDone={q.reload} />
      </div>
    </>}</Body>
  );
};

export default Profile;
