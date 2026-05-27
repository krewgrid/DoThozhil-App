import React from 'react';

const BuySlots = () => {
  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Buy Slots</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Purchase slots to apply for more works. Payments are securely processed via Razorpay.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1000px' }}>
        {/* Pack 1 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Starter Pack</h3>
          <h2 style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--brand-color)', marginBottom: '0.5rem' }}>10 <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: '500' }}>Slots</span></h2>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '2rem' }}>₹200</p>
          <button className="btn-primary" style={{ width: '100%' }}>Pay via Razorpay</button>
        </div>

        {/* Pack 2 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem', border: '2px solid var(--brand-color)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', backgroundColor: 'var(--brand-color)', color: '#0f172a', padding: '0.2rem 1rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: '600' }}>MOST POPULAR</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Pro Pack</h3>
          <h2 style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--brand-color)', marginBottom: '0.5rem' }}>30 <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: '500' }}>Slots</span></h2>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '2rem' }}>₹600</p>
          <button className="btn-primary" style={{ width: '100%' }}>Pay via Razorpay</button>
        </div>

        {/* Pack 3 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Elite Pack</h3>
          <h2 style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--brand-color)', marginBottom: '0.5rem' }}>50 <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: '500' }}>Slots</span></h2>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '2rem' }}>₹1000</p>
          <button className="btn-primary" style={{ width: '100%' }}>Pay via Razorpay</button>
        </div>
      </div>
    </div>
  );
};

export default BuySlots;
