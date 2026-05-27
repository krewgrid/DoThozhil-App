import React, { useEffect, useState } from 'react';
import { User, Ticket, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const UpperBanner = ({ role }) => {
  const [username, setUsername] = useState('');
  const [slotsLeft, setSlotsLeft] = useState(10);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('dothozhil_username');
    localStorage.removeItem('dothozhil_role');
    navigate('/login');
  };

  const handleInvite = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.user_metadata?.my_referral_code) {
      alert(`Share this unique code with your friends to earn free slots: ${user.user_metadata.my_referral_code}`);
    } else {
      alert("Referral code not found. You might be on an older account.");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('dothozhil_username');
    if (storedUser) {
      setUsername(storedUser);
      if (role === 'worker' && supabase) {
        fetchWorkerSlots(storedUser);

        const handleSlotUpdate = () => fetchWorkerSlots(storedUser);
        window.addEventListener('slotConsumed', handleSlotUpdate);
        return () => window.removeEventListener('slotConsumed', handleSlotUpdate);
      }
    }
  }, [role]);

  const fetchWorkerSlots = async (userId) => {
    const { data, error } = await supabase
      .from('work_assignments')
      .select('slots_consumed')
      .eq('worker_id', userId);
    
    if (!error && data) {
      const consumed = data.reduce((sum, row) => sum + (row.slots_consumed || 1), 0);
      setSlotsLeft(Math.max(0, 10 - consumed));
    }
  };

  return (
    <div className="upper-banner">
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {username && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)', paddingRight: '1rem', borderRight: '1px solid var(--border-color)' }}>
            <User size={18} color="var(--brand-color)" />
            {username}
          </div>
        )}
        {role === 'worker' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#d97706', paddingRight: '1rem', borderRight: '1px solid var(--border-color)' }}>
            <Ticket size={18} />
            {slotsLeft} Slots Left
          </div>
        )}
        <a href="#tnc" style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)' }}>T&C</a>
        {role === 'worker' && (
          <button onClick={handleInvite} className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Invite & Earn Slots</button>
        )}
        <button className="mobile-signout" onClick={handleSignOut}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UpperBanner;
