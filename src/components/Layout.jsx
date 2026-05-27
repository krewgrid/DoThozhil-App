import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import UpperBanner from './UpperBanner';
import { supabase } from '../lib/supabase';

const Layout = ({ role }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    } else {
      // Sync localStorage with the secure session in case of a page reload
      const userMeta = session.user?.user_metadata || {};
      if (userMeta.username) {
        localStorage.setItem('dothozhil_username', userMeta.username);
      }
      if (userMeta.role) {
        localStorage.setItem('dothozhil_role', userMeta.role);
      }
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>Loading securely...</div>;
  }

  return (
    <div className="app-container">
      <Sidebar role={role} />
      <div className="main-content">
        <UpperBanner role={role} />
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
