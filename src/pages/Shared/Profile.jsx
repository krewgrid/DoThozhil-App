import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileView } from '../../components/ui/profile-view';

const Profile = ({ role }) => {
  const navigate = useNavigate();

  return (
    <ProfileView onBack={() => navigate(-1)} role={role} />
  );
};

export default Profile;
