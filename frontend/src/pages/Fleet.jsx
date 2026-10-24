import { useState, useEffect } from 'react';
import { Truck, Navigation, AlertTriangle, CheckCircle2, RotateCcw, MapPin, Clock, Fuel, Zap, Radio } from 'lucide-react';

function Fleet() {
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [truckAnimations, setTruckAnimations] = useState({});

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
    }, 2000);
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
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: card.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              flexShrink: 0
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0F172A', lineHeight: 1, marginBottom: '2px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '2px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8' }}>
                {card.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fleet Table */}
      <div
        className="gs-card"
        style={{
          padding: 0,
          overflowX: 'auto',
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 500ms'
        }}
      >
        {/* Table header bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(15, 23, 42, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={14} color="#06B6D4" className="pulse-dot" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Live Fleet Telemetry
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8' }}>
            Last sync: 4s ago
          </span>
        </div>

        <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.02)' }}>
              {['Vehicle ID', 'Status', 'Current Zone', 'Capacity Load', 'Fuel', 'ETA', 'Driver'].map((header, i) => (
                <th key={i} style={{
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid rgba(15, 23, 42, 0.06)'
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trucks.map((truck, rowIndex) => {
              const statusStyle = getStatusStyle(truck.status);
              const loadColor = getLoadColor(truck.load);
              const isProcessing = truckAnimations[truck.id];

              return (
                <tr
                  key={truck.id}
                  style={{
                    borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
                    background: isProcessing ? 'rgba(6, 182, 212, 0.04)' : 'transparent',
                    transition: 'all 0.4s ease',
                    animation: animateIn ? `fadeSlideIn 0.4s ease ${600 + rowIndex * 80}ms both` : 'none'
                  }}
                >
                  {/* Vehicle ID */}
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={15} color="#64748B" />
                      {truck.id}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      transition: 'all 0.3s ease'
                    }}>
                      {truck.status === 'Optimized' && (
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: '#06B6D4',
                          animation: 'softPulse 1.5s infinite'
                        }} />
                      )}
                      {truck.status}
                    </span>
                  </td>

                  {/* Zone */}
                  <td style={{ padding: '14px 20px', fontSize: '0.88rem', color: '#334155', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} color="#94A3B8" />
                      {truck.zone}
                    </div>
                  </td>

                  {/* Load Bar */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, maxWidth: '120px', background: 'rgba(15, 23, 42, 0.06)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${truck.load}%`,
                          background: loadColor,
                          height: '100%',
                          borderRadius: '3px',
                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: truck.load > 90 ? '0 0 6px rgba(220, 38, 38, 0.4)' : 'none'
                        }} />
                      </div>
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        width: '38px',
                        color: loadColor
                      }}>
                        {truck.load}%
                      </span>
                    </div>
                  </td>

                  {/* Fuel */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Fuel size={13} color={truck.fuel < 40 ? '#D97706' : '#94A3B8'} />
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: truck.fuel < 40 ? '#D97706' : '#475569'
                      }}>
                        {truck.fuel}%
                      </span>
                    </div>
                  </td>

                  {/* ETA */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} color="#94A3B8" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                        {truck.eta}
                      </span>
                    </div>
                  </td>

                  {/* Driver */}
                  <td style={{ padding: '14px 20px', fontSize: '0.88rem', fontWeight: 500, color: '#334155' }}>
                    {truck.driver}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CSS Animations (inline style tag) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes softPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .gs-card tr:hover {
          background: rgba(6, 182, 212, 0.03) !important;
        }
      `}</style>
    </div>
  );
}

export default Fleet;
