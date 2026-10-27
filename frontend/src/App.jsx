import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, ADMIN_EMAIL } from './firebase';
import Login from './Login';
import Navbar from './Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Analytics from './pages/Analytics';
import Redressal from './pages/Redressal';
import Chatbot from './components/Chatbot';
import WasteCameraModal from './components/WasteCameraModal';
import './index.css';

const DEFAULT_ADMIN_SESSION = {
  uid: 'admin-pranavkantak9',
  email: ADMIN_EMAIL,
  displayName: 'Pranav Kantak',
  role: 'admin',
  isDemo: true
};

function App() {
  const [user, setUser] = useState(null);
  const [demoUser, setDemoUser] = useState(() => {
    try {
      if (sessionStorage.getItem('gridshift_signed_out') === 'true') {
        return null;
      }
      const saved = localStorage.getItem('gridshift_demo_user');
      if (saved) return JSON.parse(saved);
      const isPreviewIframe =
        typeof window !== 'undefined' && window.location.hostname.endsWith('.run.app');
      if (isPreviewIframe) {
        localStorage.setItem('gridshift_demo_user', JSON.stringify(DEFAULT_ADMIN_SESSION));
        return DEFAULT_ADMIN_SESSION;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
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

  if (!activeUser) {
    return <Login />;
  }

  return (
    <BrowserRouter>
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
          onOpenWasteCamera={() => setCameraModalOpen(true)}
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

        {/* Main Content Area */}
        <div
          className="main-viewport"
          style={{
            marginTop: '64px',
            marginLeft: sidebarOpen ? '260px' : '0px',
            transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            height: 'calc(100vh - 64px)',
            position: 'relative',
            overflowY: 'auto'
          }}
        >
          <Routes>
            <Route path="/" element={<Home onOpenWasteCamera={() => setCameraModalOpen(true)} />} />
            <Route path="/dashboard" element={<Dashboard user={activeUser} />} />
            <Route
              path="/redressal"
              element={
                <Redressal
                  user={activeUser}
                  onOpenWasteCamera={() => setCameraModalOpen(true)}
                />
              }
            />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Gemini RAG Chatbot Floating Component */}
        <Chatbot />
      </div>
    </BrowserRouter>
  );
}

export default App;
