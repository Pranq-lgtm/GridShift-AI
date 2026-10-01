import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Zap, 
  Activity, 
  BarChart3,
  Radar,
  Camera
} from 'lucide-react';
import '../index.css';

function Home({ onOpenWasteCamera }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      badge: 'URBAN METABOLISM & INTELLIGENCE',
      title: 'Autonomous Waste Grid.',
      subtitle: 'Zero Overflows.',
      description: 'Predict micro-surges before bins overflow. Coordinate autonomous rovers, smart IoT kitchen bins, and dynamic municipal routing with AI precision.',
      primaryBtn: { text: 'Launch Live Grid Map', link: '/dashboard' },
      secondaryBtn: { text: 'View Fleet Status', link: '/fleet' },
      image: '/grid-isometric.jpg',
      imageAlt: 'GridShift 3D Digital Twin City Model',
      cardBadge: '3D DIGITAL TWIN • ACTIVE'
    },
    {
      badge: 'COMPUTER VISION SENTINEL',
      title: 'Real-Time Street Detection.',
      subtitle: 'Autonomous Rover Scouts.',
      description: 'Smart edge cameras and autonomous sidewalk rovers scan urban corridors in real-time, detecting debris clusters and optimizing dispatch.',
      primaryBtn: { text: 'Audit Detected Debris', link: '/dashboard' },
      secondaryBtn: { text: 'Track Rover Fleet', link: '/fleet' },
      image: '/street-detection.jpg',
      imageAlt: 'AI Street Vision Object Detection',
      cardBadge: 'AI VISION • OBJECT-ID #042'
    },
    {
      badge: 'COMMERCIAL IOT HARDWARE',
      title: 'Precision Kitchen Sensors.',
      subtitle: 'Organics Waste Tech.',
      description: 'Heavy-duty IoT sensor modules for commercial kitchens and high-density venues track real-time fill depth, weight, and automated collection thresholds.',
      primaryBtn: { text: 'Explore Analytics', link: '/analytics' },
      secondaryBtn: { text: 'Configure Sensor Nodes', link: '/dashboard' },
      image: '/iot-organics.jpg',
      imageAlt: 'Commercial Kitchen Organics Smart IoT Bin',
      cardBadge: 'IOT TELEMETRY • FILL 90%'
    }
  ];

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const marqueeItems = [
    '🟢 Ward 4: Bin #104 emptied by Autonomous Rover R-3',
    '⚡ Bayshore Ave: Debris-042 identified as Recyclable (98% conf.)',
    '📊 Downtown Kitchen Hub: Organics container reached 90% threshold',
    '🚛 Route Optima: 14 dynamic routes generated — 22% fuel saved today',
    '🌱 Metro Central: 94.8% clean corridor rating verified',
    '🔔 ML Model: Micro-surge anticipated near Waterfront Promenade'
  ];

  return (
    <div className="home-container">
      
      {/* 1. HERO SLIDESHOW CONTAINER (Pukaar Apple-Style) */}
      <section style={{ maxWidth: '1280px', margin: '0 auto 40px auto' }}>
        <div className="hero-slide-container">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={index}
                className={`hero-slide ${isActive ? 'active' : ''}`}
                style={{ width: '100%', height: '100%' }}
              >
                <div className="hero-slide-content">
                  {/* Left Text Content */}
                  <div className="hero-text-col">
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'white',
                      color: '#092C5E',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      marginBottom: '16px',
                      boxShadow: '0 2px 10px rgba(9, 44, 94, 0.06)',
                      border: '1px solid rgba(9, 44, 94, 0.1)'
                    }}>
                      <Sparkles size={13} color="#22c55e" />
                      {slide.badge}
                    </span>

                    <h1 className="hero-title">
                      {slide.title}<br />
                      <span style={{ color: '#22c55e' }}>{slide.subtitle}</span>
                    </h1>

                    <p className="hero-desc">
                      {slide.description}
                    </p>

                    <div className="hero-btn-group">
                      <Link
                        to={slide.primaryBtn.link}
                        className="btn"
                        style={{
                          padding: '14px 28px',
                          borderRadius: '9999px',
                          backgroundColor: '#092C5E',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          boxShadow: '0 10px 25px -5px rgba(9, 44, 94, 0.3)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {slide.primaryBtn.text}
                        <ArrowRight size={16} />
                      </Link>

                      <Link
                        to={slide.secondaryBtn.link}
                        style={{
                          padding: '14px 26px',
                          borderRadius: '9999px',
                          backgroundColor: 'white',
                          color: '#092C5E',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          border: '2px solid rgba(9, 44, 94, 0.12)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }}
                      >
                        {slide.secondaryBtn.text}
                      </Link>

                      {onOpenWasteCamera && (
                        <button
                          onClick={onOpenWasteCamera}
                          type="button"
                          style={{
                            padding: '14px 22px',
                            borderRadius: '9999px',
                            backgroundColor: '#ecfdf5',
                            color: '#065f46',
                            border: '2px solid #a7f3d0',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Camera size={16} color="#059669" />
                          Report Waste
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Visual Image */}
                  <div className="hero-image-col">
                    {/* Ambient Glow */}
                    <div style={{
                      position: 'absolute',
                      width: '260px',
                      height: '260px',
                      background: 'rgba(34, 197, 94, 0.22)',
                      borderRadius: '9999px',
                      filter: 'blur(50px)',
                      zIndex: 0
                    }} />

                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      boxShadow: '0 20px 40px -10px rgba(9, 44, 94, 0.25)',
                      border: '3px solid rgba(255, 255, 255, 0.8)',
                      zIndex: 1
                    }}>
                      <img
                        src={slide.image}
                        alt={slide.imageAlt}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />

                      {/* Floating badge inside image */}
                      <div style={{
                        position: 'absolute',
                        bottom: '14px',
                        left: '14px',
                        background: 'rgba(9, 44, 94, 0.88)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        <span className="pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                        {slide.cardBadge}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Slider Arrow Controls */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="hero-arrow-btn"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              color: '#092C5E'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="hero-arrow-btn"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              color: '#092C5E'
            }}
          >
            <ChevronRight size={20} />
          </button>

          {/* Slider Pagination Dots */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 20
          }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`hero-dot ${i === currentSlide ? 'active' : ''}`}
                style={{
                  height: '8px',
                  width: i === currentSlide ? '28px' : '10px',
                  borderRadius: '99px',
                  backgroundColor: i === currentSlide ? '#092C5E' : '#cbd5e1',
                  border: 'none',
                  outline: 'none',
                  padding: 0
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. IMPACT METRICS BAR (Pukaar Section 2 Style) */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 50px auto' }}>
        <div className="metrics-grid">
          <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9', padding: '8px' }}>
            <div className="metrics-stat-value">
              18.4K+
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Tons Diverted
            </div>
          </div>

          <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9', padding: '8px' }}>
            <div className="metrics-stat-value">
              99.2%
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Prediction Accuracy
            </div>
          </div>

          <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9', padding: '8px' }}>
            <div className="metrics-stat-value">
              140+
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Connected Sensors
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              color: '#16a34a',
              padding: '6px 14px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800,
              fontSize: '12px',
              marginBottom: '4px',
              border: '1px solid rgba(34, 197, 94, 0.25)'
            }}>
              <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              Active Sentinel
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Real-Time Telematics
            </div>
          </div>
        </div>
      </section>

      {/* 3. SPOTLIGHT SECTION 1: AI STREET SENTINEL (street-detection.jpg) */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 60px auto' }}>
        <div className="ios-card-white spotlight-card">
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '260px',
            height: '260px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '9999px',
            filter: 'blur(70px)',
            pointerEvents: 'none'
          }} />

          {/* Left Text */}
          <div style={{ flex: 1, zIndex: 10 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              backgroundColor: '#eff6ff',
              color: '#092C5E',
              padding: '6px 14px',
              borderRadius: '16px',
              border: '1px solid #dbeafe'
            }}>
              <Radar size={16} color="#092C5E" />
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}>
                AI STREET SENTINEL
              </span>
            </div>

            <h2 style={{
              fontSize: '2.4rem',
              fontWeight: 900,
              color: '#092C5E',
              lineHeight: 1.2,
              marginBottom: '18px',
              letterSpacing: '-0.02em'
            }}>
              Autonomous Detection.<br />
              <span style={{ color: '#2563eb' }}>Instant Rover Dispatch.</span>
            </h2>

            <p style={{
              color: '#64748b',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '24px',
              fontWeight: 500
            }}>
              GridShift-AI deploys state-of-the-art computer vision to detect curbside debris, overflowing public bins, and litter hotspots in real time. Autonomous rovers and compactors receive dynamically prioritized dispatch vectors before community complaints arise.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#1f2937', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#22c55e" />
                <span>Real-time Object Classification: Recyclables, Organics, Hazardous Debris</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#1f2937', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#22c55e" />
                <span>Autonomous sidewalk rovers and compactor vehicle synchronization</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#1f2937', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#22c55e" />
                <span>Geotagged heatmaps mapped directly onto municipal GIS systems</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                to="/dashboard"
                className="btn"
                style={{
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  backgroundColor: '#092C5E',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  boxShadow: '0 8px 20px -4px rgba(9, 44, 94, 0.25)'
                }}
              >
                Inspect Live Heatmap
              </Link>
              <Link
                to="/fleet"
                style={{
                  padding: '12px 22px',
                  borderRadius: '9999px',
                  backgroundColor: 'white',
                  color: '#092C5E',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: '2px solid rgba(9, 44, 94, 0.12)',
                  textDecoration: 'none'
                }}
              >
                Fleet Telemetry
              </Link>
            </div>
          </div>

          {/* Right Image Container */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10, width: '100%' }}>
            <div style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 16px 36px -8px rgba(9, 44, 94, 0.2)',
              border: '2px solid rgba(255,255,255,0.9)',
              position: 'relative'
            }}>
              <img
                src="/street-detection.jpg"
                alt="AI Street Vision Object Detection"
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '340px', objectFit: 'cover' }}
              />

              {/* Heatmap overlay tag */}
              <div style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                LOCATION: BAYSHORE AVE
              </div>

              <div style={{
                position: 'absolute',
                bottom: '14px',
                left: '14px',
                background: 'rgba(9, 44, 94, 0.9)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '11px',
                lineHeight: 1.4,
                border: '1px solid rgba(34, 197, 94, 0.4)'
              }}>
                <div style={{ color: '#22c55e', fontWeight: 800 }}>OBJECT ID: DEBRIS-042</div>
                <div>TYPE: RECYCLABLE (98.4%)</div>
                <div style={{ color: '#cbd5e1', fontSize: '10px' }}>DISPATCH: ROVER-1 ASSIGNED</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SPOTLIGHT SECTION 2: COMMERCIAL KITCHENS & IOT TECH (iot-organics.jpg) */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 60px auto' }}>
        <div className="ios-card-white spotlight-card spotlight-reverse">
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '260px',
            height: '260px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '9999px',
            filter: 'blur(70px)',
            pointerEvents: 'none'
          }} />

          {/* Left Text */}
          <div style={{ flex: 1, zIndex: 10 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              padding: '6px 14px',
              borderRadius: '16px',
              border: '1px solid #a7f3d0'
            }}>
              <Cpu size={16} color="#059669" />
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}>
                HEAVY-DUTY IOT TELEMETRY
              </span>
            </div>

            <h2 style={{
              fontSize: '2.4rem',
              fontWeight: 900,
              color: '#092C5E',
              lineHeight: 1.2,
              marginBottom: '18px',
              letterSpacing: '-0.02em'
            }}>
              Precision Sensors.<br />
              <span style={{ color: '#059669' }}>From Kitchen to Curbside.</span>
            </h2>

            <p style={{
              color: '#64748b',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '24px',
              fontWeight: 500
            }}>
              Commercial hospitality hubs and culinary facilities generate massive volumes of perishable organics. GridShift-AI hardware lids monitor fill height, weight, and internal temperatures—dispatching collections exactly when needed to eliminate odors and bacterial risks.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '28px'
            }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#092C5E' }}>42%</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Fuel Saved</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669' }}>0</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Overflow Events</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#092C5E' }}>3.4x</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Faster Turnaround</div>
              </div>
            </div>

            <Link
              to="/analytics"
              className="btn"
              style={{
                padding: '12px 24px',
                borderRadius: '9999px',
                backgroundColor: '#092C5E',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 8px 20px -4px rgba(9, 44, 94, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <BarChart3 size={16} />
              View Organics Analytics
            </Link>
          </div>

          {/* Right Image */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10, width: '100%' }}>
            <div style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 16px 36px -8px rgba(9, 44, 94, 0.2)',
              border: '2px solid rgba(255,255,255,0.9)',
              position: 'relative'
            }}>
              <img
                src="/iot-organics.jpg"
                alt="Commercial Kitchen Organics Smart IoT Bin"
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '340px', objectFit: 'cover' }}
              />

              {/* Status overlay tag */}
              <div style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                background: 'rgba(9, 44, 94, 0.9)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                COMMERCIAL ORGANICS NODE
              </div>

              <div style={{
                position: 'absolute',
                bottom: '14px',
                right: '14px',
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '11px',
                lineHeight: 1.4,
                border: '1px solid rgba(239, 68, 68, 0.5)'
              }}>
                <div style={{ color: '#ef4444', fontWeight: 800 }}>⚠️ SURGE ALERT: 90% FULL</div>
                <div>NODE ID: GW134 (KITCHEN BAY 2)</div>
                <div style={{ color: '#22c55e', fontSize: '10px' }}>AI OPTIMIZED ROUTE QUEUED</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SERVICES & CAPABILITIES GRID */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 60px auto' }}>
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#092C5E', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Core AI Modules & <span style={{ color: '#22c55e' }}>Platform Capabilities</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', margin: '0 auto' }}>
            Modular intelligence engineered for municipal sanitation divisions, facility managers, and smart city operators.
          </p>
        </div>

        <div className="three-col-grid">
          
          {/* Card 1 */}
          <div className="ios-card-white" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <Layers size={26} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#092C5E', marginBottom: '8px' }}>
              Micro-Surge Forecasting
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
              Our XGBoost and neural models correlate commercial building permits, weather patterns, and historical disposal cycles to forecast volume spikes up to 48 hours in advance.
            </p>
            <Link
              to="/analytics"
              style={{
                width: '100%',
                textAlign: 'center',
                backgroundColor: '#092C5E',
                color: 'white',
                fontWeight: 700,
                padding: '12px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '0.85rem'
              }}
            >
              Explore Forecasting &rarr;
            </Link>
          </div>

          {/* Card 2 */}
          <div className="ios-card-white" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <Truck size={26} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#092C5E', marginBottom: '8px' }}>
              Autonomous Fleet Routing
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
              Dynamic GPS waypoints automatically reroute municipal compactor trucks and sidewalk sweepers directly to critical load zones, cutting dead mileage and emissions.
            </p>
            <Link
              to="/fleet"
              style={{
                width: '100%',
                textAlign: 'center',
                backgroundColor: '#092C5E',
                color: 'white',
                fontWeight: 700,
                padding: '12px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '0.85rem'
              }}
            >
              Manage Fleet &rarr;
            </Link>
          </div>

          {/* Card 3 */}
          <div className="ios-card-white" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <MapPin size={26} color="#d97706" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#092C5E', marginBottom: '8px' }}>
              3D Spatial Hexagon Grids
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
              DeckGL-powered H3 geospatial pillars provide intuitive visualization of waste accumulation rates, allowing municipal planners to optimize bin placement.
            </p>
            <Link
              to="/dashboard"
              style={{
                width: '100%',
                textAlign: 'center',
                backgroundColor: '#092C5E',
                color: 'white',
                fontWeight: 700,
                padding: '12px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '0.85rem'
              }}
            >
              Open Spatial Map &rarr;
            </Link>
          </div>

        </div>
      </section>

      {/* 6. PILLARS BANNER */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 60px auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #092C5E 0%, #0B3B7B 50%, #061C3D 100%)',
          borderRadius: '2.5rem',
          padding: '44px 32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(9, 44, 94, 0.35)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Ambient Glows */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: 'rgba(59, 130, 246, 0.25)',
            filter: 'blur(100px)',
            borderRadius: '9999px',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '300px',
            height: '300px',
            background: 'rgba(34, 197, 94, 0.2)',
            filter: 'blur(100px)',
            borderRadius: '9999px',
            pointerEvents: 'none'
          }} />

          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto', position: 'relative', zIndex: 10 }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.12)',
              color: '#93c5fd',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              padding: '6px 16px',
              borderRadius: '9999px',
              backdropFilter: 'blur(10px)',
              marginBottom: '14px',
              border: '1px solid rgba(255,255,255,0.15)'
            }}>
              MUNICIPAL RESILIENCE & UPTIME
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Built For Zero-Latency Operations.
            </h2>
            <p style={{ color: 'rgba(219, 234, 254, 0.8)', fontSize: '0.95rem', marginTop: '10px', fontWeight: 500 }}>
              End-to-end reliability from IoT bin telematics to cloud machine learning and autonomous dispatch.
            </p>
          </div>

          {/* 3 Pillars */}
          <div className="three-col-grid" style={{ position: 'relative', zIndex: 10 }}>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '1.5rem',
              padding: '28px 20px',
              textAlign: 'center',
              transition: 'all 0.3s'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#4ade80'
              }}>
                <Zap size={26} />
              </div>
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.15rem', marginBottom: '8px' }}>
                15-Second Telemetry
              </h3>
              <p style={{ color: 'rgba(219, 234, 254, 0.7)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Edge-processed sensor events stream over cellular LoRaWAN to maintain sub-second updates without network bottleneck.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '1.5rem',
              padding: '28px 20px',
              textAlign: 'center',
              transition: 'all 0.3s'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#60a5fa'
              }}>
                <Activity size={26} />
              </div>
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.15rem', marginBottom: '8px' }}>
                Predictive Reroutes
              </h3>
              <p style={{ color: 'rgba(219, 234, 254, 0.7)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Continuous algorithmic simulation generates dynamic waypoint updates as soon as trash capacity reaches 80%.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '1.5rem',
              padding: '28px 20px',
              textAlign: 'center',
              transition: 'all 0.3s'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#c084fc'
              }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.15rem', marginBottom: '8px' }}>
                End-to-End Encrypted
              </h3>
              <p style={{ color: 'rgba(219, 234, 254, 0.7)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Military-grade AES-256 encrypted payload channels for municipal compliance and secure data governance.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. LIVE SYSTEM TICKER */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 60px auto', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            LIVE STREAM PULSE
          </span>
        </div>
        <div style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          padding: '12px 0',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(0,0,0,0.04)'
        }}>
          {/* Gradient Edges */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to right, #fbfbfd, transparent)', zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to left, #fbfbfd, transparent)', zIndex: 10 }} />

          <div className="animate-scroll" style={{ display: 'flex', gap: '16px', padding: '0 16px' }}>
            {marqueeItems.concat(marqueeItems).map((text, idx) => (
              <div
                key={idx}
                style={{
                  flexShrink: 0,
                  backgroundColor: 'white',
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#334155'
                }}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. QUICK DISPATCH CTA */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 60px auto' }}>
        <div className="ios-card-white" style={{
          padding: '40px 24px',
          textAlign: 'center',
          boxShadow: '0 20px 50px -10px rgba(9,44,94,0.08)',
          border: '1px solid rgba(9,44,94,0.1)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            backgroundColor: '#092C5E',
            color: 'white',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 10px 25px rgba(9, 44, 94, 0.25)',
            transform: 'rotate(-3deg)'
          }}>
            <Sparkles size={28} />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#092C5E', marginBottom: '10px' }}>
            Ready to Monitor Urban Micro-Surges?
          </h2>

          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 24px auto', fontWeight: 500 }}>
            Inspect real-time 3D hexagonal density layers, manage municipal vehicle telemetry, and track commercial diversion rates.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/dashboard"
              className="btn"
              style={{
                padding: '14px 30px',
                borderRadius: '9999px',
                backgroundColor: '#092C5E',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 10px 25px -5px rgba(9, 44, 94, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Launch Live Grid Map
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/fleet"
              style={{
                padding: '14px 26px',
                borderRadius: '9999px',
                backgroundColor: 'white',
                color: '#092C5E',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: '2px solid rgba(9, 44, 94, 0.15)',
                textDecoration: 'none'
              }}
            >
              View Fleet Dispatches
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: '24px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/favicon.jpg" alt="GridShift-AI" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <span style={{ fontWeight: 800, color: '#092C5E', fontSize: '1rem' }}>GridShift-AI</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
          <Link to="/" style={{ color: '#092C5E', textDecoration: 'none' }}>Home</Link>
          <Link to="/dashboard" style={{ color: '#64748b', textDecoration: 'none' }}>Live Grid</Link>
          <Link to="/fleet" style={{ color: '#64748b', textDecoration: 'none' }}>Fleet Telemetry</Link>
          <Link to="/analytics" style={{ color: '#64748b', textDecoration: 'none' }}>Analytics</Link>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
          &copy; 2026 GridShift-AI Platform. Autonomous Waste Management Intelligence.
        </div>
      </footer>

    </div>
  );
}

export default Home;
