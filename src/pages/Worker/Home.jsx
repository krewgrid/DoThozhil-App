import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PrismaHero } from '../../components/ui/prisma-hero';
import { supabase } from '../../lib/supabase';

const Home = () => {
  const navigate = useNavigate();

  const handleNavClick = (item) => {
    if (item === "Review Clients") navigate('/worker/reviews');
    else if (item === "Buy Slots") navigate('/worker/buy-slots');
    else if (item === "Profile") navigate('/worker/profile');
    else if (item === "Contact Us") navigate('/worker/contact');
    else if (item === "Disputes") navigate('/worker/disputes');
    else if (item === "Dashboard") navigate('/worker/dashboard');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <PrismaHero 
      role="worker"
      onPrimaryAction={() => navigate('/worker/get-work')}
      onSignOut={handleSignOut}
      onNavClick={handleNavClick}
    />
  );
};

export default Home;
