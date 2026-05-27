import React, { useState, useEffect } from 'react';
import { Search, MapPin, IndianRupee, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const GetWork = () => {
  const [filterLocation, setFilterLocation] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedWorks, setJoinedWorks] = useState({});
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching works", error);
    } else {
      setWorks(data || []);
    }
    setLoading(false);
  };

  const handleJoin = async (workId) => {
    if (!supabase) {
      setFeedbackMsg({ type: 'error', text: "Cannot join: Backend is disconnected." });
      return;
    }

    const isConfirmed = window.confirm("Are you sure you want to join this work? This will consume 1 slot.");
    if (!isConfirmed) return;

    const workerId = localStorage.getItem('dothozhil_username') || 'guest_worker_456';

    const { data, error } = await supabase.rpc('join_work', {
      p_work_id: workId,
      p_worker_id: workerId
    });

    if (error) {
      setFeedbackMsg({ type: 'error', text: "Error joining work: " + error.message });
      return;
    }

    if (data === true) {
      setFeedbackMsg({ type: 'success', text: "You have joined the work! 1 slot consumed. A WhatsApp link will be sent shortly." });
      // Mark as joined locally
      setJoinedWorks(prev => ({ ...prev, [workId]: true }));
      // Refresh the works list to show the new slot count
      fetchWorks();
      // Notify the UpperBanner to update its slot count
      window.dispatchEvent(new CustomEvent('slotConsumed'));
    } else {
      setFeedbackMsg({ type: 'error', text: "Failed to join. Either the slots are full or you have already joined this work." });
    }
  };

  const filteredWorks = works.filter(w => w.location.toLowerCase().includes(filterLocation.toLowerCase()));
  const sortedWorks = [...filteredWorks].sort((a, b) => {
    if (sortBy === 'pay') return b.payment_amount - a.payment_amount;
    if (sortBy === 'slots') return b.available_slots - a.available_slots;
    return new Date(a.date_of_work) - new Date(b.date_of_work);
  });

  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Get A Work</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Browse available works and use your slots to join.</p>

      {!supabase && (
         <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontWeight: '500' }}>
           Backend disconnected. Please add your Supabase URL and Key to the .env file to load real jobs.
         </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" className="input-field" placeholder="Search by Work Name..." style={{ paddingLeft: '2.5rem' }} />
        </div>
        <div style={{ width: '250px', position: 'relative' }}>
          <MapPin size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" className="input-field" placeholder="Location Filter" style={{ paddingLeft: '2.5rem' }} value={filterLocation} onChange={e => setFilterLocation(e.target.value)} />
        </div>
        <div style={{ width: '200px' }}>
          <select className="input-field" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ cursor: 'pointer' }}>
            <option value="date">Sort: Nearest Date</option>
            <option value="pay">Sort: Highest Pay</option>
            <option value="slots">Sort: Most Slots</option>
          </select>
        </div>
      </div>

      {feedbackMsg.text && (
        <div style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontWeight: '500', backgroundColor: feedbackMsg.type === 'error' ? '#fef2f2' : '#f0fdf4', color: feedbackMsg.type === 'error' ? '#b91c1c' : '#166534', border: `1px solid ${feedbackMsg.type === 'error' ? '#fca5a5' : '#bbf7d0'}` }}>
          {feedbackMsg.text}
        </div>
      )}

      {loading ? (
        <p>Loading available works...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {sortedWorks.length > 0 ? sortedWorks.map(work => (
            <div className="card" key={work.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', paddingRight: '1rem' }}>{work.work_name}</h3>
                <div style={{ minWidth: '120px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: '600', color: (work.available_slots / work.total_slots) <= 0.2 ? '#ef4444' : 'var(--brand-color)' }}>
                    <span>{work.available_slots} Left</span>
                    <span style={{ color: 'var(--text-muted)' }}>/ {work.total_slots}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(work.available_slots / work.total_slots) * 100}%`, 
                      height: '100%', 
                      backgroundColor: (work.available_slots / work.total_slots) <= 0.2 ? '#ef4444' : '#10b981',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{work.instruction}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Location: {work.location}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> {work.date_of_work} | {work.reporting_time} - {work.completion_time}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--brand-color-hover)' }}><IndianRupee size={16} /> ₹{work.payment_amount}</div>
              </div>
              
              {joinedWorks[work.id] ? (
                <button className="btn-outline" style={{ width: '100%', borderColor: 'var(--success)', color: 'var(--success)' }} disabled>
                  ✓ Joined
                </button>
              ) : (
                <button onClick={() => handleJoin(work.id)} className="btn-primary" style={{ width: '100%' }} disabled={work.available_slots <= 0}>
                  {work.available_slots > 0 ? 'Join Work (Consumes 1 Slot)' : 'Slots Full'}
                </button>
              )}
            </div>
          )) : (
            <p>No works available right now. Tell clients to post more!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GetWork;
