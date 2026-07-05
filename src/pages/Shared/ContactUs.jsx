import React from 'react';
import { Mail, MessageCircle, Clock, MapPin } from 'lucide-react';

const ContactUs = () => {
  return (
    <div className="page-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Contact Us</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>We're here to help! Reach out to us through any of the channels below.</p>

      <div className="card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#e2eed4', borderRadius: '50%', color: 'var(--brand-color)' }}>
            <Mail size={24} color="#557a36" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Email</p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>support@krewgrid.com</h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '50%', color: '#16a34a' }}>
            <MessageCircle size={24} color="#16a34a" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>WhatsApp</p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>+91 98765 43210</h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
            <Clock size={24} color="#d97706" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Working Hours</p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>9:00 AM - 4:00 PM</h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '50%', color: '#0284c7' }}>
            <MapPin size={24} color="#0284c7" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Location</p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Kerala, India</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
