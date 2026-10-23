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
  ShieldCheck
} from 'lucide-react';
import './index.css';

function Navbar({ user, sidebarOpen, setSidebarOpen, onOpenWasteCamera, onOpenChatbot }) {
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isAdmin = isAdminUser(user);

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
    { path: '/dashboard', label: 'Live Grid Map', icon: <LayoutDashboard size={16} /> },
    { path: '/redressal', label: 'Ticket Redressal', icon: <ShieldCheck size={16} /> },
    { path: '/fleet', label: 'Fleet Dispatch', icon: <Truck size={16} /> },
    { path: '/analytics', label: 'Surge Analytics', icon: <BarChart3 size={16} /> },
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
          {/* Report Incident — Glossy Primary */}
          <button
            onClick={onOpenWasteCamera}
            className="gs-btn-primary desktop-only-btn"
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
          >
            <AlertTriangle size={13} />
            <span>Report Incident</span>
          </button>

          {/* Authenticated User Display (No Role Switcher) */}
          <div
            className="desktop-only-btn"
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              border: isAdmin ? '1px solid rgba(22, 163, 74, 0.35)' : '1px solid rgba(15, 23, 42, 0.12)',
              backgroundColor: isAdmin ? 'rgba(22, 163, 74, 0.08)' : 'rgba(15, 23, 42, 0.04)',
              color: isAdmin ? '#15803d' : '#334155',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              fontWeight: 700
            }}
          >
            {isAdmin ? <ShieldCheck size={13} /> : <User size={13} />}
            <span>{user?.email || 'User'}</span>
          </div>

          {/* Compact Logout Button */}
          <button
            onClick={handleLogout}
            className="gs-btn-ghost desktop-only-btn"
            title={`Sign Out (${user?.email || ''})`}
            aria-label="Sign Out"
            style={{ padding: '7px 9px' }}
          >
            <LogOut size={14} style={{ opacity: 0.7 }} />
          </button>

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
              <span>🤖 Autonomous Fleet</span>
              <span>Monitoring</span>
            </Link>
          </div>
        </div>

        {/* Bottom Authenticated Account Info */}
        <div style={{ borderTop: '1px solid rgba(15, 23, 42, 0.06)', paddingTop: '14px' }}>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
