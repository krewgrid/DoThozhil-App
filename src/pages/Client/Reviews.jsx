import React, { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';

const Reviews = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Review Workers</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You can review workers for 3 days after the completion date of the work.</p>

      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Pending Reviews</h2>
        
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontWeight: '600' }}>Work ID: clientname_00001</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Wedding Catering Event - Oct 24, 2023</p>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: '500' }}>Expires in 2 days</span>
          </div>

          {isSubmitted ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', color: '#166534', fontWeight: '500' }}>
              <CheckCircle size={20} />
              Review submitted successfully!
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                W1
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '500' }}>Worker 1 (John Doe)</p>
              </div>
              <div style={{ display: 'flex', gap: '0.2rem' }}>
                {[1,2,3,4,5].map(i => <Star key={i} size={20} color={i <= 4 ? "#fbbf24" : "#e5e7eb"} fill={i <= 4 ? "#fbbf24" : "none"} />)}
              </div>
              <button onClick={() => setIsSubmitted(true)} className="btn-outline" style={{ padding: '0.4rem 1rem' }}>Submit Review</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
