import React, { useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';

const WorkerDisputes = () => {
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      alert("Please upload picture proof first.");
      return;
    }
    setSubmitted(true);
    alert("Dispute submitted successfully! Our team will review your evidence.");
  };
  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem' }}>Disputes</h1>
      
      <div className="card">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>File a dispute against a "Report No Show" mark.</p>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#fef2f2', borderColor: '#fca5a5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: '600', color: '#991b1b' }}>Report No Show Alert</h3>
            <span style={{ fontSize: '0.85rem', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>Pending Dispute</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem' }}><strong>Work:</strong> Warehouse Packing (clientname_00002)</p>
          
          {submitted ? (
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
              <button onClick={handleSubmit} className="btn-primary" style={{ backgroundColor: '#1f2937', color: 'white', opacity: file ? 1 : 0.6 }} disabled={!file}>
                Submit Dispute
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDisputes;
