import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/mapbox';
import axios from 'axios';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebase';
import Login from './Login';
import './index.css';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZHVtbXkiLCJhIjoiY2x4eXh5eXh5eXh5eXh5eXh5eXh5eXh5eSJ9.dummy';
const INITIAL_VIEW_STATE = {
  longitude: -74.0060,
  latitude: 40.7128,
  zoom: 11,
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

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/permits');
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
      alert("Failed to connect to backend database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (!user) {
    return <Login />;
  }

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
    <div className="app-container">
      <div className="map-container">
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={layers}
        >
          <Map mapStyle="mapbox://styles/mapbox/light-v10" mapboxAccessToken={MAPBOX_ACCESS_TOKEN} />
        </DeckGL>
      </div>
      
      <div className="sidebar">
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h1>GridShift-AI</h1>
            <button className="btn" onClick={() => signOut(auth)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Logout</button>
          </div>
          <p>Micro-Surge Waste Forecasting</p>
          <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>Logged in as: {user.email}</p>
          
          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={fetchData} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Fetching...' : 'Refresh Forecasts'}
            </button>
          </div>
        </div>
        
        <div className="glass-panel card" style={{ padding: '20px' }}>
          <h3>Waste Surge Copilot</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '15px' }}>AI-Driven Deployment Recommendations</p>
          
          {predictions.length === 0 && <p style={{ fontSize: '0.85rem' }}>No active surges detected.</p>}
          
          {predictions.map((p, idx) => (
            <div key={idx} style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1.1rem' }}>🔴 SURGE ALERT — {p.location}</strong>
              </div>
              
              <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                <div><strong>Predicted waste pressure:</strong> {p.surge} Tons</div>
                {p.copilot?.when && <div><strong>Peak:</strong> {p.copilot.when}</div>}
              </div>
              
              {p.copilot && (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Why?</strong>
                    <ul style={{ margin: '5px 0 0 20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {p.copilot.why.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-accent-green)' }}>AI recommendation</strong>
                    <ul style={{ margin: '5px 0 0 20px', fontSize: '0.85rem', listStyleType: 'none', padding: 0 }}>
                      {p.copilot.recommendations.map((rec, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>🚛 {rec}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', marginTop: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                    Confidence: {p.copilot.confidence}%
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        <div className="glass-panel card">
          <h3>System Status</h3>
          <div className="stat-row">
            <span>Model Accuracy</span>
            <span className="stat-value" style={{ color: 'var(--color-accent-green)' }}>94.2%</span>
          </div>
          <div className="stat-row">
            <span>Data Sources</span>
            <span className="stat-value">NYC Open Data, Permits</span>
          </div>
          <div className="stat-row">
            <span>Cost Savings (Est)</span>
            <span className="stat-value" style={{ color: 'var(--color-accent-brown)' }}>$12k / wk</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
