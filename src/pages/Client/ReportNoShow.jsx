import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ReportNoShow = () => {
  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Report No Show</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Report workers who did not show up. You can only report on the same working day.</p>

      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Today's Works</h2>
        
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontWeight: '600' }}>Work ID: clientname_00002</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Warehouse Packing - Today</p>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--brand-color)', fontWeight: '600', backgroundColor: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>Active Today</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fca5a5' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '500' }}>Worker 2 (Jane Smith)</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>Mark as No Show? Worker will lose 10 slots.</p>
            </div>
            <button onClick={() => alert("Worker has been reported for No Show. They will be penalized.")} className="btn-primary" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.4rem 1rem' }}>Report No Show</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportNoShow;
