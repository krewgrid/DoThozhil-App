import React, { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useMe, homeFor, signOut } from '../lib/session';
import { suspension } from '../lib/format';
import { PrismaHero } from './ui/prisma-hero';

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#aaa' }}>
    Loading securely...
  </div>
);

// Nav label -> path, per role. "Home" shows the krewgrid hero.
const WORKER_NAV = {
  'Home': '/worker/home', 'Dashboard': '/worker/dashboard', 'Find work': '/worker/get-work', 'My works': '/worker/works',
  'Buy Slots': '/worker/buy-slots', 'Levels': '/worker/levels', 'Disputes': '/worker/disputes', 'Profile': '/worker/profile',
  'Contact Us': '/worker/contact', 'Control Centre': '/control-centre/dashboard',
};
const CLIENT_NAV = {
  'Home': '/client/home', 'Dashboard': '/client/dashboard', 'Post a work': '/client/post-work', 'Saved workers': '/client/saved',
  'Disputes': '/client/disputes', 'Profile': '/client/profile', 'Contact Us': '/client/contact', 'Control Centre': '/control-centre/dashboard',
};
// Pages that live under another nav item.
const ALIASES = [['/worker/job/', 'My works'], ['/worker/chat/', 'My works'], ['/client/works/', 'Dashboard'], ['/client/chat/', 'Dashboard']];

const ADMIN_NAV = [
  ['dashboard', 'Overview', '📊'], ['works', 'All works', '📋'], ['users', 'Users', '👥', 'flagged_clients'],
  ['verify', 'Client verification', '✅', 'clients_waiting'], ['disputes', 'Disputes', '⚖️', 'disputes_open'],
  ['documents', 'Document review', '🪪', 'docs_pending'], ['categories', 'Categories', '🏷️'], ['settings', 'Settings', '⚙️'],
];

function useClientWaiting(me, role) {
  const [n, setN] = useState(0);
  const location = useLocation();
  useEffect(() => {
    if (role !== 'client' || !me?.client) return;
    (async () => {
      const { data: jobs } = await supabase.from('jobs').select('id').eq('client_id', me.client.id).eq('status', 'open');
      const ids = (jobs ?? []).map((j) => j.id);
      if (!ids.length) return setN(0);
      const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).in('job_id', ids).or('status.eq.applied,early_status.eq.pending');
      setN(count ?? 0);
    })();
  }, [me?.client, role, location.pathname]);
  return n;
}

function useAdminStats(isAdmin) {
  const [s, setS] = useState({});
  const location = useLocation();
  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc('admin_stats').then(({ data }) => setS(data ?? {}));
  }, [isAdmin, location.pathname]);
  return s;
}

const Layout = ({ role }) => {
  const me = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const waiting = useClientWaiting(me, role);
  const stats = useAdminStats(role === 'admin' && me?.profile?.is_admin);
  const refresh = me?.refresh;

  // Keep slots, verification and bans current as people move between pages.
  useEffect(() => { refresh?.(); }, [location.pathname, refresh]);

  if (me.loading) return <Spinner />;
  if (!me.user) return <Navigate to="/login" replace />;
  if (!me.profile) return <Navigate to="/complete-profile" replace />;

  const p = me.profile;
  if (role === 'admin' && !p.is_admin) return <Navigate to={homeFor(me)} replace />;
  if (role === 'worker' && (p.role !== 'worker' || !me.worker)) return <Navigate to={homeFor(me)} replace />;
  if (role === 'client' && (p.role !== 'client' || !me.client)) return <Navigate to={homeFor(me)} replace />;

  if (role === 'admin') {
    const nav = (
      <nav className="flex flex-col gap-1 flex-1">
        {ADMIN_NAV.map(([path, label, icon, badge]) => (
          <NavLink key={path} to={`/control-centre/${path}`} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `px-3 py-2.5 rounded-md font-medium text-sm transition-colors flex items-center gap-3 ${isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
            <span>{icon}</span>{label}
            {badge && stats[badge] ? <span className="ml-auto rounded-full bg-[#1DBC60] px-2 text-[11px] font-bold text-black">{stats[badge]}</span> : null}
          </NavLink>
        ))}
        <NavLink to={p.role === 'worker' ? '/worker/dashboard' : '/client/dashboard'} className="mt-4 px-3 py-2.5 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-white/5">
          ↩ My {p.role} view
        </NavLink>
      </nav>
    );
    const signOutBtn = (
      <button onClick={signOut} className="px-3 py-2 rounded-md text-red-400 hover:text-red-300 hover:bg-red-400/10 font-medium text-sm text-left transition-colors">Sign Out</button>
    );
    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white/30 kg-admin">
        <div className="flex h-screen">
          <div className="hidden md:flex md:w-64 md:flex-col border-r border-white/10 bg-zinc-950 p-6 gap-6">
            <div className="text-xl font-bold tracking-tight">krewgrid control</div>
            {nav}{signOutBtn}
          </div>
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <div className="relative w-64 h-full bg-zinc-950 border-r border-white/10 p-6 flex flex-col gap-6 shadow-2xl">
                <div className="text-xl font-bold tracking-tight">krewgrid control</div>
                {nav}{signOutBtn}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-auto flex flex-col" style={{ background: 'linear-gradient(to bottom right, rgba(29,188,96,.22), #0a0a0a 45%)' }}>
            <div className="md:hidden flex items-center p-4 border-b border-white/10 bg-zinc-950">
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-zinc-400 hover:text-white" aria-label="Open menu">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="ml-2 font-bold">krewgrid control</div>
            </div>
            <Outlet context={{ banner: null }} />
          </div>
        </div>
      </div>
    );
  }

  const map = role === 'client' ? CLIENT_NAV : WORKER_NAV;
  const navItems = [...Object.keys(map).filter((k) => k !== 'Control Centre' || p.is_admin), 'Sign Out'];
  const path = location.pathname.replace(/\/$/, '');
  const isHome = path.endsWith('/home');
  const activeItem = Object.keys(map).find((k) => map[k] === path) ?? ALIASES.find(([pre]) => path.startsWith(pre))?.[1];

  const banner = suspension(p) ?? (role === 'client' && !me.client.verified
    ? "krewgrid is verifying your account. We'll call you on your number. You can post work once verified."
    : null);

  return (
    <>
      <PrismaHero
        role={role}
        activeItem={activeItem}
        isHome={isHome}
        navItems={navItems}
        badges={role === 'client' ? { Dashboard: waiting } : {}}
        onNavClick={(item) => map[item] && navigate(map[item])}
        onSignOut={signOut}
        onPrimaryAction={() => navigate(role === 'client' ? '/client/post-work' : '/worker/get-work')}
      >
        <Outlet context={{ banner }} />
      </PrismaHero>
    </>
  );
};

export default Layout;
