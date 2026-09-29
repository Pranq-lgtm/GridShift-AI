import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl';
import axios from 'axios';
import './index.css';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZHVtbXkiLCJhIjoiY2x4eXh5eXh5eXh5eXh5eXh5eXh5eXh5eSJ9.dummy';
const INITIAL_VIEW_STATE = {
  longitude: -74.0060,
  latitude: 40.7128,
  zoom: 11,
  pitch: 45,
  bearing: 0
};

// Color range for the heatmap (green to brown/red)
const colorRange = [
  [34, 197, 94],   // Green
  [134, 239, 172], // Light green
  [253, 224, 71],  // Yellow
  [245, 158, 11],  // Orange
  [217, 119, 6],   // Dark orange
  [139, 90, 43]    // Brown (Critical)
];

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);

  // Generate synthetic data
  const generateData = async () => {
    setLoading(true);
    try {
      // In a real app, this would call our Node.js backend
      // For demo purposes, we'll generate synthetic points around NYC
      const newData = Array.from({ length: 200 }).map(() => ({
        position: [
          -74.0060 + (Math.random() - 0.5) * 0.1,
          40.7128 + (Math.random() - 0.5) * 0.1
        ],
        weight: Math.random() * 10
      }));
      
      setData(newData);
      
      // Simulate ML prediction
      setPredictions([
        { location: 'Ward 1', surge: 24.5, level: 'Critical' },
        { location: 'Ward 4', surge: 18.2, level: 'High' },
        { location: 'Ward 2', surge: 12.1, level: 'Normal' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateData();
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
          <h1>GridShift-AI</h1>
          <p>Micro-Surge Waste Forecasting</p>
          
          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={generateData} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Analyzing...' : 'Simulate 48-Hour Forecast'}
            </button>
          </div>
        </div>
        
        <div className="glass-panel card">
          <h3>Active Alerts</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '15px' }}>Fleet deployment required within 48h</p>
          
          {predictions.map((p, idx) => (
            <div key={idx} style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{p.location}</strong>
                <span className={`badge ${p.level.toLowerCase()}`}>{p.level}</span>
              </div>
              <div className="stat-row">
                <span>Predicted Surge</span>
                <span className="stat-value">+{p.surge} Tons</span>
              </div>
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
