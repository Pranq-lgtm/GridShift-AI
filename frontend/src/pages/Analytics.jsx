import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Brain, Lightbulb, BarChart3, Activity } from 'lucide-react';

const weeklyData = [
  { name: 'Mon', tonnage: 140, predicted: 150 },
  { name: 'Tue', tonnage: 130, predicted: 135 },
  { name: 'Wed', tonnage: 155, predicted: 160 },
  { name: 'Thu', tonnage: 170, predicted: 165 },
  { name: 'Fri', tonnage: 210, predicted: 220 },
  { name: 'Sat', tonnage: 280, predicted: 275 },
  { name: 'Sun', tonnage: 250, predicted: 260 },
];

const accuracyData = [
  { name: 'Mon', accuracy: 93.2, baseline: 85 },
  { name: 'Tue', accuracy: 96.1, baseline: 85 },
  { name: 'Wed', accuracy: 94.8, baseline: 85 },
  { name: 'Thu', accuracy: 97.3, baseline: 85 },
  { name: 'Fri', accuracy: 95.5, baseline: 85 },
  { name: 'Sat', accuracy: 98.2, baseline: 85 },
  { name: 'Sun', accuracy: 96.8, baseline: 85 },
];

const CustomTooltipBar = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
      }}>
        <p style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: '0.85rem', fontWeight: 600, margin: '2px 0' }}>
            {entry.name}: {entry.value} {entry.name === 'Actual Tonnage' || entry.name === 'AI Prediction' ? 'tons' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltipLine = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
      }}>
        <p style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: '0.85rem', fontWeight: 600, margin: '2px 0' }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function Analytics() {
  const [activeChart, setActiveChart] = useState('bar');

  return (
    <div className="page-container" style={{ padding: '28px 32px', minHeight: '100%', width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
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
              <BarChart3 size={18} color="white" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Surge Analytics</h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.92rem', fontWeight: 500 }}>City-wide historical waste generation vs XGBoost predictions.</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* ── Bar Chart: Weekly Surge Trend ── */}
        <div className="gs-card" style={{ height: '420px', display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="#06B6D4" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Weekly Surge Trend (Tons)</h3>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#059669',
              background: 'rgba(5, 150, 105, 0.08)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(5, 150, 105, 0.15)'
            }}>LIVE DATA</span>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="20%">
                <defs>
                  <linearGradient id="barActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F172A" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#334155" stopOpacity={0.80} />
                  </linearGradient>
                  <linearGradient id="barPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.90} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.70} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }} 
                  axisLine={{ stroke: 'rgba(15, 23, 42, 0.08)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(6, 182, 212, 0.06)' }} />
                <Legend 
                  wrapperStyle={{ fontSize: '0.78rem', fontWeight: 600, paddingTop: '12px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="tonnage" fill="url(#barActual)" name="Actual Tonnage" radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
                <Bar dataKey="predicted" fill="url(#barPredicted)" name="AI Prediction" radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out" animationBegin={300} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Area Chart: Model Accuracy Over Time ── */}
        <div className="gs-card" style={{ height: '420px', display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#06B6D4" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Model Accuracy Over Time</h3>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#06B6D4',
              background: 'rgba(6, 182, 212, 0.08)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(6, 182, 212, 0.15)'
            }}>XGBoost v4.2</span>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accuracyData}>
                <defs>
                  <linearGradient id="areaAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="areaBaseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }} 
                  axisLine={{ stroke: 'rgba(15, 23, 42, 0.08)' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[80, 100]} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }}
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltipLine />} />
                <Area 
                  type="monotone" 
                  dataKey="baseline" 
                  stroke="#F59E0B" 
                  strokeWidth={2} 
                  strokeDasharray="6 4"
                  fill="url(#areaBaseline)" 
                  name="Baseline Target" 
                  animationDuration={1500} 
                  dot={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#06B6D4" 
                  strokeWidth={3} 
                  fill="url(#areaAccuracy)" 
                  name="Model Accuracy" 
                  animationDuration={1500} 
                  animationEasing="ease-out"
                  dot={{ r: 4, fill: '#06B6D4', stroke: 'white', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#06B6D4', stroke: 'white', strokeWidth: 2, boxShadow: '0 0 8px rgba(6, 182, 212, 0.5)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Insights Panel */}
      <div className="gs-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'rgba(6, 182, 212, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '1px solid rgba(6, 182, 212, 0.12)'
        }}>
          <Lightbulb size={20} color="#06B6D4" />
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>AI-Generated Insights</h3>
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.65, color: '#475569' }}>
            Based on Gemini 3.8 Flash analysis, weekend public gatherings account for a <strong style={{ color: '#0F172A' }}>45% variance</strong> in waste accumulation in Downtown Hub. 
            Recommended action: <span style={{ color: '#06B6D4', fontWeight: 600 }}>Permanently re-route 2 compactors from Uptown Sector to Downtown Hub on weekends.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
