import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReviewClientsView } from '../../components/ui/review-clients-view';

const ReviewsAndDisputes = () => {
  const navigate = useNavigate();

  return (
    <ReviewClientsView onBack={() => navigate(-1)} />
  );
};

export default ReviewsAndDisputes;
