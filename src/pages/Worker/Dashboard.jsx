import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkerDashboardOverview } from '../../components/ui/dashboard-overview';

const Dashboard = () => {
  const navigate = useNavigate();
  return <WorkerDashboardOverview onGetWork={() => navigate('/worker/get-work')} />;
};

export default Dashboard;
