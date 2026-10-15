import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import ComingSoon from './pages/ComingSoon';
import { MeProvider } from './lib/session';
import { Toaster } from './components/kg/ui';
import './kg.css';

// ============================================================
// COMING SOON MODE: Set to false to reveal the full website
const COMING_SOON = true;
// ============================================================

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

// Client Pages
const ClientHome = React.lazy(() => import('./pages/Client/Home'));
const ClientDashboard = React.lazy(() => import('./pages/Client/Dashboard'));
const PostWork = React.lazy(() => import('./pages/Client/PostWork'));
const ClientWork = React.lazy(() => import('./pages/Client/WorkDetail'));
const SavedWorkers = React.lazy(() => import('./pages/Client/Saved'));
const ClientDisputes = React.lazy(() => import('./pages/Client/Disputes'));
const ClientProfile = React.lazy(() => import('./pages/Client/Profile'));

// Worker Pages
const WorkerHome = React.lazy(() => import('./pages/Worker/Home'));
const WorkerDashboard = React.lazy(() => import('./pages/Worker/Dashboard'));
const GetWork = React.lazy(() => import('./pages/Worker/GetWork'));
const MyWorks = React.lazy(() => import('./pages/Worker/MyWorks'));
const WorkerJob = React.lazy(() => import('./pages/Worker/Job'));
const BuySlots = React.lazy(() => import('./pages/Worker/BuySlots'));
const Levels = React.lazy(() => import('./pages/Worker/Levels'));
const WorkerDisputes = React.lazy(() => import('./pages/Worker/Disputes'));
const WorkerProfile = React.lazy(() => import('./pages/Worker/Profile'));
const KycCallback = React.lazy(() => import('./pages/Worker/KycCallback'));

// Shared Pages
const ContactUs = React.lazy(() => import('./pages/Shared/ContactUs'));
const Chat = React.lazy(() => import('./pages/Shared/Chat'));

// Control Centre (admin)
const CCDashboard = React.lazy(() => import('./pages/ControlCentre/Dashboard'));
const CCWorks = React.lazy(() => import('./pages/ControlCentre/Works'));
const CCWork = React.lazy(() => import('./pages/ControlCentre/WorkDetail'));
const CCUsers = React.lazy(() => import('./pages/ControlCentre/Users'));
const CCVerify = React.lazy(() => import('./pages/ControlCentre/Verify'));
const CCDisputes = React.lazy(() => import('./pages/ControlCentre/Disputes'));
const CCDocuments = React.lazy(() => import('./pages/ControlCentre/Documents'));
const CCCategories = React.lazy(() => import('./pages/ControlCentre/Categories'));
const CCSettings = React.lazy(() => import('./pages/ControlCentre/Settings'));

function App() {
  if (COMING_SOON) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<ComingSoon />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <MeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Redirect root to login (which forwards signed-in people to their home) */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />

            {/* Client Routes */}
            <Route path="/client" element={<Layout role="client" />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<ClientHome />} />
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="post-work" element={<PostWork />} />
              <Route path="works/:id" element={<ClientWork />} />
              <Route path="chat/:jobId" element={<Chat />} />
              <Route path="saved" element={<SavedWorkers />} />
              <Route path="disputes" element={<ClientDisputes />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="contact" element={<ContactUs />} />
              {/* Old links */}
              <Route path="reviews" element={<Navigate to="/client/dashboard" replace />} />
              <Route path="report-no-show" element={<Navigate to="/client/dashboard" replace />} />
            </Route>

            {/* Worker Routes */}
            <Route path="/worker" element={<Layout role="worker" />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<WorkerHome />} />
              <Route path="dashboard" element={<WorkerDashboard />} />
              <Route path="get-work" element={<GetWork />} />
              <Route path="works" element={<MyWorks />} />
              <Route path="job/:id" element={<WorkerJob />} />
              <Route path="chat/:jobId" element={<Chat />} />
              <Route path="buy-slots" element={<BuySlots />} />
              <Route path="levels" element={<Levels />} />
              <Route path="disputes" element={<WorkerDisputes />} />
              <Route path="profile" element={<WorkerProfile />} />
              <Route path="kyc-callback" element={<KycCallback />} />
              <Route path="contact" element={<ContactUs />} />
              <Route path="reviews" element={<Navigate to="/worker/works" replace />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/control-centre" element={<Layout role="admin" />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CCDashboard />} />
              <Route path="works" element={<CCWorks />} />
              <Route path="works/:id" element={<CCWork />} />
              <Route path="chat/:jobId" element={<Chat />} />
              <Route path="users" element={<CCUsers />} />
              <Route path="verify" element={<CCVerify />} />
              <Route path="disputes" element={<CCDisputes />} />
              <Route path="documents" element={<CCDocuments />} />
              <Route path="categories" element={<CCCategories />} />
              <Route path="settings" element={<CCSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </MeProvider>
  );
}

export default App;
