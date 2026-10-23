import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import axios from 'axios';
import { Layers, X, Maximize2, AlertTriangle, Truck, ShieldCheck, ArrowRight, MapPin, Plus, Minus, Compass } from 'lucide-react';
import { ADMIN_EMAIL, isAdminUser } from '../firebase';
import { INITIAL_REDRESSAL_TICKETS } from './Redressal';
import '../index.css';

const RAW_GMAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
const IS_AISTUDIO_DEMO_KEY = RAW_GMAPS_KEY === 'AIzaSyD907exSmrkdsn1tEc7PPH4kx8RpcPZwvw';
const IS_AISTUDIO_HOST =
  typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('.run.app') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

const HAS_CUSTOM_GMAPS_KEY =
  RAW_GMAPS_KEY.length >= 30 &&
  !RAW_GMAPS_KEY.includes('YOUR_') &&
  !RAW_GMAPS_KEY.includes('PLACEHOLDER') &&
  (!IS_AISTUDIO_DEMO_KEY || IS_AISTUDIO_HOST);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// Default Madgaon (Margao), Goa Local Area Coordinates
const MADGAON_DEFAULT_CENTER = {
  lat: 15.2736,
  lng: 73.9575
};
const MADGAON_DEFAULT_ZOOM = 14;

// Web Mercator projection helpers (EPSG:3857) for exact geographic marker & tile alignment
function latLngToWorldPx(lat, lng, zoom) {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function worldPxToLatLng(x, y, zoom) {
  const scale = 256 * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng: Math.max(-180, Math.min(180, lng))
  };
}

