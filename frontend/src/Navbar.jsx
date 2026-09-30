import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { LayoutDashboard, Truck, BarChart3, LogOut, ShieldAlert } from 'lucide-react';
import './index.css';

function Navbar({ user }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Live Map', icon: <LayoutDashboard size={20} /> },
    { path: '/fleet', label: 'Fleet Management', icon: <Truck size={20} /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', padding: '0 8px' }}>
        <ShieldAlert size={28} color="var(--color-accent-green)" />
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>GridShift-AI</h2>
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
