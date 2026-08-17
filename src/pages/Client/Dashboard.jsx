import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientDashboardOverview } from '../../components/ui/dashboard-overview';

const Dashboard = () => {
  const navigate = useNavigate();
  return <ClientDashboardOverview onPostWork={() => navigate('/client/post-work')} />;
};

export default Dashboard;
