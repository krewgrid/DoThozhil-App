import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportNoShowView } from '../../components/ui/report-no-show-view';

const ReportNoShow = () => {
  const navigate = useNavigate();

  return (
    <ReportNoShowView onBack={() => navigate(-1)} />
  );
};

export default ReportNoShow;
