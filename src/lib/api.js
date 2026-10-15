// Data helpers: RPC calls, loading hooks, live updates, private photo URLs and
// calls to the Vercel /api functions (Razorpay, Aadhaar KYC).
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

/** Calls a Postgres function. Returns { ok } or { error } like the old server actions. */
export async function rpc(fn, args, ok) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { error: error.message };
  return { ok: typeof ok === "function" ? ok(data) : ok, data };
}

/** Loads data with an async function; reload() runs it again. */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const reload = useCallback(async () => {
    const n = ++seq.current;
    try {
      const data = await fnRef.current();
      if (n === seq.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (n === seq.current) setState((s) => ({ ...s, loading: false, error: e.message ?? String(e) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}

/** Throws on a Supabase error so useLoad can show it. */
export function must({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

/** Runs onChange whenever rows in a table change (live attendance, early check-out requests). */
export function useLive(table, filter, onChange) {
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    if (!filter) return;
    const ch = supabase
      .channel(`live-${table}-${filter}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter }, () => cb.current())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [table, filter]);
}

/** Signed URLs for private photos (row-level security decides who may see each one). */
export async function signedUrls(paths) {
  const list = [...new Set((paths ?? []).filter(Boolean))];
  if (!list.length) return {};
  const { data } = await supabase.storage.from("photos").createSignedUrls(list, 3600);
  const out = {};
  data?.forEach((d) => { if (d.signedUrl && d.path) out[d.path] = d.signedUrl; });
  return out;
}

/** POST to one of our /api functions with the signed-in user's token. */
export async function api(path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const r = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(session ? { authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  let out = {};
  try { out = await r.json(); } catch { /* empty body */ }
  return { ok: r.ok, status: r.status, ...out };
}

/** Browser GPS position or nulls. */
export function where() {
  return new Promise((res) => {
    if (!navigator.geolocation) return res({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => res({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
