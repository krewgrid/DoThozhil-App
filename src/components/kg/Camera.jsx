import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { where } from "../../lib/api";

/**
 * Live camera only (no gallery). The photo is stamped with time and GPS,
 * uploaded to the private "photos" bucket under <uid>/<kind>/, and its path handed back.
 */
export function Camera({ uid, kind, label = "Take photo", onDone, facing = "environment" }) {
  const video = useRef(null);
  const stream = useRef(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  async function open() {
    setErr(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
      setOn(true);
      requestAnimationFrame(() => {
        if (video.current) { video.current.srcObject = stream.current; video.current.play(); }
      });
    } catch {
      setErr("Allow camera access in your browser settings to take the photo.");
    }
  }

  async function shoot() {
    const v = video.current;
    if (!v) return;
    setBusy(true);
    const { lat, lng } = await where();
    const w = Math.min(v.videoWidth || 1280, 1280);
    const h = Math.round(w * ((v.videoHeight || 960) / (v.videoWidth || 1280)));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.drawImage(v, 0, 0, w, h);
    const stamp = `${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}  ·  ${lat != null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "no GPS"}  ·  krewgrid`;
    g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(0, h - 40, w, 40);
    g.fillStyle = "#f4f4f5"; g.font = "18px monospace"; g.fillText(stamp, 12, h - 14);
    const blob = await new Promise((r) => c.toBlob((b) => r(b), "image/jpeg", 0.82));
    const path = `${uid}/${kind}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("photos").upload(path, blob, { contentType: "image/jpeg", upsert: false });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    stream.current?.getTracks().forEach((t) => t.stop());
    setOn(false);
    const url = URL.createObjectURL(blob);
    setPreview(url);
    onDone({ path, lat, lng, preview: url });
  }

  return (
    <div className="stack">
      {preview && !on && <img src={preview} alt="Captured" className="photo-img" />}
      {on && <video ref={video} playsInline muted className="photo-img" />}
      <div className="row">
        {!on && <button type="button" className="btn" onClick={open}>{preview ? "Retake" : label}</button>}
        {on && <button type="button" className="btn p" onClick={shoot} disabled={busy}>{busy ? "Saving…" : "Capture"}</button>}
      </div>
      {err && <p className="msg err">{err}</p>}
    </div>
  );
}
