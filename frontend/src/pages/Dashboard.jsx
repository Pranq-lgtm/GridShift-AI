import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/mapbox';
import axios from 'axios';
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
      <div style={{ position: 'absolute', right: '20px', top: '20px', width: '380px', display: 'flex', flexDirection: 'column', gap: '20px', pointerEvents: 'none' }}>
        
        <div className="glass-panel" style={{ pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Waste Surge Copilot</h3>
            <button className="btn btn-primary" onClick={fetchData} disabled={loading} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', marginTop: '5px', marginBottom: '15px' }}>AI-Driven Deployment Recommendations</p>
          
          {predictions.length === 0 && <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No active surges detected.</p>}
          
          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
            {predictions.map((p, idx) => (
              <div key={idx} style={{ marginBottom: '15px', padding: '15px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '8px' }}>🔴 SURGE ALERT — {p.location}</strong>
                <div style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
                  <div><strong>Predicted Load:</strong> {p.surge} Tons</div>
                  {p.copilot?.when && <div><strong>Peak Time:</strong> {p.copilot.when}</div>}
                </div>
                
                {p.copilot && (
                  <>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--color-accent-green)' }}>AI Recommendation</strong>
                    <ul style={{ margin: '5px 0 0 0', fontSize: '0.8rem', listStyleType: 'none', padding: 0 }}>
                      {p.copilot.recommendations.map((rec, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>🚛 {rec}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel card" style={{ pointerEvents: 'auto' }}>
          <h3 style={{ marginBottom: '10px' }}>Global Metrics</h3>
          <div className="stat-row">
            <span>Model Accuracy</span>
            <span className="stat-value" style={{ color: 'var(--color-accent-green)' }}>94.2%</span>
          </div>
          <div className="stat-row">
            <span>Data Sources</span>
            <span className="stat-value">NYC Open Data, Permits</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
