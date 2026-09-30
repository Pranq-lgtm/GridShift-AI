import { Truck, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';

function Fleet() {
  const trucks = [
    { id: 'T-402', status: 'Active', zone: 'Downtown Hub', load: 85, driver: 'M. Rodriguez' },
    { id: 'T-119', status: 'Rerouted', zone: 'Ward 1', load: 42, driver: 'S. Chen' },
    { id: 'T-882', status: 'Maintenance', zone: 'Depot', load: 0, driver: 'N/A' },
    { id: 'T-304', status: 'Active', zone: 'Commercial Block A', load: 92, driver: 'J. Smith' },
  ];

  return (
    <div className="page-container" style={{ padding: '20px 40px', overflowY: 'auto', height: '100vh', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ marginBottom: '5px' }}>Fleet Management</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Real-time vehicle telemetry and AI-driven rerouting.</p>
        </div>
        <button className="btn btn-primary">Optimize Routes Now</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '15px', borderRadius: '12px' }}>
            <CheckCircle2 size={30} color="var(--color-accent-green)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.8rem', margin: 0 }}>24</h3>
            <p style={{ margin: 0 }}>Active Vehicles</p>
          </div>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '15px', borderRadius: '12px' }}>
            <Navigation size={30} color="#f59e0b" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.8rem', margin: 0 }}>3</h3>
            <p style={{ margin: 0 }}>AI Reroutes Today</p>
          </div>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '12px' }}>
            <AlertTriangle size={30} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.8rem', margin: 0 }}>1</h3>
            <p style={{ margin: 0 }}>Critical Load Warnings</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-glass-border)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Vehicle ID</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Current Zone</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Capacity Load</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Driver</th>
            </tr>
          </thead>
          <tbody>
            {trucks.map(truck => (
              <tr key={truck.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Truck size={16} /> {truck.id}
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={`badge ${truck.status === 'Active' ? 'normal' : truck.status === 'Maintenance' ? 'critical' : 'high'}`}>
                    {truck.status}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>{truck.zone}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${truck.load}%`, background: truck.load > 90 ? '#ef4444' : 'var(--color-accent-green)', height: '100%' }}></div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '35px' }}>{truck.load}%</span>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>{truck.driver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Fleet;
