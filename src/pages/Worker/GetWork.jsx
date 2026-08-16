import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GetWorkView } from '../../components/ui/get-work-view';

const GetWork = () => {
  const navigate = useNavigate();

  return (
    <GetWorkView onBack={() => navigate(-1)} />
  );
};

export default GetWork;
