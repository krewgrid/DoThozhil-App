import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUI } from '../../components/ui/auth-ui';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (role) => {
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'client') {
      navigate('/client/dashboard');
    } else {
      navigate('/worker/dashboard');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--background)' }}>
      <AuthUI onLogin={handleLogin} />
    </div>
  );
};

export default Login;
