import React, { useEffect, useState } from 'react';
import { User, Ticket, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const UpperBanner = ({ role }) => {
  const [username, setUsername] = useState('');
  const [slotsLeft, setSlotsLeft] = useState(10);
  const [showTnc, setShowTnc] = useState(false);
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
        <button onClick={() => setShowTnc(true)} style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>T&C</button>
        {role === 'worker' && (
          <button onClick={handleInvite} className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Invite & Earn Slots</button>
        )}
        <button className="mobile-signout" onClick={handleSignOut}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      {showTnc && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--brand-color)' }}>Terms & Conditions</h2>
            
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: '600', marginTop: '1rem', marginBottom: '0.5rem' }}>1. Slot Consumption</h4>
              <p>When a worker joins a work, it consumes their personal slots. If a worker fails to show up for a confirmed work, they may lose slots as a penalty.</p>

              <h4 style={{ fontWeight: '600', marginTop: '1rem', marginBottom: '0.5rem' }}>2. Payments</h4>
              <p>All payments are handled between the Client and the Worker. DoThozhil acts purely as a matching platform. Earnings will remain "Pending" until the Client confirms the payment has been made.</p>

              <h4 style={{ fontWeight: '600', marginTop: '1rem', marginBottom: '0.5rem' }}>3. Professional Conduct</h4>
              <p>Both Clients and Workers must maintain professional behavior. Any harassment, fraud, or misuse of the platform will result in permanent account suspension.</p>
              
              <h4 style={{ fontWeight: '600', marginTop: '1rem', marginBottom: '0.5rem' }}>4. Multi-Slot Booking</h4>
              <p>Workers may book multiple slots to bring friends. The primary worker is fully responsible for the conduct and attendance of the friends they bring.</p>
            </div>

            <button onClick={() => setShowTnc(false)} className="btn-primary" style={{ width: '100%' }}>I Understand & Agree</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpperBanner;
