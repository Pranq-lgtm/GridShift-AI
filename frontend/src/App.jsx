import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import Navbar from './Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Analytics from './pages/Analytics';
import Chatbot from './components/Chatbot';
import WasteCameraModal from './components/WasteCameraModal';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [demoUser, setDemoUser] = useState(() => {
    try {
      const saved = localStorage.getItem("gridshift_demo_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });

    const handleAuthChange = () => {
      try {
        const saved = localStorage.getItem("gridshift_demo_user");
        setDemoUser(saved ? JSON.parse(saved) : null);
      } catch {
        setDemoUser(null);
      }
    };
    window.addEventListener("gridshift_auth_change", handleAuthChange);

    return () => {
      unsubscribe();
      window.removeEventListener("gridshift_auth_change", handleAuthChange);
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

  const activeUser = user || demoUser;

  if (!activeUser) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#fbfbfd' }}>
        
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

        {/* Waste Reporting Camera Modal */}
        <WasteCameraModal 
          isOpen={cameraModalOpen} 
          onClose={() => setCameraModalOpen(false)} 
        />

        {/* Main Content Area */}
        <div 
          className="main-viewport"
          style={{ 
            marginTop: '68px', 
            marginLeft: sidebarOpen ? '260px' : '0px', 
            transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            height: 'calc(100vh - 68px)', 
            position: 'relative',
            overflowY: 'auto'
          }}
        >
          <Routes>
            <Route path="/" element={<Home onOpenWasteCamera={() => setCameraModalOpen(true)} />} />
            <Route path="/dashboard" element={<Dashboard />} />
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
