import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import Layout from './components/Layout';

// Loading spinner for lazy-loaded routes
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000' }}>
    <div style={{ width: 32, height: 32, border: '2px solid transparent', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Auth Pages (loaded eagerly since they're the entry point)
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import CompleteProfile from './pages/Auth/CompleteProfile';

// Lazy-loaded Client Pages
const ClientHome = React.lazy(() => import('./pages/Client/Home'));
const ClientDashboard = React.lazy(() => import('./pages/Client/Dashboard'));
const PostWork = React.lazy(() => import('./pages/Client/PostWork'));
const ClientReviews = React.lazy(() => import('./pages/Client/Reviews'));
const ReportNoShow = React.lazy(() => import('./pages/Client/ReportNoShow'));

// Lazy-loaded Worker Pages
const WorkerHome = React.lazy(() => import('./pages/Worker/Home'));
const WorkerDashboard = React.lazy(() => import('./pages/Worker/Dashboard'));
const GetWork = React.lazy(() => import('./pages/Worker/GetWork'));
const BuySlots = React.lazy(() => import('./pages/Worker/BuySlots'));
const WorkerReviews = React.lazy(() => import('./pages/Worker/ReviewsAndDisputes'));
const WorkerDisputes = React.lazy(() => import('./pages/Worker/Disputes'));

// Lazy-loaded Shared Pages
const ContactUs = React.lazy(() => import('./pages/Shared/ContactUs'));
const Profile = React.lazy(() => import('./pages/Shared/Profile'));

// Lazy-loaded Admin Pages
const ControlCentreDashboard = React.lazy(() => import('./pages/ControlCentre/Dashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Client Routes */}
          <Route path="/client" element={<Layout role="client" />}>
            <Route path="home" element={<ClientHome />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="post-work" element={<PostWork />} />
            <Route path="reviews" element={<ClientReviews />} />
            <Route path="report-no-show" element={<ReportNoShow />} />
            <Route path="contact" element={<ContactUs />} />
            <Route path="profile" element={<Profile role="client" />} />
          </Route>

          {/* Worker Routes */}
          <Route path="/worker" element={<Layout role="worker" />}>
            <Route path="home" element={<WorkerHome />} />
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="get-work" element={<GetWork />} />
            <Route path="buy-slots" element={<BuySlots />} />
            <Route path="reviews" element={<WorkerReviews />} />
            <Route path="disputes" element={<WorkerDisputes />} />
            <Route path="contact" element={<ContactUs />} />
            <Route path="profile" element={<Profile role="worker" />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/control-centre" element={<Layout role="admin" />}>
            <Route path="dashboard" element={<ControlCentreDashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
