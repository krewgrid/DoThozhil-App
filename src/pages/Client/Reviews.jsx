import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReviewWorkersView } from '../../components/ui/review-workers-view';

const Reviews = () => {
  const navigate = useNavigate();

  return (
    <ReviewWorkersView onBack={() => navigate(-1)} />
  );
};

export default Reviews;
