import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DisputesView } from '../../components/ui/disputes-view';

const Disputes = () => {
  const navigate = useNavigate();

  return (
    <DisputesView onBack={() => navigate(-1)} />
  );
};

export default Disputes;
