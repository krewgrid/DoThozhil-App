import React, { useEffect, useState } from 'react';
import { Clock, Briefcase, IndianRupee, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const WorkerDashboard = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [extraSlots, setExtraSlots] = useState(0);

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const fetchWorkerData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.my_referral_code) {
      const { data: refCount } = await supabase.rpc('get_referral_count', { p_ref_code: user.user_metadata.my_referral_code });
      if (refCount) setExtraSlots(refCount * 5);
    }

    const workerId = localStorage.getItem('krewgrid_username') || 'guest_worker_456';

    // Fetch the work assignments for this worker
    const { data: assignments, error: assignmentsError } = await supabase
      .from('work_assignments')
      .select('*, works(*)')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error("Error fetching worker assignments", assignmentsError);
    } else {
      // The joined data is in assignments[i].works, add slot data directly to it
      const joinedWorks = assignments ? assignments.map(a => ({
        ...a.works,
        slots_consumed: a.slots_consumed || 1,
        friend_names: a.friend_names || [],
        assignment_status: a.status
      })) : [];
      setWorks(joinedWorks);
    }
    setLoading(false);
  };

  const creditedEarnings = works.reduce((sum, work) => sum + (work && (work.assignment_status === 'Paid' || work.status === 'Completed') ? work.payment_amount * work.slots_consumed : 0), 0);
  const pendingEarnings = works.reduce((sum, work) => sum + (work && (work.assignment_status === 'Confirmed' || work.assignment_status === 'Pending Approval') ? work.payment_amount * work.slots_consumed : 0), 0);
  const worksCompleted = works.reduce((sum, work) => sum + (work && work.assignment_status !== 'Declined' && work.assignment_status !== 'Waitlisted' ? work.slots_consumed : 0), 0);
  const availableSlots = Math.max(0, (10 + extraSlots) - worksCompleted);

  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Welcome! Here's an overview of your work profile.</p>

      {!supabase && (
         <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontWeight: '500' }}>
           Backend disconnected. Showing placeholder data below.
         </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#e2eed4', borderRadius: '50%', color: 'var(--brand-color)' }}>
            <Briefcase size={24} color="#557a36" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Works Completed</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{supabase ? worksCompleted : 42}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '50%', color: '#166534' }}>
            <IndianRupee size={24} color="#166534" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Credited Earnings</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹{supabase ? creditedEarnings : '35,000'}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
            <IndianRupee size={24} color="#d97706" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pending Earnings</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹{supabase ? pendingEarnings : '2,400'}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '50%', color: '#0284c7' }}>
            <Star size={24} color="#0284c7" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Average Rating</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{supabase ? '0.0' : '4.8'}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f3e8ff', borderRadius: '50%', color: '#9333ea' }}>
            <Clock size={24} color="#9333ea" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Available Slots</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{supabase ? availableSlots : 3}</h3>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>My Works</h2>
          {statusFilter !== 'All' && (
            <button onClick={() => setStatusFilter('All')} className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
              Clear Filter: {statusFilter} ✕
            </button>
          )}
        </div>
        
        {loading ? (
          <p>Loading your works...</p>
        ) : (
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem 0' }}>Work Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {works.length > 0 ? (statusFilter === 'All' ? works : works.filter(w => w.status === statusFilter)).map((work, index) => work && (
                <tr key={work.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: '500' }}>
                    {work.work_name}
                    {work.slots_consumed > 1 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 'normal' }}>
                        + {work.slots_consumed - 1} Friends ({work.friend_names.join(', ')})
                      </div>
                    )}
                  </td>
                  <td>{work.date_of_work}</td>
                  <td>{work.reporting_time} - {work.completion_time}</td>
                  <td style={{ fontWeight: '600', color: 'var(--brand-color-hover)' }}>
                    ₹{work.payment_amount * work.slots_consumed}
                  </td>
                  <td>
                    <span 
                      onClick={() => setStatusFilter(work.assignment_status)}
                      style={{ 
                      backgroundColor: work.assignment_status === 'Confirmed' || work.assignment_status === 'Paid' ? '#dcfce7' : 
                                     work.assignment_status === 'Declined' ? '#fee2e2' : '#fef9c3', 
                      color: work.assignment_status === 'Confirmed' || work.assignment_status === 'Paid' ? '#166534' : 
                             work.assignment_status === 'Declined' ? '#991b1b' : '#854d0e', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}>
                      {work.assignment_status} ({work.slots_consumed} Slots)
                    </span>
                  </td>
                </tr>
              )) : (
                <>
                  {!supabase ? (
                    <>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 0', fontWeight: '500' }}>Wedding Catering Event</td>
                        <td>Oct 24, 2023</td>
                        <td>9:00 AM - 5:00 PM</td>
                        <td style={{ fontWeight: '600', color: 'var(--brand-color-hover)' }}>₹800</td>
                        <td><span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.85rem' }}>Paid</span></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 0', fontWeight: '500' }}>Warehouse Packing</td>
                        <td>Oct 28, 2023</td>
                        <td>10:00 AM - 6:00 PM</td>
                        <td style={{ fontWeight: '600', color: 'var(--brand-color-hover)' }}>₹700</td>
                        <td><span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.85rem' }}>Upcoming</span></td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                        You haven't joined any works yet.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
