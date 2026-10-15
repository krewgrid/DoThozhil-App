import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthUI } from '../../components/ui/auth-ui';
import { useMe, homeFor } from '../../lib/session';

const Login = ({ mode = 'signIn' }) => {
  const me = useMe();
  const [params] = useSearchParams();
  // Supabase puts OAuth errors in the query string or the hash.
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const error = params.get('error_description') || hash.get('error_description') || (me.error ?? null);

  if (me.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#aaa' }}>
        Loading securely...
      </div>
    );
  }
  if (me.user) return <Navigate to={homeFor(me)} replace />;

  return (
    <div style={{ backgroundColor: 'var(--background)' }}>
      <AuthUI initialMode={mode} error={error} />
    </div>
  );
};

export default Login;
