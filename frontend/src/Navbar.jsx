import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, isAdminUser } from './firebase';
import {
  Home as HomeIcon,
  LayoutDashboard,
  Truck,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bot,
  Radio,
  ChevronLeft,
  AlertTriangle,
  User,
  ShieldCheck,
  Mail,
  KeyRound
} from 'lucide-react';
import { scrollToTop } from './components/ScrollToTop';
import './index.css';

function formatNavUserName(user, isAdmin) {
  if (user?.displayName && !String(user.displayName).includes('@')) {
    return String(user.displayName).trim();
  }
  if (isAdmin) return 'Pranav Kantak';
  const rawLocal = user?.email ? String(user.email).split('@')[0] : 'User';
  const cleaned = rawLocal
    .replace(/[._-]+/g, ' ')
    .replace(/([a-zA-Z])\d+$/g, '$1')
    .trim();
  if (!cleaned) return rawLocal || 'User';
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function Navbar({ user, sidebarOpen, setSidebarOpen, onOpenWasteCamera, onOpenChatbot, onOpenLoginModal }) {
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isAdmin = isAdminUser(user);
  const displayUserName = formatNavUserName(user, isAdmin);

  const handleLogout = async () => {
    sessionStorage.setItem('gridshift_signed_out', 'true');
    localStorage.removeItem('gridshift_demo_user');
    window.dispatchEvent(new Event('gridshift_auth_change'));
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { path: '/', label: 'Overview', icon: <HomeIcon size={16} /> },
    { path: '/dashboard', label: 'Grid Map', icon: <LayoutDashboard size={16} /> },
    { path: '/redressal', label: 'Redressal', icon: <ShieldCheck size={16} /> },
    { path: '/fleet', label: 'Fleet', icon: <Truck size={16} /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
    { path: '/email-agent', label: 'Nitrosend', icon: <Mail size={16} /> },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          1. FROSTED GLASS TOP BAR
          ═══════════════════════════════════════════════════════ */}
      <header className="gs-topbar">
        {/* Left: Toggle + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="desktop-only-toggle"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.04)',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              color: '#0F172A',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title={sidebarOpen ? 'Collapse Left Pane' : 'Expand Left Pane'}
            aria-label="Toggle Left Sidebar"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>

          <Link to="/" className="gs-brand">
            <img
              src="/favicon.jpg"
              alt="GridShift Logo"
              className="gs-brand-logo"
            />
            <div>
              <span className="gs-brand-name">GridShift AI</span>
              <span className="gs-brand-sub">Predictive Waste Intelligence</span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation with Glowing Underlines */}
        <nav className="gs-nav-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={scrollToTop}
                className={`gs-nav-link ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Action Buttons & Authenticated Profile */}
        <div className="gs-nav-actions">
          {/* Report Incident — Glossy Cyan Pill */}
          <button
            onClick={onOpenWasteCamera}
            className="gs-btn-primary desktop-only-btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #00B4D8, #0EA5E9)',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.34)'
            }}
          >
            <AlertTriangle size={14} />
            <span>Report Incident</span>
          </button>

          {/* Authenticated User Pill vs Guest Sign In Button */}
          {user ? (
            <>
              <div
                className="desktop-only-btn"
                title={user?.email || displayUserName}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  border: isAdmin ? '1px solid rgba(22, 163, 74, 0.35)' : '1px solid rgba(15, 23, 42, 0.14)',
                  backgroundColor: isAdmin ? 'rgba(22, 163, 74, 0.08)' : 'rgba(15, 23, 42, 0.04)',
                  color: isAdmin ? '#15803d' : '#334155',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  maxWidth: '170px'
                }}
              >
                {isAdmin ? <ShieldCheck size={15} style={{ flexShrink: 0 }} /> : <User size={15} style={{ flexShrink: 0 }} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayUserName}</span>
              </div>

              {/* Compact Rounded-Square Logout Button */}
              <button
                onClick={handleLogout}
                className="gs-btn-ghost desktop-only-btn"
                title={`Sign Out (${user?.email || displayUserName})`}
                aria-label="Sign Out"
                style={{
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  borderRadius: '10px',
                  justifyContent: 'center',
                  border: '1px solid rgba(15, 23, 42, 0.10)',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)'
                }}
              >
                <LogOut size={15} style={{ opacity: 0.65 }} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="desktop-only-btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                backgroundColor: '#092C5E',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                fontWeight: 700,
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(9, 44, 94, 0.18)'
              }}
            >
              <KeyRound size={14} />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="mobile-hamburger"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.04)',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              color: '#0F172A',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Open Mobile Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          2. COLLAPSIBLE LEFT PANE (Desktop)
          ═══════════════════════════════════════════════════════ */}
      <aside
        style={{
          width: '260px',
          height: 'calc(100vh - 64px)',
          position: 'fixed',
          left: 0,
          top: '64px',
          zIndex: 90,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderRight: '1px solid rgba(15, 23, 42, 0.06)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 16px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            PORTAL CONTROLS
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            title="Close Left Pane"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? 'white' : '#334155',
                  backgroundColor: isActive ? '#0F172A' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Dispatch Quick Links */}
        <div style={{ borderTop: '1px solid rgba(15, 23, 42, 0.06)', paddingTop: '16px', marginBottom: 'auto' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
            SURGE & REDRESSAL
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Link
              to="/redressal"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(22, 163, 74, 0.08)',
                border: '1px solid rgba(22, 163, 74, 0.16)',
                textDecoration: 'none',
                fontSize: '11px',
                fontWeight: 700,
                color: '#15803d'
              }}
            >
              <span>🎫 Ticket Redressal SLA</span>
              <span>Active</span>
            </Link>

            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(220, 38, 38, 0.06)',
                border: '1px solid rgba(220, 38, 38, 0.10)',
                textDecoration: 'none',
                fontSize: '11px',
                fontWeight: 700,
                color: '#DC2626'
              }}
            >
              <span>⚠️ Active Micro-Surges</span>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#DC2626' }} />
            </Link>

            <Link
              to="/fleet"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.06)',
                border: '1px solid rgba(6, 182, 212, 0.10)',
                textDecoration: 'none',
                fontSize: '11px',
                fontWeight: 700,
                color: '#0891B2'
              }}
            >
              <span>🚶 Staff & Pickup Vans</span>
              <span>Active</span>
            </Link>
          </div>
        </div>

        {/* Bottom Authenticated Account Info vs Guest Sign-In */}
        <div style={{ borderTop: '1px solid rgba(15, 23, 42, 0.06)', paddingTop: '14px' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', backgroundColor: isAdmin ? '#dcfce7' : '#e0f2fe', color: isAdmin ? '#15803d' : '#0369a1' }}>
                  {isAdmin ? 'ADMINISTRATOR' : 'AUTHENTICATED USER'}
                </span>
                <Radio size={13} color="#059669" className="pulse-dot" />
              </div>
              <p style={{ fontSize: '0.76rem', fontWeight: 700, color: '#092C5E', margin: '0 0 10px 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  backgroundColor: 'rgba(220, 38, 38, 0.06)',
                  color: '#DC2626',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#092C5E',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <KeyRound size={14} />
              Sign In to Your Account
            </button>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          3. MOBILE SLIDE-IN DRAWER
          ═══════════════════════════════════════════════════════ */}
      {mobileDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          <div
            onClick={() => setMobileDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.60)', backdropFilter: 'blur(6px)' }}
          />

          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '300px',
              maxWidth: '85vw',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
              zIndex: 1001
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/favicon.jpg" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                  <span style={{ fontWeight: 900, color: '#0F172A', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>GridShift AI</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: location.pathname === item.path ? '#0F172A' : '#475569',
                      backgroundColor: location.pathname === item.path ? 'rgba(6, 182, 212, 0.08)' : 'transparent'
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenWasteCamera();
                  }}
                  className="btn btn-cta-gradient"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <AlertTriangle size={16} />
                  Report Incident
                </button>

                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenChatbot();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.04)',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    color: '#0F172A',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Bot size={16} color="#06B6D4" />
                  Ask AI Copilot
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(15, 23, 42, 0.06)', paddingTop: '16px' }}>
              {user ? (
                <>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
                    {user?.email}
                  </p>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '11px',
                      backgroundColor: 'rgba(220, 38, 38, 0.06)',
                      color: '#DC2626',
                      border: '1px solid rgba(220, 38, 38, 0.10)',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenLoginModal();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#092C5E',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <KeyRound size={15} />
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
