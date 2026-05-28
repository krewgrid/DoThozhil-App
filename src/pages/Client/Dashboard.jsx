import React, { useEffect, useState } from 'react';
import { Calendar, Users, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const ClientDashboard = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const clientId = localStorage.getItem('dothozhil_username') || 'guest_client_123';

    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching works for dashboard", error);
    } else {
      setWorks(data || []);
    }
    setLoading(false);
  };

  const handleMarkPaid = async (workId) => {
    if (!supabase) return;
    const isConfirmed = window.confirm("Are you sure you want to mark this work as Paid? This will transfer the earnings to the workers' Credited accounts.");
    if (!isConfirmed) return;

    const clientId = localStorage.getItem('dothozhil_username') || 'guest_client_123';

    const { data, error } = await supabase.rpc('mark_work_paid', {
      p_work_id: workId,
      p_client_id: clientId
    });

    if (error || !data) {
      alert("Failed to mark work as paid. Please try again.");
    } else {
      // Update local state
      setWorks(prev => prev.map(w => w.id === workId ? { ...w, status: 'Paid' } : w));
      alert("Work successfully marked as Paid!");
    }
  };

  // Calculate stats
  const totalWorks = works.length;
  const recentWorks = works.filter(w => {
    const createdDate = new Date(w.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate >= sevenDaysAgo;
  }).length;
  
  const slotsLeft = works.reduce((sum, work) => sum + (work.status === 'Active' ? work.available_slots : 0), 0);
  const workersHired = works.reduce((sum, work) => sum + (work.total_slots - work.available_slots), 0);

  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Welcome back! Here's an overview of your works.</p>

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
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Works Given</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{supabase ? totalWorks : 142}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '50%', color: '#0284c7' }}>
            <Calendar size={24} color="#0284c7" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Works (Last 7 Days)</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{supabase ? recentWorks : 12}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
            <Users size={24} color="#d97706" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Slots Left</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{supabase ? slotsLeft : 15}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f3e8ff', borderRadius: '50%', color: '#9333ea' }}>
            <Users size={24} color="#9333ea" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Workers Hired</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{supabase ? workersHired : 127}</h3>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Recent Works</h2>
          {statusFilter !== 'All' && (
            <button onClick={() => setStatusFilter('All')} className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
              Clear Filter: {statusFilter} ✕
            </button>
          )}
        </div>
        
        {loading ? (
          <p>Loading recent works...</p>
        ) : (
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem 0' }}>Work ID</th>
                <th>Work Name</th>
                <th>Date</th>
                <th>Status</th>
                <th>Workers</th>
              </tr>
            </thead>
            <tbody>
              {works.length > 0 ? (statusFilter === 'All' ? works : works.filter(w => w.status === statusFilter)).slice(0, 10).map((work, index) => (
                <tr key={work.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: '500' }}>
                    {work.id}
                  </td>
                  <td>{work.work_name}</td>
                  <td>{work.date_of_work}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span 
                        onClick={() => setStatusFilter(work.status)}
                        style={{ 
                        backgroundColor: work.status === 'Active' ? '#fef9c3' : '#dcfce7', 
                        color: work.status === 'Active' ? '#854d0e' : '#166534', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}>
                        {work.status}
                      </span>
                      {work.status === 'Active' && (
                        <button 
                          onClick={() => handleMarkPaid(work.id)} 
                          className="btn-primary" 
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '1rem' }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{work.total_slots - work.available_slots}/{work.total_slots} Confirmed</td>
                </tr>
              )) : (
                <>
                  {!supabase ? (
                    <>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 0', fontWeight: '500' }}>username_00001</td>
                        <td>Wedding Catering Event</td>
                        <td>Oct 24, 2023</td>
                        <td><span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.85rem' }}>Completed</span></td>
                        <td>5/5 Confirmed</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 0', fontWeight: '500' }}>username_00002</td>
                        <td>Warehouse Packing</td>
                        <td>Oct 28, 2023</td>
                        <td><span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.85rem' }}>Upcoming</span></td>
                        <td>12/20 Confirmed</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ padding: '1.5rem', backgroundColor: '#e0f2fe', borderRadius: '50%', color: '#0284c7' }}>
                            <Briefcase size={48} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No works posted yet</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Get started by broadcasting your first work requirement to our workers!</p>
                            <Link to="/client/post-work" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Post Your First Work</Link>
                          </div>
                        </div>
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

export default ClientDashboard;
