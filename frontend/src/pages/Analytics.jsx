import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const data = [
  { name: 'Mon', tonnage: 140, predicted: 150 },
  { name: 'Tue', tonnage: 130, predicted: 135 },
  { name: 'Wed', tonnage: 155, predicted: 160 },
  { name: 'Thu', tonnage: 170, predicted: 165 },
  { name: 'Fri', tonnage: 210, predicted: 220 },
  { name: 'Sat', tonnage: 280, predicted: 275 },
  { name: 'Sun', tonnage: 250, predicted: 260 },
];

function Analytics() {
  return (
    <div className="page-container" style={{ padding: '24px 32px', minHeight: '100%', width: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ marginBottom: '5px' }}>Data Analytics</h1>
      <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>City-wide historical waste generation vs XGBoost predictions.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '20px' }}>Weekly Surge Trend (Tons)</h3>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tonnage" fill="var(--color-accent-brown)" name="Actual Tonnage" radius={[4, 4, 0, 0]} />
                <Bar dataKey="predicted" fill="var(--color-accent-green)" name="AI Prediction" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '20px' }}>Model Accuracy Over Time</h3>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 300]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="predicted" stroke="var(--color-accent-green)" strokeWidth={3} name="Forecast Trajectory" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="glass-panel">
        <h3>Insights Generation</h3>
        <p style={{ marginTop: '10px' }}>Based on Gemini 2.5 Flash analysis, weekend public gatherings account for a 45% variance in waste accumulation in Downtown Hub. Recommended action: Permanently re-route 2 compactors from Uptown Sector to Downtown Hub on weekends.</p>
      </div>
    </div>
  );
}

export default Analytics;
