import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameInput,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const userMeta = data.user?.user_metadata || {};
    const storedName = userMeta.username || usernameInput.split('@')[0];
    
    // Automatically determine their role based on what they signed up as!
    const storedRole = userMeta.role || 'client'; // fallback just in case

    localStorage.setItem('dothozhil_username', storedName);
    localStorage.setItem('dothozhil_role', storedRole);

    if (storedRole === 'client') {
      navigate('/client/dashboard');
    } else {
      navigate('/worker/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Login to your DoThozhil account</p>
        </div>

        <form onSubmit={handleLogin}>
          {errorMsg && (
            <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #fca5a5' }}>
              {errorMsg}
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Email Address</label>
            <input type="email" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="input-field" placeholder="Enter your email" required />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Enter your password" required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <p>Don't have an account?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Link to="/signup?type=client" style={{ color: 'var(--brand-color-hover)', fontWeight: '600' }}>I'm a Client</Link>
            <Link to="/signup?type=worker" style={{ color: 'var(--brand-color-hover)', fontWeight: '600' }}>I'm a Worker</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
