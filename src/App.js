import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import GuidanceDashboardLayout from './components/layout/GuidanceDashboardLayout';

// Student Pages
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import AnonymousConsultation from './pages/AnonymousConsultation';
import Resources from './pages/Resources';
import Feedback from './pages/Feedback';
import NewsFeed from './pages/NewsFeed';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Student Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/anonymous-consultation" element={<AnonymousConsultation />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/news-feed" element={<NewsFeed />} />
            </Route>
            
            {/* Guidance Routes */}
            <Route element={<GuidanceDashboardLayout />}>
              <Route path="/guidance" element={<GuidanceDashboard />} />
              <Route path="/guidance/appointments" element={<GuidanceAppointments />} />
              <Route path="/guidance/anonymous-consultations" element={<GuidanceAnonymousConsultations />} />
              <Route path="/guidance/resources" element={<GuidanceResources />} />
              <Route path="/guidance/feedback" element={<GuidanceFeedback />} />
              <Route path="/guidance/news-feed" element={<GuidanceNewsFeed />} />
            </Route>
            
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
