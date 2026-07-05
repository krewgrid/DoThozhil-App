import React, { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendAdminAlert } from '../../lib/webhook';

const ReportNoShow = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeWorks, setActiveWorks] = useState([]);
  const [fetching, setFetching] = useState(true);

  React.useEffect(() => {
    fetchActiveWorks();
  }, []);

  const fetchActiveWorks = async () => {
    if (!supabase) return;
    const clientId = localStorage.getItem('krewgrid_username');
    if (!clientId) return;

    // Fetch works for this client
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*, work_assignments(worker_id, friend_names)')
      .eq('client_id', clientId)
      .eq('status', 'Active'); // Assuming 'Active' works are the ones happening today/now

    if (!worksError && works) {
      setActiveWorks(works);
    }
    setFetching(false);
  };

  const handleSubmitReport = async (workId, workerId) => {
    setLoading(true);
    const clientId = localStorage.getItem('krewgrid_username');

    if (supabase) {
      const { error } = await supabase.from('platform_reports').insert({
        type: 'NoShow',
        work_id: workId,
        reporter_id: clientId,
        target_id: workerId,
        description: 'Worker did not show up for the shift.'
      });
      if (error) {
        alert("Database Error: " + error.message);
        setLoading(false);
        return;
      }
    }

    // Fire webhook alert
    await sendAdminAlert('NoShow', workId, clientId, workerId, 'Worker did not show up for the shift.');
    
    setIsSubmitted(true);
    setLoading(false);
  };
  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Report No Show</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Report workers who did not show up. You can only report on the same working day.</p>

      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Today's Works</h2>
        
        {fetching ? (
          <p>Loading active works...</p>
        ) : activeWorks.length === 0 ? (
          <div style={{ border: '1px dashed var(--border-color)', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb' }}>
            <p style={{ color: 'var(--text-muted)' }}>You have no active works to report on right now.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {activeWorks.map(work => (
              <div key={work.id} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontWeight: '600' }}>Work Name: {work.work_name}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{work.date_of_work}</p>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--brand-color)', fontWeight: '600', backgroundColor: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>Active</span>
                </div>

                {isSubmitted ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', color: '#166534', fontWeight: '500' }}>
                    <CheckCircle size={20} />
                    Worker has been reported and penalized.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {work.work_assignments && work.work_assignments.length > 0 ? (
                      work.work_assignments.map((assignment, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fca5a5' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                            <AlertTriangle size={20} />
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ fontWeight: '500' }}>Worker: {assignment.worker_id}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>Mark as No Show? Worker will lose 10 slots.</p>
                          </div>
                          <button onClick={() => handleSubmitReport(work.id, assignment.worker_id)} disabled={loading} className="btn-primary" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.4rem 1rem' }}>
                            {loading ? 'Submitting...' : 'Report No Show'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No workers have joined this work yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportNoShow;
