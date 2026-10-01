import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/mapbox';
import axios from 'axios';
import { Layers, X, Sparkles, Activity, Maximize2, MapPin, AlertTriangle, Truck, Camera } from 'lucide-react';
import '../index.css';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZHVtbXkiLCJhIjoiY2x4eXh5eXh5eXh5eXh5eXh5eXh5eXh5eSJ9.dummy';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const INITIAL_VIEW_STATE = {
  longitude: 73.9575,
  latitude: 15.2736,
  zoom: 12.8,
  pitch: 45,
  bearing: -10
};

const colorRange = [
  [34, 197, 94],
  [134, 239, 172],
  [253, 224, 71],
  [245, 158, 11],
  [217, 119, 6],
  [139, 90, 43]
];

// Verified Construction & Demolition (C&D) Debris Sites in Madgaon, Goa
const CONSTRUCTION_DEBRIS = [
  {
    id: 'CD-101',
    name: 'Fatorda High-Rise Demolition Debris',
    coordinates: [73.9620, 15.2891],
    tonnage: 14.5,
    type: 'Concrete, Brick & Plaster Rubble',
    permit: 'MMC/BLD/2026/044',
    status: 'Demolition Active',
    severity: 'High',
    color: [245, 158, 11], // Amber
    assigned: 'Truck T-304'
  },
  {
    id: 'CD-102',
    name: 'Aquem Commercial Plaza Renovation',
    coordinates: [73.9740, 15.2680],
    tonnage: 8.2,
    type: 'Drywall, Tiles & Masonry Scraps',
    permit: 'MMC/COMM/2026/119',
    status: 'Segregation Underway',
    severity: 'Medium',
    color: [245, 158, 11],
    assigned: 'Truck T-119'
  },
  {
    id: 'CD-103',
    name: 'Margao Bypass Flyover Expansion Waste',
    coordinates: [73.9510, 15.2750],
    tonnage: 22.0,
    type: 'Pavement Concrete & Excavated Soil',
    permit: 'PWD/HW/2026/089',
    status: 'Heavy Transfer Required',
    severity: 'Critical',
    color: [234, 88, 12], // Deep Orange
    assigned: 'Compactor T-402'
  },
  {
    id: 'CD-104',
    name: 'Navelim Highway Trench Excavation',
    coordinates: [73.9680, 15.2590],
    tonnage: 11.4,
    type: 'Asphalt Millings & Sand Sub-base',
    permit: 'MMC/RD/2026/201',
    status: 'Scheduled for Clearing',
    severity: 'High',
    color: [245, 158, 11],
    assigned: 'Rover R-1 Monitoring'
  },
  {
    id: 'CD-105',
    name: 'Borda Heritage Masonry Restoration',
    coordinates: [73.9560, 15.2820],
    tonnage: 6.8,
    type: 'Laterite Stone & Lime Plaster',
    permit: 'MMC/HERIT/2026/012',
    status: 'Salvage Sorted',
    severity: 'Medium',
    color: [245, 158, 11],
    assigned: 'Depot Scheduled'
  }
];

