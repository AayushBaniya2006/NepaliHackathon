import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import GlobalNav from './components/GlobalNav';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DrawingSession from './pages/DrawingSession';
import SessionResults from './pages/SessionResults';
import ClinicianDashboard from './pages/ClinicianDashboard';
import InsuranceForm from './pages/InsuranceForm';
import ResourceFinder from './pages/ResourceFinder';
import AppExperience from './pages/AppExperience';
import './index.css';

function AnimatedRoutes() {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = ['ar', 'ur'].includes(i18n.language) ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

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
          <Route path="/clinician" element={<ClinicianDashboard />} />
          <Route path="/insurance" element={<InsuranceForm />} />
          <Route path="/resources" element={<ResourceFinder />} />
          <Route path="/app" element={<AppExperience />} />
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
