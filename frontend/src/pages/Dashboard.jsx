import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/mapbox';
import axios from 'axios';
import { Layers, X, Sparkles, Activity, Maximize2 } from 'lucide-react';
import '../index.css';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZHVtbXkiLCJhIjoiY2x4eXh5eXh5eXh5eXh5eXh5eXh5eXh5eSJ9.dummy';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const INITIAL_VIEW_STATE = {
  longitude: 73.9575,
  latitude: 15.2736,
  zoom: 12,
  pitch: 45,
  bearing: 0
};

const colorRange = [
  [34, 197, 94],
  [134, 239, 172],
  [253, 224, 71],
  [245, 158, 11],
  [217, 119, 6],
  [139, 90, 43]
];

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [showGridModal, setShowGridModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/permits`);
      const realPermits = response.data;
      
      const mappedData = realPermits.map(permit => ({
        position: [permit.coordinates.lng, permit.coordinates.lat],
        weight: permit.forecast.predicted_surge_tonnage
      }));
      setData(mappedData);
      
      const alerts = realPermits
        .filter(p => p.forecast.alert_triggered || p.forecast.pressure_level === 'High' || p.forecast.pressure_level === 'Critical')
        .map(p => ({
          location: p.location,
          surge: p.forecast.predicted_surge_tonnage.toFixed(1),
          level: p.forecast.pressure_level,
          copilot: p.forecast.copilot
        }))
        .slice(0, 5);
      
      setPredictions(alerts);
    } catch (err) {
      console.error("Failed to fetch from API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const layers = [
    new HexagonLayer({
      id: 'heatmap',
      colorRange,
      coverage: 0.9,
      data,
      elevationRange: [0, 1000],
      elevationScale: data && data.length ? 50 : 0,
      extruded: true,
      getPosition: d => d.position,
      getElevationValue: points => points.reduce((sum, p) => sum + p.weight, 0),
      getColorValue: points => points.reduce((sum, p) => sum + p.weight, 0),
      pickable: true,
      radius: 400,
      upperPercentile: 100,
      material: {
        ambient: 0.64,
        diffuse: 0.6,
        shininess: 32,
        specularColor: [51, 51, 51]
      },
      transitions: {
        elevationScale: 1000
      }
    })
  ];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={layers}
        >
          <Map mapStyle="mapbox://styles/mapbox/light-v10" mapboxAccessToken={MAPBOX_ACCESS_TOKEN} />
        </DeckGL>
      </div>
      
      {/* Floating Info Panels */}
      <div style={{ position: 'absolute', right: '20px', top: '20px', width: '380px', display: 'flex', flexDirection: 'column', gap: '16px', pointerEvents: 'none', zIndex: 10 }}>
        
        {/* 3D Cyber Grid Digital Twin Model Card */}
        <div className="glass-panel card" style={{ pointerEvents: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-accent-green)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#092C5E' }}>3D Grid Digital Twin</h4>
            </div>
            <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', padding: '3px 8px', borderRadius: '9999px', fontWeight: 800 }}>
              LIVE SYNC
            </span>
          </div>

          <div 
            onClick={() => setShowGridModal(true)}
            style={{ 
              position: 'relative', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              height: '140px', 
              cursor: 'pointer',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <img 
              src="/grid-isometric.jpg" 
              alt="3D Digital Twin City Model" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(9, 44, 94, 0.88) 0%, rgba(9, 44, 94, 0.2) 60%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '10px 12px',
              color: 'white'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                Zone Core: 8 Autonomous Corridors
              </div>
              <div style={{ fontSize: '10px', color: '#93c5fd', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Maximize2 size={11} /> Click to expand cyber topology view
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Waste Surge Copilot</h3>
            <button className="btn btn-primary" onClick={fetchData} disabled={loading} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', marginTop: '5px', marginBottom: '15px' }}>AI-Driven Deployment Recommendations</p>
          
          {predictions.length === 0 && <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No active surges detected.</p>}
          
          <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '5px' }}>
            {predictions.map((p, idx) => (
              <div key={idx} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '6px' }}>🔴 SURGE ALERT — {p.location}</strong>
                <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                  <div><strong>Predicted Load:</strong> {p.surge} Tons</div>
                  {p.copilot?.when && <div><strong>Peak Time:</strong> {p.copilot.when}</div>}
                </div>
                
                {p.copilot && (
                  <>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--color-accent-green)' }}>AI Recommendation</strong>
                    <ul style={{ margin: '4px 0 0 0', fontSize: '0.8rem', listStyleType: 'none', padding: 0 }}>
                      {p.copilot.recommendations.map((rec, i) => (
                        <li key={i} style={{ marginBottom: '3px' }}>🚛 {rec}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel card" style={{ pointerEvents: 'auto' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '1rem' }}>Global Telemetry</h3>
          <div className="stat-row">
            <span>Model Accuracy</span>
            <span className="stat-value" style={{ color: 'var(--color-accent-green)' }}>94.2%</span>
          </div>
          <div className="stat-row">
            <span>Monitored Nodes</span>
            <span className="stat-value">140 Smart Units</span>
          </div>
          <div className="stat-row">
            <span>Latency</span>
            <span className="stat-value" style={{ color: '#2563eb' }}>12ms LoRaWAN</span>
          </div>
        </div>
      </div>

      {/* 3D Cyber Grid Digital Twin Modal */}
      {showGridModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(9, 44, 94, 0.75)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1040px',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,255,255,0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 28px',
              borderBottom: '1px solid #f1f5f9',
              background: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={22} color="#16a34a" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#092C5E' }}>
                    GridShift-AI 3D Digital Twin Architecture
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Autonomous Sidewalk Rover Lanes & Multi-Zone Bin Telemetry
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowGridModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#092C5E'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body with 3D Grid Image */}
            <div style={{ position: 'relative', width: '100%', height: '520px', background: '#0a0f1d' }}>
              <img
                src="/grid-isometric.jpg"
                alt="Full Resolution 3D Digital Twin City Model"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />

              {/* Overlay Telemetry Legend */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(9, 44, 94, 0.88)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '14px 18px',
                borderRadius: '16px',
                fontSize: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>
                <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '8px', color: '#4ade80' }}>
                  CENTRAL HUB & TOPOLOGY NODES
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#06b6d4' }} />
                  <span>Cyan Corridors: Autonomous Rover Pathways</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span>Red Hotspots: Critical Surging Smart Bins</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span>Central Core: Autonomous Compactor & Sorting Depot</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Model Version: GridShift-Twin v3.4 • Refreshed every 15s
              </span>
              <button
                onClick={() => setShowGridModal(false)}
                className="btn"
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  backgroundColor: '#092C5E',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
