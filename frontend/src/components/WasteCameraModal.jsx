import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, MapPin, AlertTriangle, Upload, Eye } from 'lucide-react';
import '../index.css';

function WasteCameraModal({ isOpen, onClose, onReportAdded }) {
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back, 'user' for front
  const [photoData, setPhotoData] = useState(null);
  const [category, setCategory] = useState('Construction Debris');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState({ lat: 15.2736, lng: 73.9575 });
  const [locating, setLocating] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize camera stream
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
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraError('Unable to open live video stream. You can still upload or snap a photo using the file button below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && !photoData) {
      startCamera(facingMode);
      // Fetch GPS
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
          { timeout: 8000 }
        );
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode, photoData]);

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoData(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoData(event.target.result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newReport = {
      id: `WD-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      severity,
      description: description || `${category} reported at coordinates`,
      coordinates: coords,
      location: `Ward Zone (${coords.lat}, ${coords.lng})`,
      photo: photoData,
      timestamp: new Date().toLocaleString()
    };

    // Save to LocalStorage
    const existing = JSON.parse(localStorage.getItem('gridshift_citizen_reports') || '[]');
    const updated = [newReport, ...existing];
    localStorage.setItem('gridshift_citizen_reports', JSON.stringify(updated));

    // Dispatch global event so Dashboard pins it immediately
    window.dispatchEvent(new CustomEvent('citizenReportAdded', { detail: newReport }));

    if (onReportAdded) onReportAdded(newReport);
    alert(`✅ Waste Incident Reported!\nReference ID: ${newReport.id}\nLocation pinned to Live Map for autonomous dispatch.`);
    
    // Reset and close
    setPhotoData(null);
    setDescription('');
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
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Report Waste Hotspot</h3>
              <span style={{ fontSize: '11px', color: '#93c5fd' }}>
                Citizen & Field Inspector Live Geotagger
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
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
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder / Form Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {!photoData ? (
            <div>
              {/* Camera Stream Viewfinder */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '280px',
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
                <div style={{ color: '#d97706', fontSize: '0.8rem', marginTop: '10px', backgroundColor: '#fef3c7', padding: '8px 12px', borderRadius: '8px' }}>
                  {cameraError}
                </div>
              )}

              {/* Shutter & File Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                >
                  <Camera size={18} />
                  Snap Photo
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '9999px',
                    backgroundColor: '#f1f5f9',
                    color: '#092C5E',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={16} />
                  Choose File
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
                  height: '200px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  marginBottom: '16px',
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

              {/* Category Picker */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#092C5E', marginBottom: '6px' }}>
                  Waste Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="Construction Debris">🏗️ Construction & Demolition Debris</option>
                  <option value="Illegal Curbside Dump">🚯 Illegal Curbside Dumping</option>
                  <option value="Overflowing Bin">⚠️ Overflowing Municipal Dumpster</option>
                  <option value="Commercial Organics">🥦 Commercial Kitchen Organics</option>
                  <option value="Hazardous / Chemical">🧪 Hazardous / Chemical Waste</option>
                </select>
              </div>

              {/* Severity & Coords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#092C5E', marginBottom: '6px' }}>
                    Urgency Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="Critical">🔴 Critical (Immediate Hazard)</option>
                    <option value="High">🟠 High (Heavy Overflow)</option>
                    <option value="Medium">🟡 Medium (Curbside Clutter)</option>
                    <option value="Low">🟢 Low (Minor Litter)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#092C5E', marginBottom: '6px' }}>
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
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#092C5E', marginBottom: '6px' }}>
                  Incident Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Concrete rubble blocking pedestrian pavement"
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
                Submit Geotagged Report & Pin to Map
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default WasteCameraModal;
