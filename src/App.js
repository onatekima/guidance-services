import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import PrivateRoute from './components/auth/PrivateRoute';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import GuidanceDashboardLayout from './components/layout/GuidanceDashboardLayout';

// Student Pages
import Appointments from './pages/Appointments';
import AnonymousConsultation from './pages/AnonymousConsultation';
import Resources from './pages/Resources';
import Feedback from './pages/Feedback';
import NewsFeed from './pages/NewsFeed';
import Settings from './pages/Settings';

// Guidance Pages
import GuidanceDashboard from './pages/guidance/GuidanceDashboard';
import GuidanceAppointments from './pages/guidance/GuidanceAppointments';
import GuidanceAnonymousConsultations from './pages/guidance/GuidanceAnonymousConsultations';
import GuidanceResources from './pages/guidance/GuidanceResources';
import GuidanceFeedback from './pages/guidance/GuidanceFeedback';
import GuidanceNewsFeed from './pages/guidance/GuidanceNewsFeed';

// Auth Pages
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';
import NewLogin from './pages/NewLogin';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<NewLogin />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Student Routes - Protected with role requirement */}
              <Route element={<PrivateRoute requiredRole="student" />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<NewsFeed />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/anonymous-consultation" element={<AnonymousConsultation />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
              
              {/* Guidance Routes - Protected with role requirement */}
              <Route element={<PrivateRoute requiredRole="guidance" />}>
                <Route element={<GuidanceDashboardLayout />}>
                  <Route path="/guidance" element={<GuidanceDashboard />} />
                  <Route path="/guidance/news-feed" element={<GuidanceNewsFeed />} />
                  <Route path="/guidance/appointments" element={<GuidanceAppointments />} />
                  <Route path="/guidance/anonymous-consultations" element={<GuidanceAnonymousConsultations />} />
                  <Route path="/guidance/resources" element={<GuidanceResources />} />
                  <Route path="/guidance/feedback" element={<GuidanceFeedback />} />
                  <Route path="/guidance/settings" element={<Settings />} />
                </Route>
              </Route>
              
              {/* Redirect unknown routes to appropriate dashboard based on role */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
