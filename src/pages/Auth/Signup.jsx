import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'worker';

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    // Auto-fill username with the part before @
    const extractedUsername = val.split('@')[0];
    setUsername(extractedUsername);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setErrorMsg("Please enter a valid Gmail address (ending in @gmail.com)");
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          role: type
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    
    localStorage.setItem('dothozhil_username', username);
    localStorage.setItem('dothozhil_role', type);
    
    if (type === 'client') {
      navigate('/client/dashboard');
    } else {
      navigate('/worker/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create an Account</h1>
          <p>Sign up as a {type.charAt(0).toUpperCase() + type.slice(1)}</p>
        </div>
        <form onSubmit={handleSignup}>
          {errorMsg && (
            <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #fca5a5' }}>
              {errorMsg}
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Email Address</label>
            <input type="email" value={email} onChange={handleEmailChange} className="input-field" placeholder="example@gmail.com" required />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Username (Auto-generated)</label>
            <input type="text" value={username} className="input-field" placeholder="Auto-fills from email" disabled style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Contact Number</label>
            <input type="tel" className="input-field" placeholder="Contact Number" required />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">WhatsApp Number</label>
            <input type="tel" className="input-field" placeholder="WhatsApp Number" required />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Create Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Create Password" required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up & Verify via Zoop API'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)' }}>Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
