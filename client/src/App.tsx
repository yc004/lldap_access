import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';
import AdminPanel from './pages/AdminPanel';
import Setup from './pages/Setup';
import Layout, { ProtectedRoute, AdminRoute } from './components/Layout';
import client from './api/client';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const { data } = await client.get('/setup/status');
      if (!data.isConfigured && location.pathname !== '/setup') {
        navigate('/setup');
      }
    } catch (error) {
      console.error('Setup check failed', error);
    } finally {
      setChecking(false);
    }
  };

  if (checking) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <Routes>
      <Route path="/setup" element={<Setup />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<UserProfile />} />
        <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <ToastContainer position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
