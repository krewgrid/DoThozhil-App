import React, { useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendAdminAlert } from '../../lib/webhook';

const WorkerDisputes = () => {
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState({});
  const [loading, setLoading] = useState(false);
  const [reportsAgainstMe, setReportsAgainstMe] = useState([]);
  const [fetching, setFetching] = useState(true);

  React.useEffect(() => {
    fetchNoShowReports();
  }, []);

  const fetchNoShowReports = async () => {
    if (!supabase) return;
    const workerId = localStorage.getItem('krewgrid_username');
    if (!workerId) return;

    const { data, error } = await supabase
      .from('platform_reports')
      .select('*, works(work_name, client_id)')
      .eq('target_id', workerId)
      .eq('type', 'NoShow');

    if (!error && data) {
      setReportsAgainstMe(data);
    }
    setFetching(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (report) => {
    if (!file) {
      alert("Please upload picture proof first.");
      return;
    }
    
    setLoading(true);
    const workerId = localStorage.getItem('krewgrid_username');

    if (supabase) {
      const fakeProofUrl = `https://krewgrid.com/proofs/${file.name.replace(/\s+/g, '_')}`;
      
      const { error } = await supabase.from('platform_reports').insert({
        type: 'Dispute',
        work_id: report.work_id,
        reporter_id: workerId,
        target_id: report.reporter_id, // Disputing against the client who reported them
        description: 'Worker disputes the No-Show mark and has provided picture proof.',
        proof_url: fakeProofUrl
      });

      if (error) {
        alert("Database Error: " + error.message);
        setLoading(false);
        return;
      }
    }

    // Fire webhook alert
    await sendAdminAlert('Dispute', report.work_id, workerId, report.reporter_id, 'Worker disputes No-Show with picture proof.');
    
    setSubmitted(prev => ({ ...prev, [report.id]: true }));
    setLoading(false);
    setFile(null);
  };
  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem' }}>Disputes</h1>
      
      <div className="card">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>File a dispute against a "Report No Show" mark.</p>
        
        {fetching ? (
          <p>Loading reports...</p>
        ) : reportsAgainstMe.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)' }}>Great news! You have no "No-Show" reports against you.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {reportsAgainstMe.map(report => (
              <div key={report.id} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#fef2f2', borderColor: '#fca5a5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: '600', color: '#991b1b' }}>Report No Show Alert</h3>
                  <span style={{ fontSize: '0.85rem', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>Pending Dispute</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem' }}><strong>Work:</strong> {report.works?.work_name || report.work_id}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}><strong>Reported by:</strong> {report.reporter_id}</p>
                
                {submitted[report.id] ? (
                  <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', color: '#166534', fontWeight: '500' }}>
                    ✓ Dispute submitted successfully and is under review.
                  </div>
                ) : (
                  <>
                    <div style={{ border: '1px dashed var(--border-color)', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                      />
                      {!file ? (
                        <>
                          <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                          <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Click or tap to Upload Picture Proof</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</p>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <FileImage size={32} color="var(--brand-color)" style={{ marginBottom: '1rem' }} />
                          <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{file.name}</p>
                          <button 
                            onClick={(e) => { e.preventDefault(); setFile(null); }} 
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}
                          >
                            <X size={14} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleSubmit(report)} className="btn-primary" style={{ backgroundColor: '#1f2937', color: 'white', opacity: file ? 1 : 0.6 }} disabled={!file || loading}>
                      {loading ? 'Submitting...' : 'Submit Dispute'}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDisputes;
