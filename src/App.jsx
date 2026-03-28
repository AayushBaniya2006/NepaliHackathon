import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GlobalNav from './components/GlobalNav';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DrawingSession from './pages/DrawingSession';
import SessionResults from './pages/SessionResults';
import CareNote from './pages/CareNote';
import FindDoctor from './pages/FindDoctor';
import './index.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <>
    <GlobalNav />
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/draw" element={<DrawingSession />} />
          <Route path="/session-results" element={<SessionResults />} />
          {/* Public shareable Care Board sender — no auth required */}
          <Route path="/care/:patientId" element={<CareNote />} />
          {/* Doctor Finder */}
          <Route path="/find-doctor" element={<FindDoctor />} />
          {/* Clinician / insurance / resources live in doctor-saas only — keep old URLs from bookmarking */}
          <Route path="/clinician" element={<Navigate to="/dashboard" replace />} />
          <Route path="/insurance" element={<Navigate to="/dashboard" replace />} />
          <Route path="/resources" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
