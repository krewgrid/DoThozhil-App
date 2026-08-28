import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUI } from '../../components/ui/auth-ui';
import { supabase } from '../../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (mounted) {
          if (profile && profile.role) {
            handleLogin(profile.role);
          } else {
            navigate('/complete-profile');
          }
        }
      } else {
        if (mounted) setChecking(false);
      }
    };
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (mounted) setChecking(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (mounted) {
          if (profile && profile.role) {
            handleLogin(profile.role);
          } else {
            navigate('/complete-profile');
          }
        }
      }
    });

    checkSession();
    
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = (role) => {
    if (role === 'admin') {
      navigate('/control-centre/dashboard');
    } else if (role === 'client') {
      navigate('/client/home');
    } else {
      navigate('/worker/home');
    }
  };

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#aaa' }}>
        Loading securely...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--background)' }}>
      <AuthUI onLogin={handleLogin} />
    </div>
  );
};

export default Login;
