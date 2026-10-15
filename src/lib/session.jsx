// The signed-in person with their worker or client row, shared with every page.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const MeContext = createContext(null);

async function loadMe() {
  if (!supabase) return { user: null, error: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." };
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return { user: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return { user, profile: null, worker: null, client: null, phone: null };
  const [{ data: worker }, { data: client }, { data: contact }] = await Promise.all([
    profile.role === "worker" ? supabase.from("workers").select("*").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    profile.role === "client" ? supabase.from("clients").select("*").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("private_contacts").select("phone").eq("id", user.id).maybeSingle(),
  ]);
  return { user, profile, worker, client, phone: contact?.phone ?? null };
}

export function MeProvider({ children }) {
  const [me, setMe] = useState({ loading: true });

  const refresh = useCallback(async () => {
    const m = await loadMe();
    setMe({ ...m, loading: false });
    return m;
  }, []);

  useEffect(() => {
    refresh();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  return <MeContext.Provider value={{ ...me, refresh }}>{children}</MeContext.Provider>;
}

export const useMe = () => useContext(MeContext);

/** Where a signed-in person belongs. */
export function homeFor(me) {
  if (!me?.user) return "/login";
  if (!me.profile) return "/complete-profile";
  if (me.profile.role === "worker") return "/worker/home";
  return me.profile.is_admin ? "/control-centre/dashboard" : "/client/home";
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.assign("/login");
}
