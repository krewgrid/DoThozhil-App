import React, { useEffect, useState } from 'react';
import { Star, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const WorkerReviews = () => {
  const [reviewableWorks, setReviewableWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    fetchReviewableWorks();
  }, []);

  const fetchReviewableWorks = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const workerId = localStorage.getItem('krewgrid_username') || 'guest_worker_456';

    const { data: assignments, error } = await supabase
      .from('work_assignments')
      .select('*, works(*)')
      .eq('worker_id', workerId);

    if (error) {
      console.error("Error fetching works for review", error);
      setLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight

    const filtered = (assignments || [])
      .map(a => a.works)
      .filter(work => {
        if (!work || !work.payment_date) return false;
        
        const paymentDate = new Date(work.payment_date);
        paymentDate.setHours(0, 0, 0, 0);
        
        const twoDaysAfter = new Date(paymentDate);
        twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);
        twoDaysAfter.setHours(23, 59, 59, 999); // End of the 2nd day

        return today >= paymentDate && today <= twoDaysAfter;
      });

    setReviewableWorks(filtered);
    setLoading(false);
  };

  const handleRating = (workId, rating) => {
    setRatings(prev => ({ ...prev, [workId]: rating }));
  };

  const handleSubmit = (workId) => {
    alert("Review submitted! (Note: Since we are in the prototype phase, this doesn't save to a database table yet, but the UI is fully functional!)");
  };

  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem' }}>Review Clients</h1>
      
      <div className="card">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          You can review clients from their Payment Date up until 2 days after the Payment Date.
        </p>

        {loading ? (
          <p>Loading your works...</p>
        ) : reviewableWorks.length > 0 ? (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {reviewableWorks.map(work => (
              <div key={work.id} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{work.work_name}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Client: {work.client_id}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#b91c1c', marginBottom: '1rem' }}>
                  <Clock size={14} /> Review window closes soon!
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star 
                      key={i} 
                      size={24} 
                      color={i <= (ratings[work.id] || 0) ? "#f59e0b" : "#e5e7eb"} 
                      fill={i <= (ratings[work.id] || 0) ? "#f59e0b" : "transparent"}
                      style={{ cursor: 'pointer', transition: 'color 0.2s' }} 
                      onClick={() => handleRating(work.id, i)}
                    />
                  ))}
                </div>
                <textarea className="input-field" placeholder="Share your experience working with this client..." rows={3} style={{ marginBottom: '1rem' }}></textarea>
                <button onClick={() => handleSubmit(work.id)} className="btn-primary" disabled={!ratings[work.id]}>Submit Review</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)' }}>You have no clients available to review at this time.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>(Works will automatically appear here on their Payment Date, and remain for 2 days)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerReviews;
