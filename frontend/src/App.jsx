import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import Navbar from './Navbar';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Analytics from './pages/Analytics';
import Redressal from './pages/Redressal';
import NitrosendDashboard from './pages/NitrosendDashboard';
import {
  AboutUsPage,
  ContactUsPage,
  PrivacyPolicyPage,
  TermsAndConditionsPage
} from './pages/LegalAndInfoPages';
import Chatbot from './components/Chatbot';
import WasteCameraModal from './components/WasteCameraModal';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [demoUser, setDemoUser] = useState(() => {
    try {
      if (sessionStorage.getItem('gridshift_signed_out') === 'true') {
        return null;
      }
      const saved = localStorage.getItem('gridshift_demo_user');
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setAuthChecked(true);
        },
        () => {
          setAuthChecked(true);
        }
      );
    } catch {
      setAuthChecked(true);
    }

    const fallbackTimer = setTimeout(() => setAuthChecked(true), 600);

    const handleAuthChange = () => {
      try {
        if (sessionStorage.getItem('gridshift_signed_out') === 'true') {
          setUser(null);
          setDemoUser(null);
          return;
        }
        const saved = localStorage.getItem('gridshift_demo_user');
        setDemoUser(saved ? JSON.parse(saved) : null);
        if (auth?.currentUser) {
          setUser(auth.currentUser);
        }
      } catch {
        setDemoUser(null);
      }
    };
    window.addEventListener('gridshift_auth_change', handleAuthChange);

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
      window.removeEventListener('gridshift_auth_change', handleAuthChange);
    };
  }, []);

  if (!authChecked) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <img src="/favicon.jpg" alt="Loading" style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '16px' }} className="pulse-dot" />
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#092C5E' }}>Loading GridShift-AI...</span>
      </div>
    );
  }

  const rawUser = user || demoUser;
  const activeUser = rawUser
    ? {
        uid: rawUser.uid || demoUser?.uid || 'gridshift-user',
        email:
          rawUser.email ||
          demoUser?.email ||
          (rawUser.phoneNumber
            ? `${String(rawUser.phoneNumber).replace(/\D/g, '')}@mobile.gridshift.ai`
            : 'citizen@gridshift.ai'),
        phoneNumber: rawUser.phoneNumber || demoUser?.phoneNumber || null,
        displayName:
          rawUser.displayName ||
          demoUser?.displayName ||
          (rawUser.email ? rawUser.email.split('@')[0] : rawUser.phoneNumber || 'Municipal User'),
        photoURL: rawUser.photoURL || demoUser?.photoURL || null
      }
    : null;

  // Protected action: prompts login modal for unauthenticated visitors
  const handleOpenWasteCamera = () => {
    if (!activeUser) {
      setLoginModalOpen(true);
      return;
    }
    setCameraModalOpen(true);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppLayout
        activeUser={activeUser}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleOpenWasteCamera={handleOpenWasteCamera}
        setLoginModalOpen={setLoginModalOpen}
        quotaExceeded={quotaExceeded}
        loginModalOpen={loginModalOpen}
        cameraModalOpen={cameraModalOpen}
        setCameraModalOpen={setCameraModalOpen}
      />
    </BrowserRouter>
  );
}

function AppLayout({
  activeUser,
  sidebarOpen,
  setSidebarOpen,
  handleOpenWasteCamera,
  setLoginModalOpen,
  quotaExceeded,
  loginModalOpen,
  cameraModalOpen,
  setCameraModalOpen
}) {
  const location = useLocation();
  const isGridMap = location.pathname === '/dashboard';

  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#fbfbfd' }}>
      {/* Google Maps Platform Demo Key Quota Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 flex items-center justify-between gap-4 text-sm sticky top-0 z-50">
          <div>
            <span className="font-semibold">Maps Demo Key quota reached.</span>{' '}
            To unlock higher limits and full API access, create a Google Cloud billing account and replace{' '}
            <code className="bg-amber-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in AI Studio Secrets with your own key.
          </div>
          <a
            href="https://developers.google.com/maps/documentation/javascript/get-api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-amber-900 text-white px-3 py-1.5 rounded font-medium hover:bg-amber-800 transition-colors"
          >
            Get API Key &rarr;
          </a>
        </div>
      )}

      {/* GridShift-AI Responsive Header & Collapsible Sidebar */}
      <Navbar
        user={activeUser}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenWasteCamera={handleOpenWasteCamera}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        onOpenChatbot={() => {
          const chatBtn = document.querySelector('button[aria-label="Open AI Copilot Chat"]');
          if (chatBtn) chatBtn.click();
        }}
      />

      {/* Waste Reporting Camera & Automated Ticket Modal */}
      <WasteCameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        currentUser={activeUser}
      />

      {/* Guest Authentication Modal (opens on protected feature usage or Sign In click) */}
      {loginModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLoginModalOpen(false);
          }}
        >
          <div style={{ width: '100%', maxWidth: '470px' }}>
            <Login
              onClose={() => setLoginModalOpen(false)}
              onAuthSuccess={() => setLoginModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className="main-viewport"
        style={
          isGridMap
            ? {
                marginTop: '64px',
                marginLeft: sidebarOpen ? '260px' : '0px',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                height: 'calc(100vh - 64px)',
                position: 'relative',
                overflow: 'hidden'
              }
            : {
                marginTop: '64px',
                marginLeft: sidebarOpen ? '260px' : '0px',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                height: 'calc(100vh - 64px)',
                position: 'relative',
                overflowY: 'auto'
              }
        }
      >
        <Routes>
          <Route path="/" element={<Home onOpenWasteCamera={handleOpenWasteCamera} />} />
          <Route path="/dashboard" element={<Dashboard user={activeUser} />} />
          <Route
            path="/redressal"
            element={
              <Redressal
                user={activeUser}
                onOpenWasteCamera={handleOpenWasteCamera}
                onOpenLoginModal={() => setLoginModalOpen(true)}
              />
            }
          />
          <Route
            path="/fleet"
            element={
              <Fleet
                user={activeUser}
                onOpenLoginModal={() => setLoginModalOpen(true)}
              />
            }
          />
          <Route path="/analytics" element={<Analytics user={activeUser} />} />
          <Route
            path="/email-agent"
            element={
              <NitrosendDashboard
                user={activeUser}
                onOpenLoginModal={() => setLoginModalOpen(true)}
              />
            }
          />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsAndConditionsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Gemini RAG Chatbot Floating Component */}
      <Chatbot />
    </div>
  );
}

export default App;
