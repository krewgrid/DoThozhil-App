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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
