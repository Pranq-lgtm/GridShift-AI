import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { Home as HomeIcon, LayoutDashboard, Truck, BarChart3, LogOut } from 'lucide-react';
import './index.css';

function Navbar({ user }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Overview', icon: <HomeIcon size={20} /> },
    { path: '/dashboard', label: 'Live Grid Map', icon: <LayoutDashboard size={20} /> },
    { path: '/fleet', label: 'Fleet & Rovers', icon: <Truck size={20} /> },
    { path: '/analytics', label: 'Surge Analytics', icon: <BarChart3 size={20} /> },
  ];

  return (
    <nav className="glass-panel" style={{
      width: '250px',
      height: 'calc(100vh - 40px)',
      position: 'absolute',
      left: '20px',
      top: '20px',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px', padding: '0 8px' }}>
        <img 
          src="/favicon.jpg" 
          alt="GridShift Logo" 
          style={{ width: '34px', height: '34px', borderRadius: '10px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)', border: '1px solid rgba(34, 197, 94, 0.3)' }} 
        />
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#092C5E', letterSpacing: '-0.02em' }}>GridShift-AI</h2>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SENTINEL ACTIVE</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--color-text-main)',
                background: isActive ? 'var(--color-accent-green)' : 'transparent',
                transition: 'all 0.2s',
                fontWeight: isActive ? 600 : 500,
              }}
              className="nav-link"
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-glass-border)', paddingTop: '20px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '0 8px', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.email}
        </p>
        <button 
          onClick={() => signOut(auth)} 
          className="btn" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--color-text-main)' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
