import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchReports();

    // Subscribe to real-time database changes
    const channel = supabase
      .channel('admin-reports')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'platform_reports' },
        (payload) => {
          const newReport = payload.new;
          setToast({
            title: newReport.type === 'NoShow' ? '🚨 New No-Show Reported!' : '⚠️ New Dispute Filed!',
            desc: `Against: ${newReport.target_id}`
          });
          
          // Play a gentle notification sound (optional, browsers may block if no interaction)
          try {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
          } catch (e) {}

          fetchReports(); // Auto-refresh the table
          
          setTimeout(() => {
            setToast(null);
          }, 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const fetchReports = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_reports')
      .select('*, works(work_name, client_id)')
      .eq('status', filter)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setReports(data);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('platform_reports')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (!error) {
      fetchReports();
    } else {
      alert("Error updating status: " + error.message);
    }
  };

  return (
    <div className="page-content" style={{ position: 'relative' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '1.2rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          color: 'white',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out forwards',
          minWidth: '300px'
        }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{toast.title}</h4>
          <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>{toast.desc}</p>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Manage No-Show Reports and Disputes.</p>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          {['Pending', 'Resolved', 'Dismissed'].map(status => (
            <button 
              key={status}
              onClick={() => setFilter(status)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                fontSize: '1rem',
                fontWeight: filter === status ? '600' : '500',
                color: filter === status ? 'var(--brand-color)' : 'var(--text-muted)',
                borderBottom: filter === status ? '2px solid var(--brand-color)' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No {filter.toLowerCase()} reports found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {reports.map(report => (
              <div key={report.id} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: report.type === 'NoShow' ? 'rgba(127, 29, 29, 0.1)' : 'rgba(15, 118, 110, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ 
                      display: 'inline-block',
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '1rem',
                      backgroundColor: report.type === 'NoShow' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(20, 184, 166, 0.2)',
                      color: report.type === 'NoShow' ? '#fca5a5' : '#5eead4',
                      marginBottom: '0.5rem',
                      border: report.type === 'NoShow' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(20, 184, 166, 0.3)'
                    }}>
                      {report.type === 'NoShow' ? 'No-Show Report' : 'Worker Dispute'}
                    </span>
                    <h3 style={{ fontWeight: '600', fontSize: '1.1rem' }}>Work: {report.works?.work_name || report.work_id}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  {filter === 'Pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleUpdateStatus(report.id, 'Resolved')} className="btn-primary" style={{ backgroundColor: '#166534', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem' }}>
                        <CheckCircle size={16} /> Resolve
                      </button>
                      <button onClick={() => handleUpdateStatus(report.id, 'Dismissed')} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', color: '#94a3b8' }}>
                        <XCircle size={16} /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.3)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Reporter</p>
                    <p style={{ fontWeight: '500' }}>{report.reporter_id}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Target / Accused</p>
                    <p style={{ fontWeight: '500' }}>{report.target_id}</p>
                  </div>
                  {report.description && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Description</p>
                      <p style={{ fontSize: '0.95rem' }}>{report.description}</p>
                    </div>
                  )}
                  {report.proof_url && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Attached Proof</p>
                      <a href={report.proof_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-color)', fontSize: '0.95rem', fontWeight: '500' }}>View Proof</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
