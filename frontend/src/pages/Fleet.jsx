import { useState, useEffect } from 'react';
import {
  Truck,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Clock,
  Fuel,
  Zap,
  Radio,
  Lock,
  Send,
  X,
  ShieldCheck
} from 'lucide-react';
import { isAdminUser } from '../firebase';
import { Link } from 'react-router-dom';

function Fleet({ user, onOpenLoginModal }) {
  const isAdmin = isAdminUser(user);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [truckAnimations, setTruckAnimations] = useState({});

  // Route Request Modal state for non-admins / citizens
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reqZone, setReqZone] = useState('Ward 7 — Margao Market (On Foot)');
  const [reqUrgency, setReqUrgency] = useState('High');
  const [reqNotes, setReqNotes] = useState('');
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const initialTrucks = [
    { id: 'V-102 (Pickup Van)', status: 'Active', zone: 'Ward 14 — Aquem & Borda', load: 54, driver: 'R. Naik (Staff)', fuel: 84, eta: '8 min' },
    { id: 'Foot Crew W-7', status: 'Active', zone: 'Ward 7 — Margao Market (On Foot)', load: 40, driver: 'Sanitation Beat Crew (4 Staff)', fuel: 100, eta: '5 min' },
    { id: 'V-104 (Pickup Van)', status: 'Rerouted', zone: 'Ward 10 — Comba Heritage', load: 62, driver: 'D. Kerkar (Staff)', fuel: 76, eta: '11 min' },
    { id: 'T-402 (Compactor)', status: 'Active', zone: 'Margao Fish Market Gate', load: 85, driver: 'M. Rodriguez', fuel: 72, eta: '12 min' },
    { id: 'T-119 (Compactor)', status: 'Rerouted', zone: 'Ward 2 — Fatorda Sector', load: 42, driver: 'S. Chen', fuel: 58, eta: '24 min' },
    { id: 'T-304 (Tipping Truck)', status: 'Active', zone: 'Bypass C&D Corridor', load: 92, driver: 'J. Smith', fuel: 34, eta: '6 min' },
    { id: 'T-882 (Compactor)', status: 'Maintenance', zone: 'Municipal Depot', load: 0, driver: 'N/A', fuel: 100, eta: '—' },
  ];

  const optimizedTrucks = [
    { id: 'V-102 (Pickup Van)', status: 'Optimized', zone: 'Aquem → Station Road', load: 54, driver: 'R. Naik (Staff)', fuel: 84, eta: '4 min' },
    { id: 'Foot Crew W-7', status: 'Optimized', zone: 'Market Footpath Sweep (On Foot)', load: 40, driver: 'Sanitation Beat Crew (4 Staff)', fuel: 100, eta: '3 min' },
    { id: 'V-104 (Pickup Van)', status: 'Optimized', zone: 'Comba → Borda Sector', load: 62, driver: 'D. Kerkar (Staff)', fuel: 76, eta: '6 min' },
    { id: 'T-402 (Compactor)', status: 'Active', zone: 'Margao Fish Market Gate', load: 85, driver: 'M. Rodriguez', fuel: 72, eta: '8 min' },
    { id: 'T-119 (Compactor)', status: 'Optimized', zone: 'Ward 2 → Ward 7 Support', load: 42, driver: 'S. Chen', fuel: 58, eta: '14 min' },
    { id: 'T-304 (Tipping Truck)', status: 'Optimized', zone: 'Bypass → Cacora C&D Plant', load: 92, driver: 'J. Smith', fuel: 34, eta: '4 min' },
    { id: 'T-882 (Compactor)', status: 'Maintenance', zone: 'Municipal Depot', load: 0, driver: 'N/A', fuel: 100, eta: '—' },
  ];

  const trucks = optimized ? optimizedTrucks : initialTrucks;

  const handleOptimize = () => {
    if (!isAdmin) return;
    if (optimizing) return;
    setOptimizing(true);
    setOptimized(false);
    
    // Simulate processing with row-by-row animation
    trucks.forEach((truck, i) => {
      setTimeout(() => {
        setTruckAnimations(prev => ({ ...prev, [truck.id]: true }));
      }, i * 200);
    });

    setTimeout(() => {
      setOptimized(true);
      setOptimizing(false);
      setTruckAnimations({});

      // Broadcast notification into Nitrosend email section
      const fleetNotice = {
        id: `ns-fleet-${Date.now()}`,
        recipient: 'all-citizens@madgaon.gov.in',
        type: 'Fleet Dynamic Reroute Alert',
        subject: '🚛 [Fleet Telemetry] Municipal Routes Optimized by Admin',
        status: 'Delivered',
        timestamp: new Date().toLocaleString(),
        preview: `AI Route Optimization executed for Madgaon Municipal Sector. Van V-102 & Crew W-7 rerouted to high-density zones with 25-40% travel time savings.`
      };
      try {
        const existing = JSON.parse(localStorage.getItem('gridshift_nitrosend_logs') || '[]');
        const updated = [fleetNotice, ...existing];
        localStorage.setItem('gridshift_nitrosend_logs', JSON.stringify(updated.slice(0, 30)));
        window.dispatchEvent(new CustomEvent('nitrosendLogAdded', { detail: fleetNotice }));
      } catch (err) {
        console.warn('Nitrosend log store fallback', err);
      }
    }, 2000);
  };

  const handleOpenRequestModal = () => {
    if (!user) {
      if (typeof onOpenLoginModal === 'function') {
        onOpenLoginModal();
      }
      return;
    }
    setRequestModalOpen(true);
  };

  const handleSubmitRouteRequest = (e) => {
    e.preventDefault();
    if (!reqZone) return;

    const requestNotice = {
      id: `ns-req-${Date.now()}`,
      recipient: user?.email || 'citizen@madgaon.gov.in',
      type: 'Route Optimization Request',
      subject: `📍 [Route Request] ${reqZone} Optimization Requested`,
      status: 'Delivered',
      timestamp: new Date().toLocaleString(),
      preview: `Optimization requested for ${reqZone} (Urgency: ${reqUrgency}). Notes: ${reqNotes.trim() || 'General high-load mitigation'}. Notified Municipal Admin Desk.`
    };

    try {
      const existing = JSON.parse(localStorage.getItem('gridshift_nitrosend_logs') || '[]');
      const updated = [requestNotice, ...existing];
      localStorage.setItem('gridshift_nitrosend_logs', JSON.stringify(updated.slice(0, 30)));
      window.dispatchEvent(new CustomEvent('nitrosendLogAdded', { detail: requestNotice }));
    } catch (err) {
      console.warn('Nitrosend log store fallback', err);
    }

    setRequestModalOpen(false);
    setReqNotes('');
    setRequestSuccessMsg(`Route Optimization Request for "${reqZone}" submitted! Telemetry notification dispatched to Nitrosend.`);
    setTimeout(() => setRequestSuccessMsg(''), 5500);
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Active': return { bg: 'rgba(5, 150, 105, 0.08)', color: '#059669', border: 'rgba(5, 150, 105, 0.15)' };
      case 'Rerouted': return { bg: 'rgba(217, 119, 6, 0.08)', color: '#D97706', border: 'rgba(217, 119, 6, 0.15)' };
      case 'Optimized': return { bg: 'rgba(6, 182, 212, 0.08)', color: '#0891B2', border: 'rgba(6, 182, 212, 0.15)' };
      case 'Maintenance': return { bg: 'rgba(220, 38, 38, 0.06)', color: '#DC2626', border: 'rgba(220, 38, 38, 0.12)' };
      default: return { bg: 'rgba(100, 116, 139, 0.08)', color: '#64748B', border: 'rgba(100, 116, 139, 0.15)' };
    }
  };

  const getLoadColor = (load) => {
    if (load > 90) return '#DC2626';
    if (load > 70) return '#D97706';
    return '#06B6D4';
  };

  const statCards = [
    {
      icon: <Truck size={24} />,
      iconBg: 'linear-gradient(135deg, #059669, #10B981)',
      value: trucks.filter(t => t.status !== 'Maintenance').length,
      label: 'Active Vehicles',
      change: '+2 since 8AM'
    },
    {
      icon: <Navigation size={24} />,
      iconBg: 'linear-gradient(135deg, #D97706, #F59E0B)',
      value: optimized ? 5 : 3,
      label: 'AI Reroutes Today',
      change: optimized ? '+2 optimized' : 'Last: 14 min ago'
    },
    {
      icon: <AlertTriangle size={24} />,
      iconBg: 'linear-gradient(135deg, #DC2626, #EF4444)',
      value: trucks.filter(t => t.load > 90).length,
      label: 'Critical Load Warnings',
      change: 'T-304: 92% capacity'
    }
  ];

  return (
    <div className="page-container" style={{ padding: '28px 32px', minHeight: '100%', width: '100%', boxSizing: 'border-box' }}>
      {/* Route Request Success Banner */}
      {requestSuccessMsg && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(22, 163, 74, 0.10)',
            border: '1px solid rgba(22, 163, 74, 0.28)',
            color: '#15803d',
            fontSize: '0.86rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} />
            <span>{requestSuccessMsg}</span>
          </div>
          <Link
            to="/email-agent"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#15803d',
              color: 'white',
              fontSize: '0.78rem',
              fontWeight: 800,
              textDecoration: 'none'
            }}
          >
            Open Nitrosend Hub &rarr;
          </Link>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '14px',
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.30)'
            }}>
              <Truck size={18} color="white" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Fleet Dispatch</h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.92rem', fontWeight: 500 }}>Real-time vehicle telemetry and AI-driven rerouting.</p>
        </div>

        {/* Action Controls: Admin Reroute vs Non-Admin Request */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isAdmin ? (
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '10px',
                background: optimizing
                  ? 'linear-gradient(135deg, #1E293B, #334155)'
                  : optimized
                    ? 'linear-gradient(135deg, #059669, #10B981)'
                    : 'linear-gradient(135deg, #06B6D4, #0EA5E9)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: optimizing ? 'wait' : 'pointer',
                boxShadow: optimizing
                  ? '0 4px 12px rgba(15, 23, 42, 0.25)'
                  : optimized
                    ? '0 4px 16px rgba(5, 150, 105, 0.30)'
                    : '0 4px 16px rgba(6, 182, 212, 0.30)',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: optimizing ? 'scale(0.98)' : 'scale(1)'
              }}
            >
              {optimizing ? (
                <>
                  <RotateCcw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Optimizing Routes...
                </>
              ) : optimized ? (
                <>
                  <CheckCircle2 size={16} />
                  Routes Optimized ✓
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Optimize Routes Now
                </>
              )}
            </button>
          ) : (
            <>
              {/* Informative Admin-Restricted Badge */}
              <div
                title="Only Municipal Platform Administrator (Pranav Kantak) can execute AI Route Optimization"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.05)',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  color: '#64748b',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'default'
                }}
              >
                <Lock size={14} color="#94a3b8" />
                <span>Admin Optimization Control</span>
              </div>

              {/* Citizen/User Route Optimization Request Button */}
              <button
                type="button"
                onClick={handleOpenRequestModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #092C5E, #0284c7)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(9, 44, 94, 0.22)',
                  transition: 'all 0.2s'
                }}
              >
                <MapPin size={15} />
                <span>Request Route Optimization</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        {statCards.map((card, i) => (
          <div
            key={i}
            className="gs-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px 24px',
              opacity: animateIn ? 1 : 0,
              transform: animateIn ? 'translateY(0)' : 'translateY(16px)',
              transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${150 + i * 100}ms`
            }}
          >
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: card.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {card.value}
              </div>
              <div style={{ color: '#475569', fontSize: '0.86rem', fontWeight: 600, marginTop: '2px' }}>
                {card.label}
              </div>
              <div style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 700, marginTop: '2px' }}>
                {card.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Telemetry Table */}
      <div className="gs-card" style={{
        padding: '24px',
        overflowX: 'auto',
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 450ms'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} color="#06B6D4" className="pulse-dot" />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              LIVE FLEET TELEMETRY
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Last sync: 4s ago</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vehicle ID</th>
              <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
              <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Zone</th>
              <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capacity Load</th>
              <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fuel</th>
              <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ETA</th>
              <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Driver</th>
            </tr>
          </thead>
          <tbody>
            {trucks.map((truck) => {
              const statusStyle = getStatusStyle(truck.status);
              const isAnimating = truckAnimations[truck.id];
              return (
                <tr
                  key={truck.id}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    backgroundColor: isAnimating ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                    transition: 'background-color 0.4s ease'
                  }}
                >
                  <td style={{ padding: '14px', fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={14} color="#64748B" />
                      {truck.id}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      letterSpacing: '0.03em',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`
                    }}>
                      {truck.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px', color: '#475569', fontSize: '0.84rem', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} color="#94A3B8" />
                      {truck.zone}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
                      <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${truck.load}%`,
                          backgroundColor: getLoadColor(truck.load),
                          borderRadius: '3px',
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: getLoadColor(truck.load), minWidth: '32px' }}>
                        {truck.load}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: '#475569', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Fuel size={13} color="#94A3B8" />
                      {truck.fuel}%
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: '#475569', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} color="#94A3B8" />
                      {truck.eta}
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: '#334155', fontSize: '0.84rem', fontWeight: 600 }}>
                    {truck.driver}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Citizen Route Optimization Request Modal */}
      {requestModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1500,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRequestModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              border: '1px solid rgba(226, 232, 240, 0.9)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#092C5E' }}>
                  Request Route Optimization
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitRouteRequest} style={{ padding: '22px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#092C5E', marginBottom: '6px' }}>
                  Target Zone / Route
                </label>
                <select
                  value={reqZone}
                  onChange={(e) => setReqZone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    backgroundColor: '#f8fafc',
                    color: '#0F172A',
                    fontWeight: 600
                  }}
                >
                  <option value="Ward 7 — Margao Market (On Foot)">Ward 7 — Margao Market (Market Footpath Sweep)</option>
                  <option value="Ward 14 — Aquem & Borda (Pickup Van)">Ward 14 — Aquem &amp; Borda (Station Road Sector)</option>
                  <option value="Ward 10 — Comba Heritage (Pickup Van)">Ward 10 — Comba Heritage (Comba → Borda Sector)</option>
                  <option value="Ward 2 — Fatorda Sector (Compactor)">Ward 2 — Fatorda Sector (Ward 2 Support)</option>
                  <option value="Bypass C&D Corridor (Tipping Truck)">Bypass C&amp;D Corridor (Cacora C&amp;D Plant Route)</option>
                  <option value="Margao Fish Market Gate (Compactor)">Margao Fish Market Gate (Fish Market Waste Clearance)</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#092C5E', marginBottom: '6px' }}>
                  Urgency Level
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Normal', 'High', 'Critical'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setReqUrgency(level)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: reqUrgency === level ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: reqUrgency === level ? 'rgba(2, 132, 199, 0.12)' : '#ffffff',
                        color: reqUrgency === level ? '#0284c7' : '#64748b',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#092C5E', marginBottom: '6px' }}>
                  Observation / Reason
                </label>
                <textarea
                  rows={3}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="e.g., Heavy vegetable overflow near market gate; beat crew required before 4 PM..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#092C5E',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={14} />
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fleet;
