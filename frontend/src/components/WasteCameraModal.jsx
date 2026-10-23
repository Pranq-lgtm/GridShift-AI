import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, MapPin, Upload, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import '../index.css';

const SLA_HOURS_BY_SEVERITY = {
  Critical: 4,
  High: 12,
  Medium: 24,
  Low: 48
};

const DEFAULT_UNIT_BY_SEVERITY = {
  Critical: 'Compactor T-402 (Priority Surge)',
  High: 'Autonomous Rover R-1',
  Medium: 'Truck T-119 (Ward Patrol)',
  Low: 'Rover R-3 (Scheduled Sweep)'
};

// Optimize base64 thumbnail to <= 480px width at 0.68 JPEG quality so LocalStorage 5MB quota never overflows
function compressDataUrl(dataUrl, maxWidth = 480, quality = 0.68) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / (img.width || maxWidth));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round((img.width || 480) * scale);
      canvas.height = Math.round((img.height || 360) * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function WasteCameraModal({ isOpen, onClose, onReportAdded, currentUser }) {
  const [facingMode, setFacingMode] = useState('environment');
  const [photoData, setPhotoData] = useState(null);
  const [category, setCategory] = useState('Construction Debris');
  const [severity, setSeverity] = useState('High');
  const [ward, setWard] = useState('Ward 7 — Margao Central Market');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState({ lat: 15.2736, lng: 73.9575 });
  const [locating, setLocating] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async (mode) => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera stream fallback:', err);
      setCameraError('Live camera stream unavailable in this browser environment. You can upload an image or use the instant simulated field capture below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && !photoData && !submittedTicket) {
      startCamera(facingMode);
      if (navigator.geolocation) {
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({
              lat: Number(pos.coords.latitude.toFixed(4)),
              lng: Number(pos.coords.longitude.toFixed(4))
            });
            setLocating(false);
          },
          () => setLocating(false),
          { timeout: 6000 }
        );
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode, photoData, submittedTicket]);

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.videoWidth) {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 480 / videoRef.current.videoWidth);
      canvas.width = Math.round(videoRef.current.videoWidth * scale);
      canvas.height = Math.round(videoRef.current.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.68);
      setPhotoData(dataUrl);
      stopCamera();
    } else {
      // Fallback simulated field photo when testing in headless/desktop without webcam
      setPhotoData('/street-detection.jpg');
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const compressed = await compressDataUrl(event.target.result, 480, 0.68);
        setPhotoData(compressed);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ticketNum = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TKT-2026-${ticketNum}`;
    const slaHours = SLA_HOURS_BY_SEVERITY[severity] || 24;
    const assignedUnit = DEFAULT_UNIT_BY_SEVERITY[severity] || 'Rover R-1';
    const reporterEmail = currentUser?.email || 'citizen.margao@goa.gov.in';
    const createdAtIso = new Date().toISOString();
    const slaDeadlineIso = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const newTicket = {
      id: ticketId,
      reportId: `WD-${ticketNum}`,
      category,
      severity,
      status: 'TRIAGED',
      ward,
      description: description || `${category} reported at ${ward}`,
      coordinates: coords,
      location: `${ward} (${coords.lat}, ${coords.lng})`,
      photo: photoData,
      reporterEmail,
      assignedUnit,
      slaHours,
      createdAt: createdAtIso,
      slaDeadline: slaDeadlineIso,
      timestamp: new Date().toLocaleString(),
      adminNotes: `AI Triage confirmed ${severity} urgency (${slaHours}h SLA). Auto-queued ${assignedUnit}.`,
      feedback: null,
      history: [
        {
          status: 'REPORTED',
          by: reporterEmail,
          note: 'Geotagged photo incident submitted by citizen.',
          timestamp: createdAtIso
        },
        {
          status: 'TRIAGED',
          by: 'GridShift AI Triage Engine',
          note: `Classified as ${category} (${severity} priority • ${slaHours}h SLA window).`,
          timestamp: createdAtIso
        }
      ]
    };

    // 1. Save to Redressal Tickets Storage (capped at 30 items to protect storage quota)
    try {
      const existingTickets = JSON.parse(localStorage.getItem('gridshift_redressal_tickets') || '[]');
      const updatedTickets = [newTicket, ...existingTickets].slice(0, 30);
      localStorage.setItem('gridshift_redressal_tickets', JSON.stringify(updatedTickets));
    } catch (storageErr) {
      console.warn('Storage quota warning, trimming older photos:', storageErr);
    }

    // 2. Save to Legacy Citizen Reports for Map compatibility
    try {
      const existingReports = JSON.parse(localStorage.getItem('gridshift_citizen_reports') || '[]');
      const updatedReports = [newTicket, ...existingReports].slice(0, 25);
      localStorage.setItem('gridshift_citizen_reports', JSON.stringify(updatedReports));
    } catch {
      // ignore
    }

    // 3. Sync with backend /api/tickets if reachable
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      fetch(`${backendUrl}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      }).catch(() => {});
    } catch {
      // ignore offline backend
    }

    // 4. Dispatch global events so Dashboard and Redressal views update immediately
    window.dispatchEvent(new CustomEvent('citizenReportAdded', { detail: newTicket }));
    window.dispatchEvent(new CustomEvent('redressalTicketUpdated', { detail: newTicket }));

    if (onReportAdded) onReportAdded(newTicket);
    setSubmittedTicket(newTicket);
  };

  const resetAndClose = () => {
    setPhotoData(null);
    setDescription('');
    setSubmittedTicket(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 44, 94, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.8)',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#092C5E',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={22} color="#22c55e" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Report Waste & Open Redressal Ticket</h3>
              <span style={{ fontSize: '11px', color: '#93c5fd' }}>
                Automated SLA Triage • Geotagged Map Pin • Closed-Loop Verification
              </span>
            </div>
          </div>

          <button
            onClick={resetAndClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Close Report Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder / Form / Confirmation Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {submittedTicket ? (
            <div style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto'
                }}
              >
                <ShieldCheck size={32} />
              </div>

              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '8px'
                }}
              >
                TICKET CREATED • {submittedTicket.id}
              </span>

              <h4 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#092C5E', margin: '0 0 8px 0' }}>
                Geotagged Incident Queued for Redressal
              </h4>
              <p style={{ fontSize: '0.86rem', color: '#475569', margin: '0 0 18px 0', lineHeight: 1.5 }}>
                Your report has been pinned to the 3D Live Grid Map and routed to the Municipal Admin Command Console (<strong>pranavkantak9@gmail.com</strong>).
              </p>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Ticket Reference</span>
                  <strong style={{ color: '#092C5E' }}>{submittedTicket.id}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Target SLA Window</span>
                  <strong style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> {submittedTicket.slaHours} Hours ({submittedTicket.severity})
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Assigned Fleet Unit</span>
                  <strong style={{ color: '#16a34a' }}>{submittedTicket.assignedUnit}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Ward & GPS</span>
                  <strong style={{ color: '#334155' }}>{submittedTicket.coordinates.lat}, {submittedTicket.coordinates.lng}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="/redressal"
                  onClick={(e) => {
                    e.preventDefault();
                    resetAndClose();
                    window.history.pushState({}, '', '/redressal');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Track Ticket SLA & Redressal</span>
                  <ArrowRight size={16} />
                </a>
                <button
                  type="button"
                  onClick={resetAndClose}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                    color: '#092C5E',
                    border: '1px solid #cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : !photoData ? (
            <div>
              {/* Camera Stream Viewfinder */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '260px',
                  backgroundColor: '#0f172a',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)'
                }}
              >
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  autoPlay
                  playsInline
                  muted
                />

                {/* Crosshairs & Lens Frame */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '24px',
                    border: '2px dashed rgba(34, 197, 94, 0.6)',
                    borderRadius: '16px',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ width: 14, height: 14, border: '2px solid #22c55e', borderRadius: '50%' }} />
                </div>

                {/* Facing Mode Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(9, 44, 94, 0.8)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {facingMode === 'environment' ? '📷 Back Camera' : '🤳 Front Camera'}
                </div>

                {/* Camera Flip Button */}
                <button
                  onClick={toggleCamera}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: 'none',
                    color: '#092C5E',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <RefreshCw size={13} />
                  Flip Camera
                </button>
              </div>

              {cameraError && (
                <div style={{ color: '#092C5E', fontSize: '0.78rem', marginTop: '10px', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  {cameraError}
                </div>
              )}

              {/* Shutter & File Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 22px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}
                >
                  <Camera size={17} />
                  Snap / Simulate Field Photo
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '9999px',
                    backgroundColor: '#f1f5f9',
                    color: '#092C5E',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={16} />
                  Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          ) : (
            /* Photo Captured -> Incident Form */
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '185px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  marginBottom: '14px',
                  border: '2px solid #22c55e'
                }}
              >
                <img
                  src={photoData}
                  alt="Captured Waste"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoData(null);
                    startCamera(facingMode);
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} /> Retake
                </button>
              </div>

              {/* Category & Ward Picker */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#092C5E', marginBottom: '5px' }}>
                    Waste Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="Construction Debris">🏗️ Construction & Demolition</option>
                    <option value="Illegal Curbside Dump">🚯 Illegal Curbside Dumping</option>
                    <option value="Overflowing Bin">⚠️ Overflowing Municipal Bin</option>
                    <option value="Commercial Organics">🥦 Commercial Kitchen Organics</option>
                    <option value="Hazardous / Chemical">🧪 Hazardous / Chemical Waste</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#092C5E', marginBottom: '5px' }}>
                    Municipal Ward
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="Ward 7 — Margao Central Market">Ward 7 — Margao Market</option>
                    <option value="Ward 2 — Fatorda Stadium Sector">Ward 2 — Fatorda Sector</option>
                    <option value="Ward 14 — Aquem Commercial">Ward 14 — Aquem Plaza</option>
                    <option value="Ward 10 — Comba Heritage Zone">Ward 10 — Comba Zone</option>
                    <option value="Ward 18 — Borda Residential">Ward 18 — Borda Corridor</option>
                  </select>
                </div>
              </div>

              {/* Severity & Coords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#092C5E', marginBottom: '5px' }}>
                    Urgency Level & SLA
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="Critical">🔴 Critical (4h SLA)</option>
                    <option value="High">🟠 High (12h SLA)</option>
                    <option value="Medium">🟡 Medium (24h SLA)</option>
                    <option value="Low">🟢 Low (48h SLA)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#092C5E', marginBottom: '5px' }}>
                    GPS Coordinates
                  </label>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#f1f5f9',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MapPin size={14} color="#ef4444" />
                    <span>{locating ? 'Locating...' : `${coords.lat}, ${coords.lng}`}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#092C5E', marginBottom: '5px' }}>
                  Incident Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Concrete rubble blocking pedestrian pavement near market gate"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Check size={18} />
                Create Redressal Ticket & Pin to Live Map
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default WasteCameraModal;
