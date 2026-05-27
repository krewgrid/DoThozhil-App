import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, Search, FileText, Settings, LogOut, MessageSquare, Headphones } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('dothozhil_username');
    localStorage.removeItem('dothozhil_role');
    navigate('/login');
  };

  const clientLinks = [
    { name: 'Dashboard', path: '/client/dashboard', icon: <Home size={20} /> },
    { name: 'Post A Work', path: '/client/post-work', icon: <PlusSquare size={20} /> },
    { name: 'Review Workers', path: '/client/reviews', icon: <FileText size={20} /> },
    { name: 'Report No Show', path: '/client/report-no-show', icon: <MessageSquare size={20} /> },
    { name: 'Contact Us', path: '/client/contact', icon: <Headphones size={20} /> },
  ];

  const workerLinks = [
    { name: 'Dashboard', path: '/worker/dashboard', icon: <Home size={20} /> },
    { name: 'Get a Work', path: '/worker/get-work', icon: <Search size={20} /> },
    { name: 'Buy Slots', path: '/worker/buy-slots', icon: <PlusSquare size={20} /> },
    { name: 'Review Clients', path: '/worker/reviews', icon: <FileText size={20} /> },
    { name: 'Disputes', path: '/worker/disputes', icon: <MessageSquare size={20} /> },
    { name: 'Contact Us', path: '/worker/contact', icon: <Headphones size={20} /> },
  ];

  const links = role === 'client' ? clientLinks : workerLinks;

  return (
    <div style={{ width: '250px', backgroundColor: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--brand-color)' }}>DoThozhil</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{role === 'client' ? 'Client Portal' : 'Worker Portal'}</p>
      </div>
      <div style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: isActive ? 'var(--brand-color)' : 'transparent',
                color: isActive ? '#0f172a' : 'var(--text-main)',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s',
              }}
            >
              {link.icon}
              {link.name}
            </Link>
          );
        })}
      </div>
      <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
        <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--danger)', fontWeight: '500', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
