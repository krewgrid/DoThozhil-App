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
    localStorage.removeItem('krewgrid_username');
    localStorage.removeItem('krewgrid_role');
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
    const storedUser = localStorage.getItem('krewgrid_username');
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
    let extraSlots = 0;
    
    // Get the current user's referral code to check if they referred anyone
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.my_referral_code) {
      const { data: refCount } = await supabase.rpc('get_referral_count', { p_ref_code: user.user_metadata.my_referral_code });
      if (refCount) {
        extraSlots = refCount * 5; // 5 extra slots per referral
      }
    }

    const { data, error } = await supabase
      .from('work_assignments')
      .select('slots_consumed, status')
      .eq('worker_id', userId)
      .neq('status', 'Declined')
      .neq('status', 'Waitlisted');
    
    if (!error && data) {
      const consumed = data.reduce((sum, row) => sum + (row.slots_consumed || 1), 0);
      setSlotsLeft(Math.max(0, (10 + extraSlots) - consumed));
    }
  };

  return (
    <div className="upper-banner">
      <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '130px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src="/logo.png" alt="krewgrid" style={{ width: '130px', minWidth: '130px', height: '130px', objectFit: 'contain', transform: 'scale(4.5)' }} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', marginTop: '2px' }}>
          {role === 'admin' ? 'Admin Portal' : role === 'client' ? 'Client Portal' : 'Worker Portal'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-end', flex: 1 }}>
        {username && (
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)', paddingRight: '1rem', borderRight: '1px solid var(--border-color)' }}>
            <User size={18} color="var(--brand-color)" />
            {username}
          </div>
        )}
        {role === 'worker' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', fontWeight: '600', color: '#d97706', paddingRight: '0.5rem' }}>
            <Ticket size={18} />
            {slotsLeft} <span className="desktop-only">Slots Left</span>
          </div>
        )}
        <button onClick={() => setShowTnc(true)} className="desktop-only" style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>T&C</button>
        {role === 'worker' && (
          <button onClick={handleInvite} className="btn-outline desktop-only" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Invite</button>
        )}
        <button className="mobile-signout" onClick={handleSignOut} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontWeight: '600', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <LogOut size={18} />
          <span className="desktop-only">Sign Out</span>
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
              <p>All payments are handled between the Client and the Worker. krewgrid acts purely as a matching platform. Earnings will remain "Pending" until the Client confirms the payment has been made.</p>

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
