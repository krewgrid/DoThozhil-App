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
  
  const [mySlots, setMySlots] = useState(10);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [slotsToJoin, setSlotsToJoin] = useState(1);
  const [friendNames, setFriendNames] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    fetchWorks();
    fetchMySlots();
  }, []);

  const fetchMySlots = async () => {
    if (!supabase) return;
    const workerId = localStorage.getItem('dothozhil_username') || 'guest_worker_456';
    
    // Fetch slots consumed, excluding Waitlisted and Declined
    const { data: slotData, error: slotError } = await supabase
      .from('work_assignments')
      .select('slots_consumed, work_id, status')
      .eq('worker_id', workerId)
      .neq('status', 'Declined')
      .neq('status', 'Waitlisted');
    
    if (!slotError && slotData) {
      const consumed = slotData.reduce((sum, row) => sum + (row.slots_consumed || 1), 0);
      setMySlots(Math.max(0, 10 - consumed));

      // Also populate joinedWorks state so the UI knows what we already joined!
      const joinedObj = {};
      slotData.forEach(row => {
        joinedObj[row.work_id] = true;
      });
      setJoinedWorks(joinedObj);
    }
  };

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

  const handleJoinInit = (workId) => {
    setSelectedWorkId(workId);
    setSlotsToJoin(1);
    setFriendNames([]);
    setPhotoFile(null);
  };

  const handleFriendNameChange = (index, value) => {
    const newNames = [...friendNames];
    newNames[index] = value;
    setFriendNames(newNames);
  };

  const handleJoinConfirm = async (work) => {
    if (!supabase) {
      setFeedbackMsg({ type: 'error', text: "Cannot join: Backend is disconnected." });
      return;
    }

    if (work.requires_photo && !photoFile) {
      alert("This work requires you to upload a photo of yourself.");
      return;
    }

    // Validate friend names
    const requiredFriends = slotsToJoin - 1;
    const validFriends = friendNames.slice(0, requiredFriends).filter(n => n && n.trim() !== '');
    if (validFriends.length < requiredFriends) {
      alert("Please enter names for all your friends!");
      return;
    }

    const workerId = localStorage.getItem('dothozhil_username') || 'guest_worker_456';
    setLoading(true);

    let photoUrl = null;
    if (photoFile) {
      // Prototype placeholder. In reality, upload to Supabase Storage here.
      photoUrl = `https://dothozhil.com/proofs/${photoFile.name.replace(/\s+/g, '_')}`;
    }

    const { data, error } = await supabase.rpc('join_work_with_friends', {
      p_work_id: work.id,
      p_worker_id: workerId,
      p_slots: slotsToJoin,
      p_friend_names: validFriends,
      p_photo_url: photoUrl
    });

    if (error) {
      setFeedbackMsg({ type: 'error', text: "Error joining work: " + error.message });
      setLoading(false);
      return;
    }

    if (data === 'Joined') {
      setFeedbackMsg({ type: 'success', text: `You have successfully joined the work for ${slotsToJoin} slots!` });
      setJoinedWorks(prev => ({ ...prev, [work.id]: true }));
    } else if (data === 'Waitlisted') {
      setFeedbackMsg({ type: 'success', text: `Work is full, but you have been added to the Waitlist! Your slots were not deducted.` });
      setJoinedWorks(prev => ({ ...prev, [work.id]: true }));
    } else if (data === 'AlreadyJoined') {
      setFeedbackMsg({ type: 'error', text: "You have already joined or applied for this work." });
    } else {
      setFeedbackMsg({ type: 'error', text: "Failed to join. The work is completely full (including the waitlist)." });
    }
    
    setSelectedWorkId(null);
    fetchWorks();
    fetchMySlots();
    window.dispatchEvent(new CustomEvent('slotConsumed'));
    setLoading(false);
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

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" className="input-field" placeholder="Search by Work Name..." style={{ paddingLeft: '2.5rem' }} />
        </div>
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <MapPin size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" className="input-field" placeholder="Location Filter" style={{ paddingLeft: '2.5rem' }} value={filterLocation} onChange={e => setFilterLocation(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 150px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
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
                  ✓ Joined / Waitlisted
                </button>
              ) : selectedWorkId === work.id ? (
                <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  
                  {work.requires_photo && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '0.5rem', border: '1px solid #fde68a' }}>
                      <label className="label" style={{ color: '#92400e' }}>This work requires a photo</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files[0])}
                        style={{ width: '100%', fontSize: '0.9rem' }}
                      />
                    </div>
                  )}

                  <label className="label">How many slots do you need?</label>
                  <select 
                    className="input-field" 
                    value={slotsToJoin} 
                    onChange={e => setSlotsToJoin(Number(e.target.value))}
                    style={{ marginBottom: '1rem', cursor: 'pointer' }}
                  >
                    {[...Array(Math.max(1, Math.min(work.available_slots > 0 ? work.available_slots : 5 - work.waitlist_count, mySlots)))].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} Slot{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                  
                  {slotsToJoin > 1 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Enter your friends' names:</p>
                      {[...Array(slotsToJoin - 1)].map((_, i) => (
                        <input 
                          key={i}
                          type="text" 
                          className="input-field" 
                          placeholder={`Friend ${i + 1} Name`} 
                          style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}
                          value={friendNames[i] || ''}
                          onChange={(e) => handleFriendNameChange(i, e.target.value)}
                        />
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setSelectedWorkId(null)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                    <button onClick={() => handleJoinConfirm(work)} className="btn-primary" style={{ flex: 1 }}>
                      {work.available_slots > 0 ? 'Confirm' : 'Join Waitlist'}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => handleJoinInit(work.id)} 
                  className={work.available_slots > 0 ? "btn-primary" : "btn-outline"} 
                  style={{ width: '100%', borderColor: work.available_slots <= 0 ? 'var(--brand-color)' : '', color: work.available_slots <= 0 ? 'var(--brand-color)' : '' }} 
                  disabled={(work.available_slots <= 0 && work.waitlist_count >= 5) || mySlots <= 0}
                >
                  {work.available_slots > 0 
                    ? (mySlots > 0 ? 'Join Work' : 'No Personal Slots Left') 
                    : (work.waitlist_count < 5 ? `Join Waitlist (${5 - work.waitlist_count} left)` : 'Completely Full')}
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
