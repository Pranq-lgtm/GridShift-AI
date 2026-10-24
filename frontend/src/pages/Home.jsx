import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
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
  Camera,
  Radio,
  AlertTriangle,
  Eye,
  Signal,
  Globe
} from 'lucide-react';
import '../index.css';

function Home({ onOpenWasteCamera }) {

  const marqueeItems = [
    '🟢 Ward 4: Bin #104 cleared by Municipal Sanitation Staff (On Foot)',
    '⚡ Bayshore Ave: Debris-042 routed to Small Pickup Van V-102 (Zero-Capex)',
    '📊 Margao Market Hub: Organics surge forecasted via permit & event data',
    '🚛 Route Optima: 14 dynamic routes generated — 22% fuel saved today',
    '🌱 Metro Central: 94.8% clean corridor rating verified',
    '🔔 ML Model: Micro-surge anticipated near Waterfront Promenade'
  ];

  return (
    <div className="home-container">
      
      {/* ═══════════════════════════════════════════════════════════
          1. HERO — COMMAND CENTER ENTRY POINT
          ═══════════════════════════════════════════════════════════ */}
      <section className="hero-command">
        {/* Left Column: Actionable Text */}
        <div className="hero-text-col">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(6, 182, 212, 0.08)',
            color: '#0891B2',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '6px 14px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid rgba(6, 182, 212, 0.15)'
          }}>
            <Signal size={13} />
            MUNICIPAL WASTE INTELLIGENCE PLATFORM
          </div>

          <h1 className="hero-title">
            Anticipate.<br />
            Deploy.<br />
            <span className="accent">Clear.</span>
          </h1>

          <p className="hero-desc">
            Predict hyper-local waste surges 48 hours in advance and dynamically route existing municipal sanitation staff (on foot) and small pickup vans to prevent overflow—without burdening the municipal budget with costly hardware.
          </p>

          <div className="hero-btn-group">
            <Link
              to="/dashboard"
              className="btn btn-cta-gradient"
              style={{
                padding: '14px 28px',
                fontSize: '0.92rem',
                gap: '8px'
              }}
            >
              <Globe size={17} />
              Launch Command Grid
            </Link>

            <Link
              to="/fleet"
              className="btn btn-outline"
              style={{
                padding: '14px 24px',
                fontSize: '0.92rem'
              }}
            >
              Fleet Dispatch Status
            </Link>
          </div>
        </div>

        {/* Right Column: Isometric Map Card with AI Glow */}
        <div className="hero-image-col">
          {/* Ambient teal glow behind */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.20) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            zIndex: 0,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />

          <div className="hero-map-card">
            {/* Animated glow ring */}
            <div className="hero-glow-ring" />
            
            <img
              src="/grid-isometric.jpg"
              alt="GridShift 3D Digital Twin — Predictive Waste Grid"
            />

            {/* Floating nodes overlay */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(6, 182, 212, 0.2)'
            }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06B6D4' }} />
              AI PROCESSING ACTIVE
            </div>

            <div className="map-badge">
              <span className="pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              3D DIGITAL TWIN • LIVE GRID
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. LIVE SYSTEM STATUS BAR
          ═══════════════════════════════════════════════════════════ */}
      <section className="live-status-bar">
        {/* Segment 1: Ward Connectivity */}
        <div className="status-segment">
          <span className="status-dot green" />
          <div>
            <span className="status-label">Live Sync Status</span>
            <span className="status-value">24/24 City Wards Connected</span>
          </div>
        </div>

        {/* Segment 2: AI Forecasts */}
        <div className="status-segment">
          <span className="status-dot amber" />
          <div>
            <span className="status-label">Active AI Forecasts</span>
            <span className="status-value">
              <Link to="/analytics">3 Potential Surges Detected →</Link>
            </span>
          </div>
        </div>

        {/* Segment 3: Fleet Readiness */}
        <div className="status-segment">
          <span className="status-dot cyan" />
          <div>
            <span className="status-label">Fleet Readiness</span>
            <span className="status-value">12/15 Mobile Compactors Available</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. AI STREET SENTINEL — Premium Spotlight Card
          ═══════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1280px', margin: '0 auto 56px auto' }}>
        <div className="gs-card spotlight-card">
          {/* Subtle ambient glow */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: '-40px',
            width: '280px',
            height: '280px',
            backgroundColor: 'rgba(6, 182, 212, 0.06)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none'
          }} />

          {/* Left Text */}
          <div style={{ flex: 1, zIndex: 10 }} className="spotlight-text-area">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              color: '#0891B2',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(6, 182, 212, 0.15)'
            }}>
              <Radar size={14} color="#0891B2" />
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}>
                AI STREET SENTINEL
              </span>
            </div>

            <h2 style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              color: '#0F172A',
              lineHeight: 1.15,
              marginBottom: '16px',
              letterSpacing: '-0.03em'
            }}>
              Zero-Capex Detection.<br />
              <span style={{ background: 'linear-gradient(135deg, #06B6D4, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Instant Foot Crew & Pickup Van Dispatch.
              </span>
            </h2>

            <p style={{
              color: '#475569',
              fontSize: '0.95rem',
              lineHeight: 1.65,
              marginBottom: '24px',
              fontWeight: 500
            }}>
              Instead of burdening municipal budgets with expensive rovers or IoT hardware, GridShift AI combines citizen camera reports and permit data to dispatch existing municipal sanitation staff on foot or in small pickup vans right where they are needed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {[
                'Real-time Waste Classification: Recyclables, Organics, C&D Rubble',
                'Zero-extra-cost routing for Ward Sanitation Staff (On Foot) & Pickup Vans',
                'Geotagged heatmaps mapped directly onto Madgaon Municipal GIS'
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#1E293B', fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="#06B6D4" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                to="/dashboard"
                className="btn btn-navy"
                style={{ padding: '12px 22px', fontSize: '0.86rem', gap: '6px' }}
              >
                <Eye size={15} />
                Inspect Live Heatmap
              </Link>
              <Link
                to="/fleet"
                className="btn btn-outline"
                style={{ padding: '12px 20px', fontSize: '0.86rem' }}
              >
                Fleet Telemetry
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10, width: '100%' }} className="spotlight-img-area">
            <div style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 16px 40px -8px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              position: 'relative'
            }}>
              <img
                src="/street-detection.jpg"
                alt="AI Street Vision Object Detection"
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '340px', objectFit: 'cover' }}
              />

              {/* Location tag */}
              <div style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                LOCATION: BAYSHORE AVE
              </div>

              {/* Detection info overlay */}
              <div style={{
                position: 'absolute',
                bottom: '14px',
                left: '14px',
                background: 'rgba(15, 23, 42, 0.90)',
                backdropFilter: 'blur(12px)',
                color: 'white',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '11px',
                lineHeight: 1.5,
                border: '1px solid rgba(6, 182, 212, 0.20)'
              }}>
                <div style={{ color: '#06B6D4', fontWeight: 800, marginBottom: '2px' }}>OBJECT ID: DEBRIS-042</div>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>TYPE: RECYCLABLE (98.4%)</div>
                <div style={{ color: '#22c55e', fontSize: '10px', fontWeight: 600 }}>DISPATCH: PICKUP VAN V-102 & FOOT CREW</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. COMMERCIAL KITCHENS & IoT SPOTLIGHT
          ═══════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1280px', margin: '0 auto 56px auto' }}>
        <div className="gs-card spotlight-card spotlight-reverse">
          {/* Ambient glow */}
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            right: '-40px',
            width: '280px',
            height: '280px',
            backgroundColor: 'rgba(5, 150, 105, 0.06)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none'
          }} />

          {/* Left Text */}
          <div style={{ flex: 1, zIndex: 10 }} className="spotlight-text-area">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              backgroundColor: 'rgba(5, 150, 105, 0.08)',
              color: '#059669',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(5, 150, 105, 0.15)'
            }}>
              <Cpu size={14} color="#059669" />
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}>
                SOFTWARE-FIRST MUNICIPAL INTELLIGENCE
              </span>
            </div>

            <h2 style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              color: '#0F172A',
              lineHeight: 1.15,
              marginBottom: '16px',
              letterSpacing: '-0.03em'
            }}>
              Zero Hardware Burden.<br />
              <span style={{ color: '#059669' }}>From Market to Curbside.</span>
            </h2>

            <p style={{
              color: '#475569',
              fontSize: '0.95rem',
              lineHeight: 1.65,
              marginBottom: '24px',
              fontWeight: 500
            }}>
              Commercial hospitality and market hubs generate massive volumes of perishable organics. GridShift AI correlates municipal permits, market schedules, and citizen reports—dispatching existing municipal pickup vans and foot crews with ₹0 extra hardware cost.
            </p>

            {/* Stats mini-grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '28px'
            }}>
              {[
                { value: '42%', label: 'Fuel Saved', color: '#0F172A' },
                { value: '0', label: 'Overflow Events', color: '#059669' },
                { value: '3.4x', label: 'Faster Turnaround', color: '#0F172A' }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'rgba(15, 23, 42, 0.03)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <Link
              to="/analytics"
              className="btn btn-navy"
              style={{ padding: '12px 22px', fontSize: '0.86rem', gap: '6px' }}
            >
              <BarChart3 size={15} />
              View Organics Analytics
            </Link>
          </div>

          {/* Right Image */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10, width: '100%' }} className="spotlight-img-area">
            <div style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 16px 40px -8px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              position: 'relative'
            }}>
              <img
                src="/iot-organics.jpg"
                alt="Commercial Kitchen Organics Smart IoT Bin"
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '340px', objectFit: 'cover' }}
              />

              <div style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                COMMERCIAL ORGANICS NODE
              </div>

              <div style={{
                position: 'absolute',
                bottom: '14px',
                right: '14px',
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(12px)',
                color: 'white',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '11px',
                lineHeight: 1.5,
                border: '1px solid rgba(217, 119, 6, 0.25)'
              }}>
                <div style={{ color: '#F59E0B', fontWeight: 800, marginBottom: '2px' }}>⚠ SURGE ALERT: 90% FULL</div>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>NODE ID: GW134 (KITCHEN BAY 2)</div>
                <div style={{ color: '#22c55e', fontSize: '10px', fontWeight: 600 }}>AI OPTIMIZED ROUTE QUEUED</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. CORE AI MODULES & CAPABILITIES GRID
          ═══════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1280px', margin: '0 auto 56px auto' }}>
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            Core AI Modules & <span style={{ background: 'linear-gradient(135deg, #06B6D4, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Platform Capabilities</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', margin: '0 auto' }}>
            Modular intelligence engineered for municipal sanitation divisions, facility managers, and smart city operators.
          </p>
        </div>

        <div className="three-col-grid">
          {[
            {
              icon: <Layers size={24} />,
              iconBg: 'rgba(6, 182, 212, 0.10)',
              iconColor: '#0891B2',
              title: 'Micro-Surge Forecasting',
              desc: 'XGBoost and neural models correlate building permits, weather patterns, and historical disposal cycles to forecast volume spikes up to 48 hours in advance.',
              link: '/analytics',
              linkText: 'Explore Forecasting'
            },
            {
              icon: <Truck size={24} />,
              iconBg: 'rgba(14, 165, 233, 0.10)',
              iconColor: '#0284C7',
              title: 'Autonomous Fleet Routing',
              desc: 'Dynamic GPS waypoints automatically reroute municipal compactor trucks and sidewalk sweepers directly to critical load zones, cutting dead mileage.',
              link: '/fleet',
              linkText: 'Manage Fleet'
            },
            {
              icon: <MapPin size={24} />,
              iconBg: 'rgba(217, 119, 6, 0.08)',
              iconColor: '#D97706',
              title: '3D Spatial Hexagon Grids',
              desc: 'DeckGL-powered H3 geospatial pillars provide intuitive visualization of waste accumulation rates for optimized bin placement decisions.',
              link: '/dashboard',
              linkText: 'Open Spatial Map'
            }
          ].map((card, i) => (
            <div key={i} className="gs-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: card.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
                color: card.iconColor
              }}>
                {card.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                {card.title}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.86rem', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                {card.desc}
              </p>
              <Link
                to={card.link}
                className="btn btn-navy"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '11px',
                  fontSize: '0.84rem'
                }}
              >
                {card.linkText} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. RESILIENCE PILLARS BANNER
          ═══════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1280px', margin: '0 auto 56px auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
          borderRadius: '16px',
          padding: '44px 32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.40)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Ambient Glows */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '300px',
            height: '300px',
            background: 'rgba(6, 182, 212, 0.15)',
            filter: 'blur(80px)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            left: '-50px',
            width: '300px',
            height: '300px',
            background: 'rgba(14, 165, 233, 0.10)',
            filter: 'blur(80px)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto', position: 'relative', zIndex: 10 }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.08)',
              color: '#7DD3FC',
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              padding: '6px 14px',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              marginBottom: '14px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              MUNICIPAL RESILIENCE & UPTIME
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              Built For Zero-Latency Operations.
            </h2>
            <p style={{ color: 'rgba(203, 213, 225, 0.7)', fontSize: '0.92rem', marginTop: '10px', fontWeight: 500 }}>
              End-to-end reliability from IoT bin telematics to cloud machine learning and autonomous dispatch.
            </p>
          </div>

          {/* 3 Pillars */}
          <div className="three-col-grid" style={{ position: 'relative', zIndex: 10 }}>
            {[
              {
                icon: <Zap size={24} />,
                iconBg: 'rgba(6, 182, 212, 0.15)',
                iconBorder: 'rgba(6, 182, 212, 0.3)',
                iconColor: '#67E8F9',
                title: '15-Second Telemetry',
                desc: 'Edge-processed sensor events stream over cellular LoRaWAN to maintain sub-second updates without network bottleneck.'
              },
              {
                icon: <Activity size={24} />,
                iconBg: 'rgba(14, 165, 233, 0.15)',
                iconBorder: 'rgba(14, 165, 233, 0.3)',
                iconColor: '#7DD3FC',
                title: 'Predictive Reroutes',
                desc: 'Continuous algorithmic simulation generates dynamic waypoint updates as soon as trash capacity reaches 80%.'
              },
              {
                icon: <ShieldCheck size={24} />,
                iconBg: 'rgba(168, 85, 247, 0.12)',
                iconBorder: 'rgba(168, 85, 247, 0.25)',
                iconColor: '#C4B5FD',
                title: 'End-to-End Encrypted',
                desc: 'AES-256 encrypted payload channels for municipal compliance and secure data governance.'
              }
            ].map((pillar, i) => (
              <div key={i} style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '28px 20px',
                textAlign: 'center',
                transition: 'all 0.3s'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: pillar.iconBg,
                  border: `1px solid ${pillar.iconBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: pillar.iconColor
                }}>
                  {pillar.icon}
                </div>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>
                  {pillar.title}
                </h3>
                <p style={{ color: 'rgba(203, 213, 225, 0.6)', fontSize: '0.84rem', lineHeight: 1.55 }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. LIVE SYSTEM TICKER
          ═══════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1280px', margin: '0 auto 56px auto', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
            LIVE STREAM PULSE
          </span>
        </div>
        <div style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          padding: '12px 0',
          background: 'rgba(255, 255, 255, 0.60)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(15, 23, 42, 0.04)'
        }}>
          {/* Gradient Edges */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to right, var(--gs-bg), transparent)', zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to left, var(--gs-bg), transparent)', zIndex: 10 }} />

          <div className="animate-scroll" style={{ display: 'flex', gap: '14px', padding: '0 16px' }}>
            {marqueeItems.concat(marqueeItems).map((text, idx) => (
              <div
                key={idx}
                style={{
                  flexShrink: 0,
                  backgroundColor: 'white',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
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

      {/* ═══════════════════════════════════════════════════════════
          8. QUICK DISPATCH CTA
          ═══════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 56px auto' }}>
        <div className="gs-card" style={{
          padding: '44px 24px',
          textAlign: 'center',
          boxShadow: 'var(--gs-shadow-lg)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            background: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',
            color: 'white',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.30)',
            transform: 'rotate(-3deg)'
          }}>
            <Sparkles size={26} />
          </div>

          <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F172A', marginBottom: '10px', letterSpacing: '-0.02em' }}>
            Ready to Monitor Urban Micro-Surges?
          </h2>

          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 28px auto', fontWeight: 500 }}>
            Inspect real-time 3D hexagonal density layers, manage municipal vehicle telemetry, and track commercial diversion rates.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/dashboard"
              className="btn btn-cta-gradient"
              style={{
                padding: '14px 28px',
                fontSize: '0.92rem',
                gap: '8px'
              }}
            >
              Launch Live Grid Map
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/fleet"
              className="btn btn-outline"
              style={{
                padding: '14px 24px',
                fontSize: '0.92rem'
              }}
            >
              View Fleet Dispatches
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          9. FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <footer style={{
        maxWidth: '1280px',
        margin: '0 auto',
        paddingTop: '24px',
        borderTop: '1px solid rgba(15, 23, 42, 0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/favicon.jpg" alt="GridShift-AI" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
          <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem', letterSpacing: '-0.02em' }}>GridShift AI</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>
          <Link to="/" style={{ color: '#0F172A', textDecoration: 'none' }}>Home</Link>
          <Link to="/dashboard" style={{ color: '#64748b', textDecoration: 'none' }}>Live Grid</Link>
          <Link to="/fleet" style={{ color: '#64748b', textDecoration: 'none' }}>Fleet</Link>
          <Link to="/analytics" style={{ color: '#64748b', textDecoration: 'none' }}>Analytics</Link>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
          &copy; 2026 GridShift AI Platform. Autonomous Waste Management Intelligence.
        </div>
      </footer>

    </div>
  );
}

export default Home;
