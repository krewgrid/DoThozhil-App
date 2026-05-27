import React from 'react';
import { Upload } from 'lucide-react';

const WorkerDisputes = () => {
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
          
          <div style={{ border: '1px dashed var(--border-color)', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff', marginBottom: '1rem' }}>
            <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Upload Picture Proof</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</p>
          </div>
          <button className="btn-primary" style={{ backgroundColor: '#1f2937', color: 'white' }}>Submit Dispute</button>
        </div>
      </div>
    </div>
  );
};

export default WorkerDisputes;
