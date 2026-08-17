import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PrismaHero } from '../../components/ui/prisma-hero';
import { supabase } from '../../lib/supabase';

const Home = () => {
  const navigate = useNavigate();

  const handleNavClick = (item) => {
    if (item === "Review Workers") navigate('/client/reviews');
    else if (item === "Report No Show") navigate('/client/report-no-show');
    else if (item === "Profile") navigate('/client/profile');
    else if (item === "Contact Us") navigate('/client/contact');
    else if (item === "Dashboard") navigate('/client/dashboard');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <PrismaHero 
      role="client"
      onPrimaryAction={() => navigate('/client/post-work')}
      onSignOut={handleSignOut}
      onNavClick={handleNavClick}
    />
  );
};

export default Home;
