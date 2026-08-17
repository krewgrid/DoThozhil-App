import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PrismaHero } from './ui/prisma-hero';

const Layout = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    } else {
      const userMeta = session.user?.user_metadata || {};
      if (userMeta.username) {
        localStorage.setItem('krewgrid_username', userMeta.username);
      }
      if (userMeta.role) {
        localStorage.setItem('krewgrid_role', userMeta.role);
      }
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>Loading securely...</div>;
  }
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white/30">
        <div className="flex h-screen">
          {/* Admin Sidebar */}
          <div className="w-64 border-r border-white/10 bg-zinc-950 p-6 flex flex-col gap-6">
            <div className="text-xl font-bold tracking-tight">krewgrid control</div>
            <nav className="flex flex-col gap-2 flex-1">
              <div className="px-3 py-2 rounded-md bg-white/10 text-white font-medium text-sm cursor-pointer">Overview</div>
              <div className="px-3 py-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 font-medium text-sm cursor-pointer transition-colors">Disputes</div>
              <div className="px-3 py-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 font-medium text-sm cursor-pointer transition-colors">No-Shows</div>
              <div className="px-3 py-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 font-medium text-sm cursor-pointer transition-colors">Users</div>
            </nav>
            <button onClick={handleSignOut} className="px-3 py-2 rounded-md text-red-400 hover:text-red-300 hover:bg-red-400/10 font-medium text-sm text-left transition-colors">
              Sign Out
            </button>
          </div>
          {/* Admin Content */}
          <div className="flex-1 overflow-auto bg-zinc-950/50">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  const path = location.pathname;
  let activeItem = "Dashboard";
  let isHome = false;

  if (path.endsWith('/home')) {
    activeItem = "Home";
    isHome = true;
  } else if (path.includes('dashboard')) activeItem = "Dashboard";
  else if (path.includes('post-work')) activeItem = "Post a work";
  else if (path.includes('get-work')) activeItem = "Get a work";
  else if (path.includes('reviews') && role === 'client') activeItem = "Review Workers";
  else if (path.includes('reviews') && role === 'worker') activeItem = "Review Clients";
  else if (path.includes('report-no-show')) activeItem = "Report No Show";
  else if (path.includes('profile')) activeItem = "Profile";
  else if (path.includes('contact')) activeItem = "Contact Us";
  else if (path.includes('buy-slots')) activeItem = "Buy Slots";
  else if (path.includes('disputes')) activeItem = "Disputes";

  const handleNavClick = (item) => {
    if (item === "Home") navigate(`/${role}/home`);
    else if (item === "Dashboard") navigate(`/${role}/dashboard`);
    else if (item === "Post a work") navigate('/client/post-work');
    else if (item === "Get a work") navigate('/worker/get-work');
    else if (item === "Review Workers") navigate('/client/reviews');
    else if (item === "Review Clients") navigate('/worker/reviews');
    else if (item === "Report No Show") navigate('/client/report-no-show');
    else if (item === "Profile") navigate(`/${role}/profile`);
    else if (item === "Contact Us") navigate(`/${role}/contact`);
    else if (item === "Buy Slots") navigate('/worker/buy-slots');
    else if (item === "Disputes") navigate('/worker/disputes');
  };

  const handlePrimaryAction = () => {
    if (role === 'client') navigate('/client/post-work');
    else navigate('/worker/get-work');
  };

  return (
    <PrismaHero 
      role={role} 
      activeItem={activeItem} 
      isHome={isHome}
      onNavClick={handleNavClick} 
      onSignOut={handleSignOut} 
      onPrimaryAction={handlePrimaryAction}
    >
      <Outlet />
    </PrismaHero>
  );
};

export default Layout;
