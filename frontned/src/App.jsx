import React, { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import SkeletonLoader from './components/ui/SkeletonLoader';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const Services = lazy(() => import('./pages/Services'));
const Record = lazy(() => import('./pages/Record'));
const Reports = lazy(() => import('./pages/Reports'));
const Costs = lazy(() => import('./pages/Costs'));
const Settings = lazy(() => import('./pages/Settings'));
const Discounts = lazy(() => import('./pages/Discounts'));
const Haircuts = lazy(() => import('./pages/Haircuts'));

const PageLoading = () => (
  <div className="p-6">
    <SkeletonLoader type="stat" count={4} />
    <div className="mt-6"><SkeletonLoader type="card" count={3} /></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const AuthLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-navy" dir="rtl">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="transition-all duration-300 lg:mr-64">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </div>
      <BottomNav />
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Suspense fallback={<PageLoading />}><Login /></Suspense>} />

      <Route path="/" element={<ProtectedRoute><AuthLayout><Dashboard /></AuthLayout></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><AuthLayout><Employees /></AuthLayout></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute><AuthLayout><Services /></AuthLayout></ProtectedRoute>} />
      <Route path="/record" element={<ProtectedRoute><AuthLayout><Record /></AuthLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AuthLayout><Reports /></AuthLayout></ProtectedRoute>} />
      <Route path="/costs" element={<ProtectedRoute><AuthLayout><Costs /></AuthLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AuthLayout><Settings /></AuthLayout></ProtectedRoute>} />
      <Route path="/discounts" element={<ProtectedRoute><AuthLayout><Discounts /></AuthLayout></ProtectedRoute>} />
      <Route path="/haircuts" element={<ProtectedRoute><AuthLayout><Haircuts /></AuthLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
