import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Phone, MessageSquare, Lock, Save } from 'lucide-react';

const Profile = ({ role }) => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user) {
      setEmail(user.email);
      setUsername(user.user_metadata?.username || '');
      setContactNumber(user.user_metadata?.contact_number || '');
      setWhatsappNumber(user.user_metadata?.whatsapp_number || '');
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Prepare update payload
    const updatePayload = {
      data: {
        contact_number: contactNumber.trim(),
        whatsapp_number: whatsappNumber.trim(),
      }
    };

    // Only include password if the user actually typed a new one
    if (password.trim() !== '') {
      updatePayload.password = password;
    }

    const { error } = await supabase.auth.updateUser(updatePayload);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Profile updated successfully!");
      setPassword(''); // clear password field after successful update
    }
    
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--brand-color)', marginBottom: '0.5rem' }}>Your Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal information and security settings.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          {/* Read-Only Account Details */}
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--brand-color)" />
              Account Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mobile-grid-1">
              <div>
                <label className="label">Username</label>
                <input type="text" value={username} disabled className="input-field" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Username cannot be changed.</p>
              </div>
              <div>
                <label className="label">Email Address</label>
                <input type="text" value={email} disabled className="input-field" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>

          {/* Editable Contact Info */}
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={18} color="var(--brand-color)" />
              Contact Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mobile-grid-1">
              <div>
                <label className="label">Contact Number</label>
                <input 
                  type="tel" 
                  value={contactNumber} 
                  onChange={(e) => setContactNumber(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>
              <div>
                <label className="label">WhatsApp Number</label>
                <input 
                  type="tel" 
                  value={whatsappNumber} 
                  onChange={(e) => setWhatsappNumber(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="var(--brand-color)" />
              Security
            </h3>
            
            <div>
              <label className="label">New Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="input-field" 
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={updating}>
            <Save size={18} />
            {updating ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
