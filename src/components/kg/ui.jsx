// Small UI kit for the krewgrid pages, styled in the site's glass-on-green look (src/kg.css).
import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { initials, levelName } from "../../lib/format";
import { where } from "../../lib/api";

/** Scrollable content area inside the PrismaHero frame. */
export function Page({ children }) {
  const banner = useOutletContext()?.banner;
  return (
    <div className="kg kg-page">
      {banner && <div className="banner">{banner}</div>}
      {children}
    </div>
  );
}

export function Head({ title, sub, children }) {
  return (
    <div className="head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {children && <div className="row">{children}</div>}
    </div>
  );
}

export const Pill = ({ tone = "muted", children }) => <span className={`pill ${tone}`}>{children}</span>;

export function Level({ jobs }) {
  const l = levelName(jobs ?? 0);
  return <span className={`lvl ${l}`}>{l}</span>;
}

export function Avatar({ name, url, lg }) {
  return url
    ? <img className={"av" + (lg ? " lg" : "")} src={url} alt="" />
    : <span className={"av" + (lg ? " lg" : "")} aria-hidden="true">{initials(name)}</span>;
}

export function Stat({ k, v, s }) {
  return <div className="stat"><span className="k">{k}</span><span className="v">{v}</span>{s && <span className="s">{s}</span>}</div>;
}

export const Empty = ({ children }) => <div className="card muted">{children}</div>;

export function Loading({ error }) {
  return <div className="center">{error ? <p className="msg err">{error}</p> : "Loading…"}</div>;
}

/**
 * A form that runs an action and shows its result inline (port of the server-action ActionForm).
 * run(formData) returns { ok } or { error }. With `geo`, the GPS position is added as lat/lng.
 * With `confirm`, the first tap changes the button label and the second tap sends.
 */
export function ActionForm({ run, onDone, children, className, geo = false, reset = false, confirm }) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const ref = useRef(null);

  function restoreLabel() {
    const btn = ref.current?.querySelector("button[data-label]");
    if (btn) { btn.textContent = btn.dataset.label; delete btn.dataset.label; }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (confirm && !armed) {
      const btn = e.nativeEvent.submitter ?? form.querySelector("button:not([type=button])");
      if (btn) { btn.dataset.label = btn.textContent; btn.textContent = confirm; }
      setArmed(true);
      return;
    }
    setArmed(false);
    restoreLabel();
    const fd = new FormData(form);
    const sub = e.nativeEvent.submitter;
    if (sub?.name) fd.set(sub.name, sub.value);
    setBusy(true);
    setState(null);
    if (geo) {
      const { lat, lng } = await where();
      if (lat != null) { fd.set("lat", String(lat)); fd.set("lng", String(lng)); }
    }
    let res;
    try { res = await run(fd); } catch (err) { res = { error: err.message ?? String(err) }; }
    setBusy(false);
    setState(res);
    if (res?.ok) {
      toast(res.ok);
      if (reset) form.reset();
      onDone?.(res);
    }
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className={className} aria-busy={busy} data-busy={busy || undefined}>
      {children}
      {state?.error && <p className="msg err" role="alert">{state.error}</p>}
    </form>
  );
}

/** Success messages survive the page reloading its data. */
export function toast(msg) {
  window.dispatchEvent(new CustomEvent("kg-toast", { detail: msg }));
}

export function Toaster() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const id = Math.random();
      setList((l) => [...l, { id, msg: e.detail }]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 5000);
    };
    window.addEventListener("kg-toast", on);
    return () => window.removeEventListener("kg-toast", on);
  }, []);
  if (!list.length) return null;
  return (
    <div className="kg" style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", flexDirection: "column", gap: 8, width: "min(92vw, 440px)" }} role="status" aria-live="polite">
      {list.map((t) => <div key={t.id} className="msg ok" style={{ background: "rgba(6,40,20,.95)", boxShadow: "0 10px 30px rgba(0,0,0,.4)", fontSize: 14 }}>{t.msg}</div>)}
    </div>
  );
}

/** Hidden input shorthand. */
export const H = ({ name, value }) => <input type="hidden" name={name} value={value ?? ""} />;

/** Wraps a page: loading/error state, then the content. */
export function Body({ q, children }) {
  if (q.loading && !q.data) return <Page><Loading /></Page>;
  if (q.error && !q.data) return <Page><Loading error={q.error} /></Page>;
  return <Page>{children(q.data)}</Page>;
}
