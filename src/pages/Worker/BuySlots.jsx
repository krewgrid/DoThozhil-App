import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuySlotsView } from '../../components/ui/buy-slots-view';

const BuySlots = () => {
  const navigate = useNavigate();

  return (
    <BuySlotsView onBack={() => navigate(-1)} />
  );
};

export default BuySlots;
