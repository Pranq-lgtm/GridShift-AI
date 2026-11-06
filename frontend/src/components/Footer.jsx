import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Sparkles,
  Zap,
  Radio,
  FileText,
  Lock,
  Layers,
  Heart
} from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#092C5E',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(34, 197, 94, 0.08) 0%, transparent 45%)
        `,
        color: '#ffffff',
        borderTop: '1px solid rgba(255, 255, 255, 0.10)',
        marginTop: 'auto',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '48px 24px 28px 24px'
        }}
      >
        {/* Top Banner: Status & Mission */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '32px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            marginBottom: '36px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/favicon.jpg"
              alt="GridShift Logo"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                padding: '2px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  GridShift-AI
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: 'rgba(34, 197, 94, 0.18)',
                    color: '#4ade80',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(34, 197, 94, 0.35)'
                  }}
                >
                  v1.3.0 PROD
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#93c5fd', fontWeight: 500 }}>
                Autonomous Municipal Sanitation & Micro-Surge Waste Intelligence Platform
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#e2e8f0'
              }}
            >
              <Radio size={13} color="#4ade80" className="pulse-dot" />
              <span>Pilot Active: Madgaon Municipal Council, Goa</span>
            </div>

            <Link
              to="/email-agent"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(6, 182, 212, 0.20)',
                color: '#67e8f9',
                padding: '6px 14px',
                borderRadius: '9999px',
                border: '1px solid rgba(6, 182, 212, 0.40)',
                fontSize: '0.78rem',
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              <Zap size={13} />
              <span>Nitrosend Telemetry Active</span>
            </Link>
          </div>
        </div>

        {/* 4-Column Structured Content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '36px',
            marginBottom: '40px'
          }}
        >
          {/* Col 1: Platform Overview */}
          <div>
            <h4
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#67e8f9',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 16px 0'
              }}
            >
              About the Platform
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.65, margin: '0 0 16px 0' }}>
              GridShift-AI is a software-first civic engineering initiative eliminating urban waste overflows using real-time commercial permits, Google Maps 3D spatial telemetry, and XGBoost + Gemini 3.8 Flash AI Copilot without hardware CapEx.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#93c5fd' }}>
              <div>• Zero Municipal Hardware Capex</div>
              <div>• Closed-Loop Citizen Redressal SLA</div>
              <div>• Automated Nitrosend Communications</div>
            </div>
          </div>

          {/* Col 2: Navigation Modules */}
          <div>
            <h4
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#67e8f9',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 16px 0'
              }}
            >
              Operational Modules
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <Link to="/" style={{ color: '#ffffff', textDecoration: 'none', transition: 'color 0.2s' }}>
                Overview Command Center
              </Link>
              <Link to="/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Live 3D Grid & Micro-Surge Map
              </Link>
              <Link to="/redressal" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Citizen Redressal & Verification SLA
              </Link>
              <Link to="/fleet" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Staff & Waste Pickup Van Dispatch
              </Link>
              <Link to="/analytics" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Predictive Surge Analytics
              </Link>
              <Link to="/email-agent" style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 700 }}>
                Nitrosend Autonomous Email Hub
              </Link>
            </div>
          </div>

          {/* Col 3: Governance & Legal */}
          <div>
            <h4
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#67e8f9',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 16px 0'
              }}
            >
              Governance & Policies
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <Link to="/about" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600 }}>
                About GridShift-AI
              </Link>
              <Link to="/contact" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600 }}>
                Contact Administration Desk
              </Link>
              <Link to="/privacy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Privacy & Data Governance Policy
              </Link>
              <Link to="/terms" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Terms & Municipal Conditions
              </Link>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#93c5fd' }}>
                <span>Certified Municipal SLA Compliance</span>
              </div>
            </div>
          </div>

          {/* Col 4: Command Administration */}
          <div>
            <h4
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#67e8f9',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 16px 0'
              }}
            >
              Municipal Command Support
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', color: '#cbd5e1' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#93c5fd', display: 'block', textTransform: 'uppercase' }}>
                  Platform Administrator
                </span>
                <strong style={{ color: '#ffffff' }}>Pranav Kantak</strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#93c5fd', display: 'block', textTransform: 'uppercase' }}>
                  Official Email (24h SLA)
                </span>
                <a
                  href="mailto:pranavkantak9@gmail.com"
                  style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 700 }}
                >
                  pranavkantak9@gmail.com
                </a>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#93c5fd', display: 'block', textTransform: 'uppercase' }}>
                  Emergency Command Helpline
                </span>
                <a
                  href="tel:+917219341650"
                  style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 700 }}
                >
                  +91 7219341650
                </a>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                Madgaon Municipal Council Sector, Margao, South Goa — 403601
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Security Pill */}
        <div
          style={{
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.10)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '0.78rem',
            color: '#94a3b8'
          }}
        >
          <div>
            &copy; 2026 GridShift-AI Platform. Engineered by ASSASSIN CODER&apos;S. All rights reserved.
          </div>

          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', fontWeight: 600 }}>
            <Link to="/about" style={{ color: '#cbd5e1', textDecoration: 'none' }}>About</Link>
            <Link to="/contact" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Contact</Link>
            <Link to="/privacy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
            <Link to="/email-agent" style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 700 }}>Nitrosend Hub</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
