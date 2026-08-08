import React, { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';

const Reviews = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', backgroundColor: 'rgba(20, 184, 166, 0.1)', borderRadius: '0.5rem', color: '#5eead4', fontWeight: '500' }}>
              <CheckCircle size={20} />
              Review submitted successfully!
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                W1
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '500', color: 'var(--text-main)' }}>Worker 1 (John Doe)</p>
              </div>
              <div style={{ display: 'flex', gap: '0.2rem' }}>
                {[1,2,3,4,5].map(i => (
                  <Star 
                    key={i} 
                    size={24} 
                    color={i <= (hover || rating) ? "#fbbf24" : "#e5e7eb"} 
                    fill={i <= (hover || rating) ? "#fbbf24" : "none"} 
                    style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                  />
                ))}
              </div>
              <button onClick={() => {
                if (rating === 0) {
                  alert("Please select a star rating first.");
                  return;
                }
                setIsSubmitted(true);
              }} className="btn-primary" style={{ padding: '0.4rem 1rem' }}>Submit Review</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
