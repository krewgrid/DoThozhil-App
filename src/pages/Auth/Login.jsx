import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('client');
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
    // Always trust the role the user selected on the login page for this flow, 
    // or fallback to the one in metadata if needed. Let's use the one they selected.
    const storedRole = role;

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

        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            onClick={() => setRole('client')}
            style={{ 
              flex: 1, padding: '0.75rem', fontWeight: '600', 
              color: role === 'client' ? 'var(--brand-color)' : 'var(--text-muted)', 
              borderBottom: role === 'client' ? '3px solid var(--brand-color)' : '3px solid transparent' 
            }}
          >
            Client Login
          </button>
          <button 
            type="button"
            onClick={() => setRole('worker')}
            style={{ 
              flex: 1, padding: '0.75rem', fontWeight: '600', 
              color: role === 'worker' ? 'var(--brand-color)' : 'var(--text-muted)', 
              borderBottom: role === 'worker' ? '3px solid var(--brand-color)' : '3px solid transparent' 
            }}
          >
            Worker Login
          </button>
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
            {loading ? 'Signing In...' : `Sign In as ${role === 'client' ? 'Client' : 'Worker'}`}
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
