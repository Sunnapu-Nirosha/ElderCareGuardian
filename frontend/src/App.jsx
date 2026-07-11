import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ElderlyProfiles from './pages/ElderlyProfiles';
import MedicineManagement from './pages/MedicineManagement';
import WellnessCheck from './pages/WellnessCheck';
import VoiceInteraction from './pages/VoiceInteraction';
import EmergencyDetection from './pages/EmergencyDetection';
import MealMonitoring from './pages/MealMonitoring';
import NotificationCenter from './pages/NotificationCenter';
import WeeklyReport from './pages/WeeklyReport';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Layout Container
const AppLayout = () => {
  const { token, loading } = useAuth();
  const location = useLocation();
  const [mobileSidebarActive, setMobileSidebarActive] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarActive(!mobileSidebarActive);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarActive(false);
  };

  // If loading user profile on refresh
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Booting Guardian...</span>
        </div>
      </div>
    );
  }

  // Determine if current path requires the Dashboard layout
  const isAuthRoute = ['/', '/login', '/signup'].includes(location.pathname);

  if (isAuthRoute || !token) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Sidebar Panel */}
      <Sidebar isMobileActive={mobileSidebarActive} closeMobileSidebar={closeMobileSidebar} />

      {/* Main Panel Content Area */}
      <div className="main-content">
        <Navbar toggleMobileSidebar={toggleMobileSidebar} />
        
        {/* Sub Routing Page Views */}
        <div className="flex-grow-1">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profiles" element={<ProtectedRoute><ElderlyProfiles /></ProtectedRoute>} />
            <Route path="/medicines" element={<ProtectedRoute><MedicineManagement /></ProtectedRoute>} />
            <Route path="/wellness" element={<ProtectedRoute><WellnessCheck /></ProtectedRoute>} />
            <Route path="/voice" element={<ProtectedRoute><VoiceInteraction /></ProtectedRoute>} />
            <Route path="/emergency" element={<ProtectedRoute><EmergencyDetection /></ProtectedRoute>} />
            <Route path="/meals" element={<ProtectedRoute><MealMonitoring /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><WeeklyReport /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <AppLayout />
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
