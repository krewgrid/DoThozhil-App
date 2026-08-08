import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, Search, FileText, Settings, LogOut, MessageSquare, Headphones } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('krewgrid_username');
    localStorage.removeItem('krewgrid_role');
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

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
  ];

  const links = role === 'admin' ? adminLinks : role === 'client' ? clientLinks : workerLinks;

  return (
    <div className="sidebar">
      <div className="sidebar-header desktop-only" style={{ flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        <img src="/logo.png" alt="krewgrid" style={{ height: '32px', objectFit: 'contain', alignSelf: 'flex-start', mixBlendMode: 'screen', filter: 'brightness(1.2)' }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{role === 'admin' ? 'Admin Portal' : role === 'client' ? 'Client Portal' : 'Worker Portal'}</p>
      </div>
      <div className="sidebar-links">
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
                borderRadius: '1rem',
                backgroundColor: isActive ? 'rgba(191, 219, 158, 0.15)' : 'transparent',
                color: isActive ? 'var(--brand-color)' : 'var(--text-muted)',
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
      <div className="sidebar-footer">
        <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--danger)', fontWeight: '500', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
