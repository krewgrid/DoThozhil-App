import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

// Client Pages
import ClientHome from './pages/Client/Home';
import ClientDashboard from './pages/Client/Dashboard';
import PostWork from './pages/Client/PostWork';
import ClientReviews from './pages/Client/Reviews';
import ReportNoShow from './pages/Client/ReportNoShow';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';

// Worker Pages
import WorkerHome from './pages/Worker/Home';
import WorkerDashboard from './pages/Worker/Dashboard';
import GetWork from './pages/Worker/GetWork';
import BuySlots from './pages/Worker/BuySlots';
import WorkerReviews from './pages/Worker/ReviewsAndDisputes';
import WorkerDisputes from './pages/Worker/Disputes';

// Shared Pages
import ContactUs from './pages/Shared/ContactUs';
import Profile from './pages/Shared/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

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
        <Route path="/admin" element={<Layout role="admin" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="profile" element={<Profile role="admin" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
