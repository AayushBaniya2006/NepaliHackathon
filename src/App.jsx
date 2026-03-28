import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import GlobalNav from './components/GlobalNav';
import Landing from './pages/Landing';
import './index.css';

/* Lazy-load all pages except Landing (first paint) */
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DrawingSession = lazy(() => import('./pages/DrawingSession'));
const SessionResults = lazy(() => import('./pages/SessionResults'));
const ClinicianDashboard = lazy(() => import('./pages/ClinicianDashboard'));
const InsuranceForm = lazy(() => import('./pages/InsuranceForm'));
const ResourceFinder = lazy(() => import('./pages/ResourceFinder'));
const AppExperience = lazy(() => import('./pages/AppExperience'));
const FindDoctor = lazy(() => import('./pages/FindDoctor'));

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '80vh', fontFamily: 'var(--font-body)',
      color: 'var(--ink)', padding: '24px', textAlign: 'center',
    }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: '8px' }}>404</h1>
      <p style={{ color: 'var(--stone)', marginBottom: '24px' }}>This page doesn't exist.</p>
      <button
        onClick={() => navigate('/')}
        className="btn btn-primary"
      >
        Go Home
      </button>
    </div>
  );
}

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
    <Suspense fallback={
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', fontFamily: 'var(--font-body)', color: 'var(--stone)',
      }}>
        Loading...
      </div>
    }>
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
            <Route path="/find-doctor" element={<FindDoctor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Suspense>
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