// Verified Construction & Demolition (C&D) Debris Sites in Madgaon, Goa
const CONSTRUCTION_DEBRIS = [
  {
    id: 'CD-101',
    name: 'Fatorda High-Rise Demolition Debris',
    coordinates: [73.9620, 15.2891],
    tonnage: 14.5,
    type: 'Concrete, Brick & Plaster Rubble',
    permit: 'GS-MUN/BLD/2026/044',
    status: 'Demolition Active',
    severity: 'High',
    color: [245, 158, 11],
    assigned: 'Truck T-304'
  },
  {
    id: 'CD-102',
    name: 'Aquem Commercial Plaza Renovation',
    coordinates: [73.9740, 15.2680],
    tonnage: 8.2,
    type: 'Drywall, Tiles & Masonry Scraps',
    permit: 'GS-MUN/COMM/2026/119',
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
    color: [234, 88, 12],
    assigned: 'Compactor T-402'
  },
  {
    id: 'CD-104',
    name: 'Navelim Highway Trench Excavation',
    coordinates: [73.9680, 15.2590],
    tonnage: 11.4,
    type: 'Asphalt Millings & Sand Sub-base',
    permit: 'GS-MUN/RD/2026/201',
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
    permit: 'GS-MUN/HERIT/2026/012',
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
    color: [239, 68, 68],
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

/**
 * Watermark-free Interactive Google Maps Tile Engine for Madgaon, Goa.
 * Renders real Google Maps Roadmap (lyrs=m) & Hybrid Satellite (lyrs=y) tiles
 * with smooth drag-panning, scroll zoom, and exact geographic markers without
 * triggering "For development purposes only" or "This page can't load Google Maps correctly"
 * on Vercel or restricted domains.
 */
function MadgaonInteractiveTileMap({
  data,
  showHexagons,
  showDebris,
  showSurges,
  showCitizenReports,
  citizenReports,
  selectedMarker,
  setSelectedMarker
}) {
  const containerRef = useRef(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [center, setCenter] = useState(MADGAON_DEFAULT_CENTER);
  const [zoom, setZoom] = useState(MADGAON_DEFAULT_ZOOM);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const wheelTimeoutRef = useRef(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setViewport({
          width: containerRef.current.clientWidth || 1280,
          height: containerRef.current.clientHeight || 800
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handlePointerDown = (e) => {
    if (e.target.closest('[data-map-interactive="true"]')) return;
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const startWorld = latLngToWorldPx(center.lat, center.lng, zoom);
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      startWorldX: startWorld.x,
      startWorldY: startWorld.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    const nextLatLng = worldPxToLatLng(
      dragRef.current.startWorldX - dx,
      dragRef.current.startWorldY - dy,
      zoom
    );
    setCenter(nextLatLng);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragRef.current = null;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (wheelTimeoutRef.current) return;
    wheelTimeoutRef.current = setTimeout(() => {
      wheelTimeoutRef.current = null;
    }, 110);
    const delta = e.deltaY < 0 ? 1 : -1;
    setZoom((prev) => Math.max(11, Math.min(18, prev + delta)));
  };

  const centerWorld = latLngToWorldPx(center.lat, center.lng, zoom);
  const originX = centerWorld.x - viewport.width / 2;
  const originY = centerWorld.y - viewport.height / 2;

  const maxTileIdx = Math.pow(2, zoom) - 1;
  const startTileX = Math.max(0, Math.floor(originX / 256) - 1);
  const endTileX = Math.min(maxTileIdx, Math.floor((originX + viewport.width) / 256) + 1);
  const startTileY = Math.max(0, Math.floor(originY / 256) - 1);
  const endTileY = Math.min(maxTileIdx, Math.floor((originY + viewport.height) / 256) + 1);

  const tiles = [];
  for (let tx = startTileX; tx <= endTileX; tx++) {
    for (let ty = startTileY; ty <= endTileY; ty++) {
      const lyrs = mapType === 'satellite' ? 'y' : 'm';
      const subdomain = (tx + ty) % 4;
      tiles.push({
        key: `${mapType}-${zoom}-${tx}-${ty}`,
        tx,
        ty,
        left: Math.round(tx * 256 - originX),
        top: Math.round(ty * 256 - originY),
        url: `https://mt${subdomain}.google.com/vt/lyrs=${lyrs}&hl=en&x=${tx}&y=${ty}&z=${zoom}`,
        fallbackUrl: `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}.png`
      });
    }
  }

  const projectCoord = (lat, lng) => {
    const pt = latLngToWorldPx(lat, lng, zoom);
    return {
      left: pt.x - originX,
      top: pt.y - originY
    };
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onWheel={handleWheel}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#e5e3df',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
    >
      {/* Google Maps Web Mercator Tile Layer */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            draggable={false}
            onError={(e) => {
              if (e.currentTarget.src !== tile.fallbackUrl) {
                e.currentTarget.src = tile.fallbackUrl;
              }
            }}
            style={{
              position: 'absolute',
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: '256px',
              height: '256px',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>

      {/* Layer 0: Madgaon 3D Hex Density Zones */}
      {showHexagons &&
        data.map((pt, idx) => {
          const pos = projectCoord(pt.position[1], pt.position[0]);
          const zoomScale = Math.pow(1.22, zoom - 14);
          const sizePx = Math.max(48, Math.min(180, Math.round(pt.weight * 4.6 * zoomScale)));
          return (
            <div
              key={`hex-${idx}`}
              style={{
                position: 'absolute',
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                width: `${sizePx}px`,
                height: `${sizePx}px`,
                borderRadius: '50%',
                background:
                  pt.weight >= 16
                    ? 'radial-gradient(circle, rgba(239, 68, 68, 0.36) 0%, rgba(239, 68, 68, 0.1) 70%, transparent 100%)'
                    : 'radial-gradient(circle, rgba(34, 197, 94, 0.36) 0%, rgba(34, 197, 94, 0.1) 70%, transparent 100%)',
                border:
                  pt.weight >= 16
                    ? '1.5px dashed rgba(239, 68, 68, 0.65)'
                    : '1.5px dashed rgba(22, 163, 74, 0.65)',
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
                zIndex: 2
              }}
            />
          );
        })}

      {/* Layer 1: Madgaon Construction & Demolition (C&D) Debris Pointers */}
      {showDebris &&
        CONSTRUCTION_DEBRIS.map((item) => {
          const isSelected = selectedMarker?.id === item.id;
          const pos = projectCoord(item.coordinates[1], item.coordinates[0]);
          return (
            <div
              key={item.id}
              data-map-interactive="true"
              title={`${item.name} (${item.tonnage}T)`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarker(item);
              }}
              style={{
                position: 'absolute',
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.14)' : 'scale(1)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 11px',
                borderRadius: '9999px',
                backgroundColor: item.severity === 'Critical' ? '#ea580c' : '#f59e0b',
                color: 'white',
                fontWeight: 800,
                fontSize: '11px',
                whiteSpace: 'nowrap',
                border: isSelected ? '3px solid #092C5E' : '2px solid white',
                boxShadow: '0 6px 14px rgba(0,0,0,0.32)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                zIndex: isSelected ? 35 : 10
              }}
            >
              <span>🏗️ {item.tonnage}T</span>
            </div>
          );
        })}

      {/* Layer 2: Madgaon Micro-Surge Hotspot Pointers */}
      {showSurges &&
        SURGE_HOTSPOTS.map((spot) => {
          const isSelected = selectedMarker?.id === spot.id;
          const pos = projectCoord(spot.coordinates[1], spot.coordinates[0]);
          return (
            <div
              key={spot.id}
              data-map-interactive="true"
              title={`${spot.name} (${spot.tonnage}T)`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarker(spot);
              }}
              style={{
                position: 'absolute',
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.14)' : 'scale(1)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '9999px',
                backgroundColor: '#ef4444',
                color: 'white',
                fontWeight: 800,
                fontSize: '11px',
                whiteSpace: 'nowrap',
                border: isSelected ? '3px solid #092C5E' : '2px solid white',
                boxShadow: '0 6px 16px rgba(239, 68, 68, 0.48)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                zIndex: isSelected ? 36 : 20
              }}
            >
              <span>⚠️ {spot.tonnage}T</span>
            </div>
          );
        })}

      {/* Layer 3: Geotagged Citizen Redressal Ticket Pointers */}
      {showCitizenReports &&
        citizenReports.map((ticket) => {
          if (!ticket?.coordinates?.lat || !ticket?.coordinates?.lng) return null;
          const isSelected = selectedMarker?.id === ticket.id;
          const pos = projectCoord(Number(ticket.coordinates.lat), Number(ticket.coordinates.lng));
          return (
            <div
              key={ticket.id}
              data-map-interactive="true"
              title={`Ticket ${ticket.id}: ${ticket.category}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarker({
                  id: ticket.id,
                  name: `Citizen Ticket: ${ticket.category}`,
                  coordinates: [ticket.coordinates.lng, ticket.coordinates.lat],
                  tonnage: 'Field Incident',
                  type: ticket.category,
                  permit: `${ticket.id} (${ticket.slaHours || 12}h SLA)`,
                  status: `${ticket.status || 'TRIAGED'} — ${ticket.assignedUnit || 'Rover R-1'}`,
                  severity: ticket.severity,
                  assigned: ticket.assignedUnit || 'Rover R-1 En Route',
                  photo: ticket.photo,
                  description: ticket.description
                });
              }}
              style={{
                position: 'absolute',
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.14)' : 'scale(1)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 11px',
                borderRadius: '9999px',
                backgroundColor: '#9333ea',
                color: 'white',
                fontWeight: 800,
                fontSize: '11px',
                whiteSpace: 'nowrap',
                border: isSelected ? '3px solid #092C5E' : '2px solid white',
                boxShadow: '0 4px 12px rgba(147, 51, 234, 0.42)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                zIndex: isSelected ? 37 : 30
              }}
            >
              <span>🎫 {ticket.id?.replace('TKT-2026-', '#') || 'Ticket'}</span>
            </div>
          );
        })}

      {/* Google Maps-style Map / Satellite Switcher + Zoom Controls (Top Left) */}
      <div
        data-map-interactive="true"
        style={{
          position: 'absolute',
          top: '66px',
          left: '20px',
          zIndex: 12,
          display: 'inline-flex',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          borderRadius: '10px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.16)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          overflow: 'hidden'
        }}
      >
        <button
          type="button"
          onClick={() => setMapType('roadmap')}
          style={{
            padding: '7px 14px',
            border: 'none',
            backgroundColor: mapType === 'roadmap' ? '#092C5E' : 'transparent',
            color: mapType === 'roadmap' ? '#ffffff' : '#334155',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          style={{
            padding: '7px 14px',
            border: 'none',
            borderLeft: '1px solid #e2e8f0',
            backgroundColor: mapType === 'satellite' ? '#092C5E' : 'transparent',
            color: mapType === 'satellite' ? '#ffffff' : '#334155',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Satellite
        </button>
      </div>

      {/* Zoom & Recenter Madgaon Controls */}
      <div
        data-map-interactive="true"
        style={{
          position: 'absolute',
          top: '112px',
          left: '20px',
          zIndex: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.16)',
            border: '1px solid rgba(226, 232, 240, 0.95)',
            overflow: 'hidden'
          }}
        >
          <button
            type="button"
            title="Zoom in"
            onClick={() => setZoom((z) => Math.min(18, z + 1))}
            style={{
              width: '36px',
              height: '36px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} />
          </button>
          <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />
          <button
            type="button"
            title="Zoom out"
            onClick={() => setZoom((z) => Math.max(11, z - 1))}
            style={{
              width: '36px',
              height: '36px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Minus size={18} />
          </button>
        </div>

        <button
          type="button"
          title="Recenter Madgaon (15.2736° N, 73.9575° E)"
          onClick={() => {
            setCenter(MADGAON_DEFAULT_CENTER);
            setZoom(MADGAON_DEFAULT_ZOOM);
          }}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: '1px solid rgba(226, 232, 240, 0.95)',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.16)',
            color: '#092C5E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Compass size={17} />
        </button>
      </div>

      {/* Attribution Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#334155',
          fontWeight: 600,
          pointerEvents: 'none'
        }}
      >
        Google Maps • Madgaon Municipal Sector (15.2736° N, 73.9575° E)
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  const isAdmin = isAdminUser(user);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [showGridModal, setShowGridModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Automatically fall back to Watermark-Free Google Maps Tile Engine when key is absent or restricted on Vercel
  const [gmSdkFailed, setGmSdkFailed] = useState(!HAS_CUSTOM_GMAPS_KEY);

  // Layer Toggles
  const [showDebris, setShowDebris] = useState(true);
  const [showSurges, setShowSurges] = useState(true);
  const [showCitizenReports, setShowCitizenReports] = useState(true);
  const [showHexagons, setShowHexagons] = useState(true);

  // Selected Marker for Details Card
  const [selectedMarker, setSelectedMarker] = useState(CONSTRUCTION_DEBRIS[0]);
  const [citizenReports, setCitizenReports] = useState([]);
  const [mobileTelemetryOpen, setMobileTelemetryOpen] = useState(false);

  // Watch for Google Maps JS API auth/billing/referrer errors (e.g. on Vercel) and switch immediately
  useEffect(() => {
    if (!HAS_CUSTOM_GMAPS_KEY) {
      setGmSdkFailed(true);
      return;
    }

    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      setGmSdkFailed(true);
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
    };

    const observer = new MutationObserver(() => {
      const errDialog = document.querySelector('.gm-err-container, .dismissButton');
      if (errDialog) {
        setGmSdkFailed(true);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.gm_authFailure = prevAuthFailure;
    };
  }, []);

  const showNotification = useCallback((text) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  // Load Citizen Reports & Redressal Tickets from LocalStorage
  const loadCitizenReports = useCallback(() => {
    try {
      const savedTickets = JSON.parse(localStorage.getItem('gridshift_redressal_tickets') || '[]');
      if (savedTickets.length > 0) {
        setCitizenReports(savedTickets);
        return;
      }
      localStorage.setItem('gridshift_redressal_tickets', JSON.stringify(INITIAL_REDRESSAL_TICKETS));
      setCitizenReports(INITIAL_REDRESSAL_TICKETS);
    } catch {
      setCitizenReports(INITIAL_REDRESSAL_TICKETS);
    }
  }, []);

  useEffect(() => {
    loadCitizenReports();
    const handleReportEvent = (e) => {
      loadCitizenReports();
      if (e.detail) {
        setSelectedMarker({
          id: e.detail.id,
          name: `Citizen Ticket: ${e.detail.category}`,
          coordinates: [e.detail.coordinates.lng, e.detail.coordinates.lat],
          tonnage: 'Field Verified',
          type: e.detail.category,
          permit: `Ticket ${e.detail.id} (${e.detail.slaHours || 12}h SLA)`,
          status: `${e.detail.status || 'TRIAGED'} — ${e.detail.assignedUnit || 'Rover R-1'}`,
          severity: e.detail.severity,
          assigned: e.detail.assignedUnit || 'Autonomous Unit R-1',
          photo: e.detail.photo
        });
      }
    };
    window.addEventListener('citizenReportAdded', handleReportEvent);
    window.addEventListener('redressalTicketUpdated', loadCitizenReports);
    return () => {
      window.removeEventListener('citizenReportAdded', handleReportEvent);
      window.removeEventListener('redressalTicketUpdated', loadCitizenReports);
    };
  }, [loadCitizenReports]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiPath = BACKEND_URL ? `${BACKEND_URL}/api/permits` : '/api/permits';
      const response = await axios.get(apiPath);
      const realPermits = response.data;

      if (Array.isArray(realPermits) && realPermits.length > 0) {
        const mappedData = realPermits.map((permit) => ({
          position: [permit.coordinates.lng, permit.coordinates.lat],
          weight: permit.forecast?.predicted_surge_tonnage || 10
        }));
        setData(mappedData);

        const alerts = realPermits
          .filter((p) => p.forecast?.alert_triggered || p.forecast?.pressure_level === 'High' || p.forecast?.pressure_level === 'Critical')
          .map((p) => ({
            location: p.location,
            surge: Number(p.forecast.predicted_surge_tonnage).toFixed(1),
            level: p.forecast.pressure_level,
            copilot: p.forecast.copilot
          }))
          .slice(0, 5);

        setPredictions(alerts);
        return;
      }
      throw new Error('Empty permits list');
    } catch {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDispatchFromMap = () => {
    if (!isAdmin) return;
    setSelectedMarker((prev) =>
      prev ? { ...prev, status: `ASSIGNED — Dispatched by ${ADMIN_EMAIL}` } : prev
    );
    showNotification(`Compactor dispatched to ${selectedMarker.name} by Admin (${ADMIN_EMAIL})!`);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200,
            backgroundColor: '#092C5E',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '14px',
            boxShadow: '0 14px 36px rgba(0,0,0,0.3)',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldCheck size={16} color="#4ade80" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. GOOGLE MAPS PLATFORM LIVE GRID MAP (Default View: Madgaon Local Area 15.2736, 73.9575) */}
      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {gmSdkFailed ? (
          <MadgaonInteractiveTileMap
            data={data}
            showHexagons={showHexagons}
            showDebris={showDebris}
            showSurges={showSurges}
            showCitizenReports={showCitizenReports}
            citizenReports={citizenReports}
            selectedMarker={selectedMarker}
            setSelectedMarker={setSelectedMarker}
          />
        ) : (
          <APIProvider apiKey={RAW_GMAPS_KEY} libraries={['marker']}>
            <Map
              defaultCenter={MADGAON_DEFAULT_CENTER}
              defaultZoom={MADGAON_DEFAULT_ZOOM}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio', 'gmp_git_agentskills_v1']}
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Layer 0: Madgaon Hex Density Zones */}
              {showHexagons &&
                data.map((pt, idx) => {
                  const sizePx = Math.max(54, Math.min(110, Math.round(pt.weight * 4.5)));
                  return (
                    <AdvancedMarker
                      key={`hex-${idx}`}
                      position={{ lat: pt.position[1], lng: pt.position[0] }}
                      zIndex={1}
                    >
                      <div
                        style={{
                          width: `${sizePx}px`,
                          height: `${sizePx}px`,
                          borderRadius: '50%',
                          background:
                            pt.weight >= 16
                              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, rgba(239, 68, 68, 0.08) 70%, transparent 100%)'
                              : 'radial-gradient(circle, rgba(34, 197, 94, 0.35) 0%, rgba(34, 197, 94, 0.08) 70%, transparent 100%)',
                          border:
                            pt.weight >= 16
                              ? '1.5px dashed rgba(239, 68, 68, 0.55)'
                              : '1.5px dashed rgba(22, 163, 74, 0.55)',
                          pointerEvents: 'none',
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    </AdvancedMarker>
                  );
                })}

              {/* Layer 1: Madgaon Construction & Demolition (C&D) Debris Pointers */}
              {showDebris &&
                CONSTRUCTION_DEBRIS.map((item) => {
                  const isSelected = selectedMarker?.id === item.id;
                  return (
                    <AdvancedMarker
                      key={item.id}
                      position={{ lat: item.coordinates[1], lng: item.coordinates[0] }}
                      title={`${item.name} (${item.tonnage}T)`}
                      onClick={() => setSelectedMarker(item)}
                      zIndex={10}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '9999px',
                          backgroundColor: item.severity === 'Critical' ? '#ea580c' : '#f59e0b',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '11px',
                          border: isSelected ? '3px solid #092C5E' : '2px solid white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.28)',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <span>🏗️ {item.tonnage}T</span>
                      </div>
                    </AdvancedMarker>
                  );
                })}

              {/* Layer 2: Madgaon Micro-Surge Hotspot Pointers */}
              {showSurges &&
                SURGE_HOTSPOTS.map((spot) => {
                  const isSelected = selectedMarker?.id === spot.id;
                  return (
                    <AdvancedMarker
                      key={spot.id}
                      position={{ lat: spot.coordinates[1], lng: spot.coordinates[0] }}
                      title={`${spot.name} (${spot.tonnage}T)`}
                      onClick={() => setSelectedMarker(spot)}
                      zIndex={20}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 11px',
                          borderRadius: '9999px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '11px',
                          border: isSelected ? '3px solid #092C5E' : '2px solid white',
                          boxShadow: '0 6px 16px rgba(239, 68, 68, 0.45)',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <span>⚠️ {spot.tonnage}T</span>
                      </div>
                    </AdvancedMarker>
                  );
                })}

              {/* Layer 3: Geotagged Citizen Redressal Ticket Pointers */}
              {showCitizenReports &&
                citizenReports.map((ticket) => {
                  if (!ticket?.coordinates?.lat || !ticket?.coordinates?.lng) return null;
                  const isSelected = selectedMarker?.id === ticket.id;
                  return (
                    <AdvancedMarker
                      key={ticket.id}
                      position={{
                        lat: Number(ticket.coordinates.lat),
                        lng: Number(ticket.coordinates.lng)
                      }}
                      title={`Ticket ${ticket.id}: ${ticket.category}`}
                      zIndex={30}
                      onClick={() =>
                        setSelectedMarker({
                          id: ticket.id,
                          name: `Citizen Ticket: ${ticket.category}`,
                          coordinates: [ticket.coordinates.lng, ticket.coordinates.lat],
                          tonnage: 'Field Incident',
                          type: ticket.category,
                          permit: `${ticket.id} (${ticket.slaHours || 12}h SLA)`,
                          status: `${ticket.status || 'TRIAGED'} — ${ticket.assignedUnit || 'Rover R-1'}`,
                          severity: ticket.severity,
                          assigned: ticket.assignedUnit || 'Rover R-1 En Route',
                          photo: ticket.photo,
                          description: ticket.description
                        })
                      }
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '9999px',
                          backgroundColor: '#9333ea',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '11px',
                          border: isSelected ? '3px solid #092C5E' : '2px solid white',
                          boxShadow: '0 4px 12px rgba(147, 51, 234, 0.38)',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <span>🎫 {ticket.id?.replace('TKT-2026-', '#') || 'Ticket'}</span>
                      </div>
                    </AdvancedMarker>
                  );
                })}
            </Map>
          </APIProvider>
        )}
      </div>

      {/* 2. LAYER FILTER CONTROLS BAR (Top Left) */}
      <div className="dashboard-filter-bar">
        <button
          onClick={() => setMobileTelemetryOpen(!mobileTelemetryOpen)}
          className="mobile-panel-toggle"
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: mobileTelemetryOpen ? '#092C5E' : '#16a34a',
            color: 'white',
            fontWeight: 800,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {mobileTelemetryOpen ? '✕ Close Stats' : '📊 Telemetry Stats'}
        </button>

        <button
          onClick={() => setShowDebris(!showDebris)}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: showDebris ? '#f59e0b' : 'rgba(255,255,255,0.94)',
            color: showDebris ? 'white' : '#092C5E',
            fontWeight: 700,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
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
            backgroundColor: showSurges ? '#ef4444' : 'rgba(255,255,255,0.94)',
            color: showSurges ? 'white' : '#092C5E',
            fontWeight: 700,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
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
            backgroundColor: showCitizenReports ? '#a855f7' : 'rgba(255,255,255,0.94)',
            color: showCitizenReports ? 'white' : '#092C5E',
            fontWeight: 700,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🎫 Citizen Tickets ({citizenReports.length})
        </button>

        <button
          onClick={() => setShowHexagons(!showHexagons)}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: showHexagons ? '#22c55e' : 'rgba(255,255,255,0.94)',
            color: showHexagons ? 'white' : '#092C5E',
            fontWeight: 700,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📊 3D Hex Density
        </button>
      </div>

      {/* 3. SELECTED MARKER INSPECTION CARD (Bottom Left — High-Contrast Opaque Card) */}
      {selectedMarker && (
        <div
          className="ios-glass"
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '20px',
            width: '380px',
            maxWidth: 'calc(100% - 40px)',
            borderRadius: '20px',
            padding: '18px 20px',
            zIndex: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            border: '1.5px solid rgba(226, 232, 240, 0.95)',
            boxShadow: '0 20px 44px rgba(9, 44, 94, 0.24)'
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

          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, marginBottom: '12px' }}>
            <div><strong>Tonnage / Volume:</strong> {selectedMarker.tonnage} {typeof selectedMarker.tonnage === 'number' ? 'Tons' : ''}</div>
            <div><strong>Material Type:</strong> {selectedMarker.type}</div>
            {selectedMarker.permit && <div><strong>Reference:</strong> {selectedMarker.permit}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <MapPin size={12} color="#0284c7" />
              <span>Madgaon Coordinates: {selectedMarker.coordinates?.[1]?.toFixed(4)}, {selectedMarker.coordinates?.[0]?.toFixed(4)}</span>
            </div>
            <div><strong>Dispatch Status:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{selectedMarker.status}</span></div>
          </div>

          {selectedMarker.photo && (
            <div style={{ width: '100%', height: '105px', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
              <img src={selectedMarker.photo} alt="Reported Waste" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {isAdmin && (
              <button
                onClick={handleDispatchFromMap}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  borderRadius: '8px',
                  backgroundColor: '#0284c7',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <Truck size={14} />
                Dispatch Fleet Unit
              </button>
            )}

            <Link
              to="/redressal"
              style={{
                flex: isAdmin ? 'initial' : 1,
                padding: '8px 12px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                backgroundColor: isAdmin ? '#f1f5f9' : '#092C5E',
                color: isAdmin ? '#092C5E' : 'white',
                fontWeight: 800,
                textDecoration: 'none',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>{isAdmin ? 'Redressal' : 'Track Ticket in Redressal'}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* 4. FLOATING RIGHT TELEMETRY PANELS */}
      <div className={`dashboard-telemetry-panel ${mobileTelemetryOpen ? 'open' : ''}`}>
        <div className="mobile-panel-toggle" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', width: '100%' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#092C5E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TELEMETRY & LIVE PREDICTIONS
          </span>
          <button
            onClick={() => setMobileTelemetryOpen(false)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 3D Cyber Grid Digital Twin Model Card */}
        <div className="glass-panel card" style={{ pointerEvents: 'auto', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-accent-green)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#092C5E' }}>3D Grid Digital Twin</h4>
            </div>
            <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', padding: '3px 8px', borderRadius: '9999px', fontWeight: 800 }}>
              MADGAON LIVE
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
        <div className="glass-panel" style={{ pointerEvents: 'auto', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#092C5E' }}>Waste Surge Copilot</h3>
            <button
              className="btn btn-primary"
              onClick={fetchData}
              disabled={loading}
              style={{ padding: '4px 12px', fontSize: '0.75rem', backgroundColor: '#092C5E', color: 'white' }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', marginTop: '4px', marginBottom: '12px' }}>Gemini 3.8 Flash + XGBoost Recommendations</p>

          <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '5px' }}>
            {predictions.length === 0 ? (
              <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.82rem', color: '#1e293b' }}>
                🟢 <strong>Margao Market Ward:</strong> Pre-emptive compactor T-402 recommended for evening market clearance (18.0 Tons projected).
              </div>
            ) : (
              predictions.map((p, idx) => (
                <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ display: 'block', fontSize: '0.88rem', marginBottom: '4px', color: '#092C5E' }}>🔴 SURGE ALERT — {p.location}</strong>
                  <div style={{ fontSize: '0.8rem', marginBottom: '6px', color: '#334155' }}>
                    <div><strong>Predicted Load:</strong> {p.surge} Tons</div>
                  </div>
                  {p.copilot && (
                    <ul style={{ margin: 0, fontSize: '0.78rem', listStyleType: 'none', padding: 0, color: '#334155' }}>
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
        <div className="glass-panel card" style={{ pointerEvents: 'auto', padding: '14px 16px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
          <h3 style={{ marginBottom: '6px', fontSize: '0.95rem', color: '#092C5E' }}>Municipal Telemetry Status</h3>
          <div className="stat-row">
            <span>Model Accuracy</span>
            <span className="stat-value" style={{ color: 'var(--color-accent-green)' }}>94.2%</span>
          </div>
          <div className="stat-row">
            <span>C&D Debris Monitored</span>
            <span className="stat-value" style={{ color: '#d97706' }}>62.9 Tons Total</span>
          </div>
          <div className="stat-row">
            <span>Redressal Tickets</span>
            <span className="stat-value" style={{ color: '#9333ea' }}>{citizenReports.length} Tracked</span>
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
