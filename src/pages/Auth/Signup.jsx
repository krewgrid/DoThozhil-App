import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'worker';

  const [email, setEmail] = useState('');
  const [rawUsername, setRawUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(''); // 'checking', 'available', 'taken'
  const [referralCode, setReferralCode] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const checkUsername = async () => {
      if (!rawUsername.trim()) {
        setUsernameStatus('');
        return;
      }
      setUsernameStatus('checking');
      const finalUsername = (type === 'client' ? 'c_' : 'w_') + rawUsername.trim().toLowerCase();
      
      const { data, error } = await supabase.rpc('check_username_available', { p_username: finalUsername });
      
      if (error) {
        setUsernameStatus('');
      } else {
        setUsernameStatus(data ? 'available' : 'taken');
      }
    };
    
    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [rawUsername, type]);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setErrorMsg("Please enter a valid Gmail address (ending in @gmail.com)");
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    if (usernameStatus === 'taken') {
      setErrorMsg("That username is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    const finalUsername = (type === 'client' ? 'c_' : 'w_') + rawUsername.trim().toLowerCase();
    const myRefCode = type.toUpperCase().charAt(0) + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: finalUsername,
          role: type,
          referral_code_used: referralCode || null,
          my_referral_code: myRefCode
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    
    localStorage.setItem('dothozhil_username', finalUsername);
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
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="example@gmail.com" required />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Username</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
              <span style={{ padding: '0.75rem', backgroundColor: '#f3f4f6', color: '#6b7280', borderRight: '1px solid var(--border-color)', fontWeight: '600' }}>
                {type === 'client' ? 'c_' : 'w_'}
              </span>
              <input 
                type="text" 
                value={rawUsername} 
                onChange={e => setRawUsername(e.target.value)} 
                className="input-field" 
                style={{ border: 'none', borderRadius: 0 }} 
                placeholder="Choose a unique username" 
                required 
              />
            </div>
            {usernameStatus === 'checking' && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Checking availability...</p>}
            {usernameStatus === 'available' && <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.25rem' }}>✓ Username is available</p>}
            {usernameStatus === 'taken' && <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.25rem' }}>✗ Username is taken</p>}
          </div>

          {type === 'worker' && (
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Referral Code (Optional)</label>
              <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} className="input-field" placeholder="Enter code if you have one" />
            </div>
          )}
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
