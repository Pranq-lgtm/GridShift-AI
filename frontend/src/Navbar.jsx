import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { 
  Home as HomeIcon, 
  LayoutDashboard, 
  Truck, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Camera, 
  Bot, 
  Layers, 
  ShieldCheck, 
  Radio, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './index.css';

function Navbar({ user, sidebarOpen, setSidebarOpen, onOpenWasteCamera, onOpenChatbot }) {
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Overview', icon: <HomeIcon size={18} /> },
    { path: '/dashboard', label: 'Live Grid Map', icon: <LayoutDashboard size={18} /> },
    { path: '/fleet', label: 'Fleet & Rovers', icon: <Truck size={18} /> },
    { path: '/analytics', label: 'Surge Analytics', icon: <BarChart3 size={18} /> },
  ];

  return (
    <>
      {/* 1. PARIVAHAN SEWA-STYLE TOPBAR HEADER */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '68px',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        {/* Left: Sidebar Toggle + Brand Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Desktop Left-Side Pane Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#092C5E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title={sidebarOpen ? 'Collapse Left Pane' : 'Expand Left Pane'}
            aria-label="Toggle Left Sidebar"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>

          {/* Parivahan Sewa Official Emblem & Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '42px',
                height: '46px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              <img src="/favicon.jpg" alt="Logo" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
              <span style={{ fontSize: '7px', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginTop: '1px' }}>
                GOA-MMC
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#092C5E', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  GridShift <span style={{ color: '#22c55e' }}>Sewa</span>
                </span>
                <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                  2.0
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Urban Waste Intelligence Portal
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Desktop Links (Parivahan Style) */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: isActive ? '#092C5E' : '#475569',
                  backgroundColor: isActive ? 'rgba(34, 197, 94, 0.14)' : 'transparent',
                  border: isActive ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick Photo Report Button */}
          <button
            onClick={onOpenWasteCamera}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              backgroundColor: '#092C5E',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(9, 44, 94, 0.2)'
            }}
            title="Snap Photo to Report Waste"
          >
            <Camera size={15} color="#22c55e" />
            <span className="hide-on-mobile">Report Waste</span>
          </button>

          {/* Copilot Chat Trigger */}
          <button
            onClick={onOpenChatbot}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              backgroundColor: 'white',
              color: '#092C5E',
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <Bot size={15} color="#22c55e" />
            <span className="hide-on-mobile">Ask Copilot</span>
          </button>

          {/* User Signout */}
          <button
            onClick={() => signOut(auth)}
            style={{
              padding: '8px 12px',
              borderRadius: '9999px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Sign Out"
          >
            <LogOut size={14} />
            <span className="hide-on-mobile">Logout</span>
          </button>

          {/* Mobile Hamburger Drawer Button */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="mobile-hamburger"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#092C5E',
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

      {/* 2. COLLAPSIBLE LEFT-SIDE PANE (Desktop & Tablet) */}
      <aside
        style={{
          width: '260px',
          height: 'calc(100vh - 68px)',
          position: 'fixed',
          left: 0,
          top: '68px',
          zIndex: 90,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '4px 0 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 16px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            PORTAL CONTROLS
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            title="Close Left Pane"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? 'white' : '#334155',
                  backgroundColor: isActive ? '#092C5E' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Live Municipal Dispatch Shortcuts */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: 'auto' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
            HOTSPOT DISPATCHES
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                textDecoration: 'none',
                fontSize: '11px',
                fontWeight: 700,
                color: '#b91c1c'
              }}
            >
              <span>⚠️ Margao Fish Market (18T)</span>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            </Link>

            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                textDecoration: 'none',
                fontSize: '11px',
                fontWeight: 700,
                color: '#b45309'
              }}
            >
              <span>🏗️ Fatorda C&D Debris (14.5T)</span>
              <span>Active</span>
            </Link>

            <Link
              to="/fleet"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                textDecoration: 'none',
                fontSize: '11px',
                fontWeight: 700,
                color: '#1d4ed8'
              }}
            >
              <span>🤖 Rover R-1 (Bayshore Ave)</span>
              <span>Scanning</span>
            </Link>
          </div>
        </div>

        {/* Bottom Profile Info & LoRaWAN Health */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#16a34a', fontWeight: 700, marginBottom: '8px' }}>
            <Radio size={14} className="pulse-dot" />
            <span>LoRaWAN Mesh: 140 Units (100%)</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 10px 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email || user?.phoneNumber || 'Authenticated User'}
          </p>
        </div>
      </aside>

      {/* 3. PARIVAHAN SEWA-STYLE MOBILE SLIDE-IN DRAWER */}
      {mobileDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer Body */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '320px',
              maxWidth: '85vw',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
              zIndex: 1001
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/favicon.jpg" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                  <span style={{ fontWeight: 900, color: '#092C5E', fontSize: '1.1rem' }}>GridShift Sewa</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: location.pathname === item.path ? '#092C5E' : '#475569',
                      backgroundColor: location.pathname === item.path ? 'rgba(34, 197, 94, 0.12)' : 'transparent'
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
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
                >
                  <Camera size={16} style={{ marginRight: '8px' }} />
                  Report Waste (Camera)
                </button>

                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenChatbot();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#092C5E',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Bot size={16} color="#16a34a" />
                  Ask AI Copilot (RAG)
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
                {user?.email || user?.phoneNumber}
              </p>
              <button
                onClick={() => signOut(auth)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
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
