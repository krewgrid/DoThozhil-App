// Forms shared by worker and client pages: check-out, disputes, documents, profile, venue location.
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { ActionForm, H } from "./ui";
import { Camera } from "./Camera";
import { addDocument, checkOut, raiseDispute, updateProfile } from "../../lib/actions";

/** Check-out: photo at the venue (camera only) + GPS, then submit. */
export function CheckOutPanel({ uid, booking, onDone }) {
  const [shot, setShot] = useState(null);
  return (
    <div className="stack">
      <Camera uid={uid} kind="checkout" label="Open camera for check-out photo" onDone={setShot} />
      {shot && (
        <ActionForm run={checkOut} geo onDone={onDone}>
          <H name="booking" value={booking} />
          <H name="photo" value={shot.path} />
          <button className="btn p">Submit check-out</button>
        </ActionForm>
      )}
    </div>
  );
}

/** Dispute form with optional in-app photo proof. */
export function DisputeForm({ uid, bookings, onDone }) {
  const [shot, setShot] = useState(null);
  const [k, setK] = useState(0);
  if (!bookings.length) return <p className="muted">Disputes can be raised on jobs you were booked for.</p>;
  return (
    <ActionForm key={k} run={raiseDispute} className="form" reset onDone={() => { setShot(null); setK((x) => x + 1); onDone?.(); }}>
      <div className="fld"><label htmlFor="d-b">Job</label>
        <select id="d-b" name="booking">{bookings.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select></div>
      <div className="fld"><label htmlFor="d-k">Problem</label>
        <select id="d-k" name="kind">
          <option value="noshow_wrong">No-show report is wrong</option>
          <option value="payment_not_received">Payment not received</option>
          <option value="job_changed">Client changed the job</option>
          <option value="other">Other</option>
        </select></div>
      <div className="fld full"><label htmlFor="d-t">What happened</label>
        <textarea id="d-t" name="description" required placeholder="Times, names, what you were told" /></div>
      <div className="fld full"><label>Photo proof (optional, camera only)</label>
        <Camera uid={uid} kind="disputes" label="Open camera" onDone={setShot} /></div>
      <H name="photo" value={shot?.path} />
      <H name="lat" value={shot?.lat} />
      <H name="lng" value={shot?.lng} />
      <div className="fld full"><div><button className="btn p">Raise dispute</button></div></div>
    </ActionForm>
  );
}

/** Driving licence or police clearance: a photo of it is enough; krewgrid reviews it by hand. */
export function DocumentForm({ uid, onDone }) {
  const [path, setPath] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr("Photo must be under 5 MB"); return; }
    setBusy(true); setErr(null);
    const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const p = `${uid}/documents/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(p, f, { contentType: f.type });
    setBusy(false);
    if (error) setErr(error.message); else setPath(p);
  }

  return (
    <ActionForm run={addDocument} className="form" reset onDone={() => { setPath(""); onDone?.(); }}>
      <div className="fld"><label htmlFor="doc-t">Document</label>
        <select id="doc-t" name="doc_type"><option value="driving_licence">Driving licence</option><option value="police_clearance">Police clearance certificate</option></select></div>
      <div className="fld"><label htmlFor="doc-n">Number</label><input id="doc-n" name="doc_number" required placeholder="KL-07 2020 0012345" /></div>
      <div className="fld"><label htmlFor="doc-e">Expiry date</label><input id="doc-e" type="date" name="expires_on" required /></div>
      <div className="fld"><label htmlFor="doc-p">Photo of the front</label>
        <input id="doc-p" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={pick} /></div>
      {err && <p className="msg err">{err}</p>}
      <H name="photo" value={path} />
      <div className="fld full"><div><button className="btn p" disabled={!path || busy}>{busy ? "Uploading…" : "Submit for review"}</button></div></div>
    </ActionForm>
  );
}

/** Profile form; workers take their profile photo with the front camera. */
export function ProfileForm({ uid, name, area, phone, skills, languages, worker, onDone }) {
  const [avatar, setAvatar] = useState("");
  return (
    <ActionForm run={updateProfile} className="form" onDone={onDone}>
      <div className="fld"><label htmlFor="pf-n">Full name</label><input id="pf-n" name="full_name" defaultValue={name} required /></div>
      <div className="fld"><label htmlFor="pf-a">Area</label><input id="pf-a" name="area" defaultValue={area} /></div>
      <div className="fld"><label htmlFor="pf-p">Phone</label><input id="pf-p" name="phone" defaultValue={phone} required inputMode="tel" /></div>
      {worker && <>
        <div className="fld"><label htmlFor="pf-s">Skills (comma separated)</label><input id="pf-s" name="skills" defaultValue={skills?.join(", ")} /></div>
        <div className="fld"><label htmlFor="pf-l">Languages</label><input id="pf-l" name="languages" defaultValue={languages?.join(", ")} /></div>
        <div className="fld full"><label>Profile photo (front camera)</label>
          <Camera uid={uid} kind="avatar" facing="user" label="Take profile photo" onDone={(r) => setAvatar(r.path)} /></div>
      </>}
      <H name="avatar_path" value={avatar} />
      <div className="fld full"><div><button className="btn p">Save profile</button></div></div>
    </ActionForm>
  );
}

/** Fills the venue's latitude/longitude from the phone's GPS when posting a job. */
export function LocateButton() {
  const [msg, setMsg] = useState(null);
  function locate(e) {
    const form = e.currentTarget.form;
    if (!navigator.geolocation) { setMsg("This browser has no location access"); return; }
    setMsg("Finding location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        form.elements.namedItem("lat").value = p.coords.latitude.toFixed(6);
        form.elements.namedItem("lng").value = p.coords.longitude.toFixed(6);
        setMsg("Venue location set");
      },
      () => setMsg("Could not get location. Paste it from Google Maps instead."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  return (
    <div className="row">
      <button type="button" className="btn sm" onClick={locate}>I'm at the venue: use my location</button>
      {msg && <span className="note">{msg}</span>}
    </div>
  );
}