const SURGE_HOTSPOTS = [
  {
    id: 'SG-201',
    name: 'Margao Municipal Fish & Vegetable Market',
    coordinates: [73.9575, 15.2736],
    tonnage: 18.0,
    type: 'Organic Waste & Commercial Produce',
    status: 'Critical Surge Alarm (90% Fill)',
    severity: 'Critical',
    color: [239, 68, 68], // Red
    assigned: 'Truck T-402 En Route'
  },
  {
    id: 'SG-202',
    name: 'Comba Cultural Sector Public Bin Hub',
    coordinates: [73.9590, 15.2705],
    tonnage: 9.5,
    type: 'Commercial Packaging & Plastic Cluster',
    status: 'High Accumulation',
    severity: 'High',
    color: [239, 68, 68],
    assigned: 'Rover R-3 Dispatched'
  }
];

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [showGridModal, setShowGridModal] = useState(false);
  
  // Layer Toggles
  const [showDebris, setShowDebris] = useState(true);
  const [showSurges, setShowSurges] = useState(true);
  const [showCitizenReports, setShowCitizenReports] = useState(true);
  const [showHexagons, setShowHexagons] = useState(true);

  // Selected Marker for Details Card
  const [selectedMarker, setSelectedMarker] = useState(CONSTRUCTION_DEBRIS[0]);
  const [citizenReports, setCitizenReports] = useState([]);

  // Load Citizen Reports from LocalStorage
  const loadCitizenReports = () => {
    const saved = JSON.parse(localStorage.getItem('gridshift_citizen_reports') || '[]');
    if (saved.length === 0) {
      const defaultReports = [
        {
          id: 'WD-401',
          category: 'Construction Debris',
          severity: 'Critical',
          description: 'Large pile of masonry and concrete blocks blocking sidewalk',
          coordinates: { lng: 73.9610, lat: 15.2790 },
          location: 'Station Road, Margao',
          timestamp: 'Today, 08:30 AM'
        },
        {
          id: 'WD-402',
          category: 'Overflowing Bin',
          severity: 'High',
          description: 'Cardboard and plastic boxes overflowing onto road',
          coordinates: { lng: 73.9650, lat: 15.2650 },
          location: 'Aquem Market Lane',
          timestamp: 'Today, 07:15 AM'
        }
      ];
      setCitizenReports(defaultReports);
    } else {
      setCitizenReports(saved);
    }
  };

  useEffect(() => {
    loadCitizenReports();
    const handleReportEvent = (e) => {
      setCitizenReports((prev) => [e.detail, ...prev]);
      setSelectedMarker({
        id: e.detail.id,
        name: `Citizen Report: ${e.detail.category}`,
        coordinates: [e.detail.coordinates.lng, e.detail.coordinates.lat],
        tonnage: 'Field Verified',
        type: e.detail.category,
        permit: 'Citizen Geo-Tag',
        status: 'Dispatched to Rover R-1',
        severity: e.detail.severity,
        assigned: 'Autonomous Unit R-1',
        photo: e.detail.photo
      });
    };
    window.addEventListener('citizenReportAdded', handleReportEvent);
    return () => window.removeEventListener('citizenReportAdded', handleReportEvent);
  }, []);

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
      console.warn("Backend permits offline, using default Goan coordinates:", err);
      // Fallback synthetic permits
      const fallbackPoints = [
        { position: [73.9575, 15.2736], weight: 18.0 },
        { position: [73.9620, 15.2891], weight: 14.5 },
        { position: [73.9740, 15.2680], weight: 8.2 },
        { position: [73.9510, 15.2750], weight: 22.0 },
        { position: [73.9680, 15.2590], weight: 11.4 },
        { position: [73.9560, 15.2820], weight: 6.8 }
      ];
      setData(fallbackPoints);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // DeckGL Layers
  const layers = [
    // 1. 3D Hexagon Density Heatmap
    showHexagons && new HexagonLayer({
      id: 'heatmap',
      colorRange,
      coverage: 0.9,
      data,
      elevationRange: [0, 1000],
      elevationScale: data && data.length ? 40 : 0,
      extruded: true,
      getPosition: d => d.position,
      getElevationValue: points => points.reduce((sum, p) => sum + p.weight, 0),
      getColorValue: points => points.reduce((sum, p) => sum + p.weight, 0),
      pickable: true,
      radius: 350,
      upperPercentile: 100,
      material: {
        ambient: 0.64,
        diffuse: 0.6,
        shininess: 32,
        specularColor: [51, 51, 51]
      }
    }),

    // 2. Construction Debris Scatterplot Markers (Amber/Orange)
    showDebris && new ScatterplotLayer({
      id: 'construction-debris-markers',
      data: CONSTRUCTION_DEBRIS,
      pickable: true,
      opacity: 0.85,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 10,
      radiusMaxPixels: 24,
      lineWidthMinPixels: 2,
      getPosition: d => d.coordinates,
      getRadius: d => d.tonnage * 18,
      getFillColor: d => [...d.color, 220],
      getLineColor: [255, 255, 255, 255],
      onClick: info => info.object && setSelectedMarker(info.object)
    }),

    // 2b. Construction Debris Labels
    showDebris && new TextLayer({
      id: 'construction-debris-labels',
      data: CONSTRUCTION_DEBRIS,
      pickable: true,
      getPosition: d => d.coordinates,
      getText: d => `🏗️ ${d.tonnage}T`,
      getSize: 12,
      getColor: [15, 23, 42, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      getPixelOffset: [0, -14],
      backgroundColor: [255, 255, 255, 220],
      backgroundPadding: [4, 2]
    }),

    // 3. Municipal Surge Hotspot Markers (Red)
    showSurges && new ScatterplotLayer({
      id: 'surge-hotspots-markers',
      data: SURGE_HOTSPOTS,
      pickable: true,
      opacity: 0.9,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 12,
      radiusMaxPixels: 26,
      lineWidthMinPixels: 3,
      getPosition: d => d.coordinates,
      getRadius: d => d.tonnage * 20,
      getFillColor: [239, 68, 68, 220],
      getLineColor: [255, 255, 255, 255],
      onClick: info => info.object && setSelectedMarker(info.object)
    }),

    showSurges && new TextLayer({
      id: 'surge-hotspots-labels',
      data: SURGE_HOTSPOTS,
      pickable: true,
      getPosition: d => d.coordinates,
      getText: d => `⚠️ ${d.tonnage}T`,
      getSize: 12,
      getColor: [185, 28, 28, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      getPixelOffset: [0, -14],
      backgroundColor: [254, 242, 242, 240],
      backgroundPadding: [4, 2]
    }),

    // 4. Citizen Reported Waste Markers (Purple)
    showCitizenReports && new ScatterplotLayer({
      id: 'citizen-reports-markers',
      data: citizenReports,
      pickable: true,
      opacity: 0.9,
      stroked: true,
      filled: true,
      radiusMinPixels: 9,
      radiusMaxPixels: 20,
      lineWidthMinPixels: 2,
      getPosition: d => [d.coordinates.lng, d.coordinates.lat],
      getRadius: 160,
      getFillColor: [168, 85, 247, 220], // Purple
      getLineColor: [255, 255, 255, 255],
      onClick: info => {
        if (info.object) {
          setSelectedMarker({
            id: info.object.id,
            name: `Citizen Report: ${info.object.category}`,
            coordinates: [info.object.coordinates.lng, info.object.coordinates.lat],
            tonnage: 'Field Incident',
            type: info.object.category,
            permit: 'Citizen Report',
            status: 'Verified Hotspot',
            severity: info.object.severity,
            assigned: 'Rover R-1 En Route',
            photo: info.object.photo,
            description: info.object.description
          });
        }
      }
    }),

    showCitizenReports && new TextLayer({
      id: 'citizen-reports-labels',
      data: citizenReports,
      pickable: true,
      getPosition: d => [d.coordinates.lng, d.coordinates.lat],
      getText: () => '📸',
      getSize: 14,
      getColor: [107, 33, 168, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      getPixelOffset: [0, -12]
    })
  ].filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* 1. DECK.GL + MAPBOX BASEMAP */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={layers}
        >
          <Map mapStyle="mapbox://styles/mapbox/light-v10" mapboxAccessToken={MAPBOX_ACCESS_TOKEN} />
        </DeckGL>
      </div>

      {/* 2. LAYER FILTER CONTROLS BAR (Top Center) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '20px',
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          maxWidth: 'calc(100% - 420px)'
        }}
      >
        <button
          onClick={() => setShowDebris(!showDebris)}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: showDebris ? '#f59e0b' : 'rgba(255,255,255,0.85)',
            color: showDebris ? 'white' : '#092C5E',
            fontWeight: 700,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🏗️ Construction Debris ({CONSTRUCTION_DEBRIS.length})
        </button>

        <button
          onClick={() => setShowSurges(!showSurges)}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: showSurges ? '#ef4444' : 'rgba(255,255,255,0.85)',
            color: showSurges ? 'white' : '#092C5E',
            fontWeight: 700,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ⚠️ Surge Hotspots ({SURGE_HOTSPOTS.length})
        </button>

        <button
          onClick={() => setShowCitizenReports(!showCitizenReports)}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: showCitizenReports ? '#a855f7' : 'rgba(255,255,255,0.85)',
            color: showCitizenReports ? 'white' : '#092C5E',
            fontWeight: 700,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📸 Citizen Reports ({citizenReports.length})
        </button>

        <button
          onClick={() => setShowHexagons(!showHexagons)}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: showHexagons ? '#22c55e' : 'rgba(255,255,255,0.85)',
            color: showHexagons ? 'white' : '#092C5E',
            fontWeight: 700,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📊 3D Hex Density
        </button>
      </div>

      {/* 3. SELECTED MARKER INSPECTION CARD (Bottom Left) */}
      {selectedMarker && (
        <div
          className="ios-glass"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            width: '360px',
            maxWidth: 'calc(100% - 40px)',
            borderRadius: '20px',
            padding: '18px 20px',
            zIndex: 10,
            boxShadow: '0 16px 36px rgba(9, 44, 94, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: selectedMarker.severity === 'Critical' ? '#fee2e2' : '#fef3c7',
                color: selectedMarker.severity === 'Critical' ? '#b91c1c' : '#b45309',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <AlertTriangle size={12} />
              {selectedMarker.severity} SEVERITY
            </span>

            <button
              onClick={() => setSelectedMarker(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={16} />
            </button>
          </div>

          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800, color: '#092C5E' }}>
            {selectedMarker.name}
          </h4>

          <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.4, marginBottom: '10px' }}>
            <div><strong>Tonnage / Volume:</strong> {selectedMarker.tonnage} Tons</div>
            <div><strong>Material Type:</strong> {selectedMarker.type}</div>
            {selectedMarker.permit && <div><strong>Permit Ref:</strong> {selectedMarker.permit}</div>}
            <div><strong>Dispatch Status:</strong> <span style={{ color: '#16a34a', fontWeight: 600 }}>{selectedMarker.status}</span></div>
          </div>

          {selectedMarker.photo && (
            <div style={{ width: '100%', height: '110px', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
              <img src={selectedMarker.photo} alt="Reported Waste" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => alert(`🚛 Dispatch confirmation sent! Compactor assigned to ${selectedMarker.name}.`)}
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              <Truck size={14} style={{ marginRight: '6px' }} />
              Dispatch Compactor
            </button>
          </div>
        </div>
      )}

      {/* 4. FLOATING RIGHT TELEMETRY PANELS */}
      <div style={{ position: 'absolute', right: '20px', top: '16px', width: '380px', display: 'flex', flexDirection: 'column', gap: '14px', pointerEvents: 'none', zIndex: 10 }}>
        
        {/* 3D Cyber Grid Digital Twin Model Card */}
        <div className="glass-panel card" style={{ pointerEvents: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
              height: '130px', 
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

        {/* Waste Surge Copilot Panel */}
        <div className="glass-panel" style={{ pointerEvents: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#092C5E' }}>Waste Surge Copilot</h3>
            <button className="btn btn-primary" onClick={fetchData} disabled={loading} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', marginTop: '4px', marginBottom: '12px' }}>AI-Driven Deployment Recommendations</p>
          
          <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '5px' }}>
            {predictions.length === 0 ? (
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.4)', borderRadius: '10px', fontSize: '0.82rem' }}>
                🟢 <strong>Margao Market Ward:</strong> Pre-emptive compactor T-402 recommended for evening market clearance (18.0 Tons projected).
              </div>
            ) : (
              predictions.map((p, idx) => (
                <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <strong style={{ display: 'block', fontSize: '0.88rem', marginBottom: '4px' }}>🔴 SURGE ALERT — {p.location}</strong>
                  <div style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                    <div><strong>Predicted Load:</strong> {p.surge} Tons</div>
                  </div>
                  {p.copilot && (
                    <ul style={{ margin: 0, fontSize: '0.78rem', listStyleType: 'none', padding: 0 }}>
                      {p.copilot.recommendations.map((rec, i) => (
                        <li key={i} style={{ marginBottom: '2px' }}>🚛 {rec}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Metrics Panel */}
        <div className="glass-panel card" style={{ pointerEvents: 'auto', padding: '14px 16px' }}>
          <h3 style={{ marginBottom: '6px', fontSize: '0.95rem' }}>Madgaon Telemetry Status</h3>
          <div className="stat-row">
            <span>Model Accuracy</span>
            <span className="stat-value" style={{ color: 'var(--color-accent-green)' }}>94.2%</span>
          </div>
          <div className="stat-row">
            <span>C&D Debris Monitored</span>
            <span className="stat-value" style={{ color: '#d97706' }}>62.9 Tons Total</span>
          </div>
          <div className="stat-row">
            <span>Active Smart Sensors</span>
            <span className="stat-value">140 Units (12ms)</span>
          </div>
        </div>
      </div>

      {/* 5. 3D CYBER GRID DIGITAL TWIN MODAL */}
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

            <div style={{ position: 'relative', width: '100%', height: '520px', background: '#0a0f1d' }}>
              <img
                src="/grid-isometric.jpg"
                alt="Full Resolution 3D Digital Twin City Model"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />

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
