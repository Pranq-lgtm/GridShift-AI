import { useState } from 'react';
import { Link } from 'react-router-dom';
import { scrollToTop } from '../components/ScrollToTop';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Globe,
  Cpu,
  Truck,
  CheckCircle2,
  Lock,
  FileText,
  Send,
  ArrowLeft,
  Users,
  Zap
} from 'lucide-react';
import { ADMIN_EMAIL, BACKEND_API_URL } from '../firebase';
import '../index.css';

function PageFooterLinks() {
  return (
    <div
      style={{
        marginTop: '36px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.82rem',
        fontWeight: 700
      }}
    >
      <Link to="/" onClick={scrollToTop} style={{ color: '#092C5E', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={14} /> Back to Overview
      </Link>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link to="/about" onClick={scrollToTop} style={{ color: '#475569', textDecoration: 'none' }}>About Us</Link>
        <Link to="/contact" onClick={scrollToTop} style={{ color: '#475569', textDecoration: 'none' }}>Contact Us</Link>
        <Link to="/privacy" onClick={scrollToTop} style={{ color: '#475569', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link to="/terms" onClick={scrollToTop} style={{ color: '#475569', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
        <Link to="/email-agent" onClick={scrollToTop} style={{ color: '#0891B2', textDecoration: 'none' }}>Nitrosend Email Hub</Link>
      </div>
    </div>
  );
}

export function AboutUsPage() {
  return (
    <div className="page-container">
      <div className="ios-card" style={{ padding: 'clamp(18px, 4vw, 32px)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(6, 182, 212, 0.10)',
            color: '#0891B2',
            padding: '5px 12px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '12px'
          }}
        >
          <Globe size={13} /> ABOUT GRIDSHIFT-AI • UN SDG 11.6 & 12
        </div>

        <h1 className="page-title" style={{ marginBottom: '10px' }}>
          Zero-Capex Predictive Waste Intelligence for Modern Municipalities
        </h1>
        <p style={{ fontSize: '0.96rem', color: '#475569', lineHeight: 1.65, marginBottom: '24px' }}>
          <strong>GridShift-AI</strong> is a software-first micro-surge waste forecasting and closed-loop citizen redressal platform engineered for municipal sanitation departments. Centered on our flagship pilot in <strong>Madgaon (Margao), Goa</strong>, GridShift-AI correlates real-time city permit data, <strong>Google Maps Platform</strong> 3D spatial density layers, <strong>XGBoost</strong> machine learning, <strong>Google Gemini 3.8 Flash</strong> (with <strong>Gemini 3.5 Flash-Lite</strong> fallback), and the <strong>Nitrosend AI Email Agent</strong> to prevent urban waste overflows without burdening municipal budgets by a single rupee on expensive IoT sensors or autonomous rovers.
        </p>

        <div className="redressal-admin-grid" style={{ marginBottom: '24px' }}>
          <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#092C5E', fontSize: '1.05rem', fontWeight: 800 }}>
              🚶 Zero-Hardware Municipal Dispatch Model
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569', lineHeight: 1.6 }}>
              Instead of requiring costly hardware deployments, GridShift-AI routes existing <strong>Municipal Sanitation Staff (on foot — Ward Beat Crews)</strong>, <strong>Small Pickup Vans (V-102, V-104)</strong>, and heavy <strong>Compactor Trucks (T-402, T-304)</strong> to the exact GPS coordinates where surges or citizen incidents occur.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#092C5E', fontSize: '1.05rem', fontWeight: 800 }}>
              ⭐ Closed-Loop Citizen SLA Redressal
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569', lineHeight: 1.6 }}>
              Every live camera waste report generates a geotagged MongoDB ticket in the <code>tickets</code> collection with a 4h–48h SLA target, dispatches a <strong>Nitrosend transactional receipt</strong>, and requires citizen 1–5 star verification to close—automatically reopening if rated ≤ 2 stars.
            </p>
          </div>
        </div>

        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#0f172a', color: 'white' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#67e8f9', textTransform: 'uppercase', marginBottom: '6px' }}>
            PLATFORM LEADERSHIP & ARCHITECTURE TEAM (ASSASSIN CODER&apos;S)
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 900 }}>
            Pranav Kantak — Lead Architect & Platform Administrator
          </h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
            Responsible for full-stack system architecture, Google Maps 3D geospatial layers, XGBoost + Gemini 3.8 Flash AI Copilot, Firebase RBAC, and Nitrosend Email Agent integration.
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.84rem', fontWeight: 700, color: '#4ade80' }}>
            <span>📧 {ADMIN_EMAIL}</span>
            <span>📞 +91 7219341650</span>
            <span>📍 Madgaon, Goa, India</span>
          </div>
        </div>

        <PageFooterLinks />
      </div>
    </div>
  );
}

export function ContactUsPage() {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [topic, setTopic] = useState('Municipal Ward SLA Escalation');
  const [message, setMessage] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState('');

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!senderEmail.trim() || !message.trim()) return;

    const receipt = {
      id: `ns-contact-${Date.now()}`,
      recipient: senderEmail.trim(),
      type: 'Contact Inquiry Receipt',
      subject: `[GridShift-AI] Inquiry Received: ${topic}`,
      status: 'Delivered',
      timestamp: new Date().toLocaleString(),
      preview: `Hi ${senderName || 'Citizen'}, your message ("${message.trim().slice(0, 90)}") has been routed via Nitrosend Email Agent to Platform Admin Pranav Kantak (${ADMIN_EMAIL} | +91 7219341650).`
    };

    try {
      const existing = JSON.parse(localStorage.getItem('gridshift_nitrosend_logs') || '[]');
      localStorage.setItem('gridshift_nitrosend_logs', JSON.stringify([receipt, ...existing].slice(0, 50)));
      window.dispatchEvent(new CustomEvent('nitrosendLogAdded', { detail: receipt }));
    } catch {
      // ignore
    }

    fetch(`${BACKEND_API_URL}/api/nitrosend/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject: `[Contact Inquiry] ${topic} from ${senderName} (${senderEmail})`,
        body: `Phone: ${senderPhone}\nMessage: ${message}`,
        sender: senderEmail
      })
    }).catch(() => {});

    setSubmittedMsg(
      `Thank you, ${senderName || 'Citizen'}! Your inquiry has been dispatched via the Nitrosend Email Agent to Admin (${ADMIN_EMAIL} | +91 7219341650) and logged in your Transactional Receipts.`
    );
    setSenderName('');
    setSenderEmail('');
    setSenderPhone('');
    setMessage('');
  };

  return (
    <div className="page-container">
      <div className="ios-card" style={{ padding: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(22, 163, 74, 0.10)',
            color: '#15803d',
            padding: '5px 12px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '12px'
          }}
        >
          <Phone size={13} /> MUNICIPAL COMMAND & ADMIN CONTACT DESK
        </div>

        <h1 className="page-title" style={{ marginBottom: '8px' }}>
          Contact Us — GridShift-AI Administration
        </h1>
        <p style={{ fontSize: '0.92rem', color: '#475569', marginBottom: '24px' }}>
          Reach out directly to the GridShift-AI Platform Administrator for municipal onboarding, SLA escalations, API integrations, or Nitrosend email communications.
        </p>

        <div className="redressal-admin-grid">
          {/* Left: Official Admin Contact Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#092C5E', color: 'white' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                DESIGNATED PLATFORM ADMINISTRATOR
              </span>
              <h3 style={{ margin: '6px 0 4px 0', fontSize: '1.25rem', fontWeight: 900 }}>
                Pranav Kantak
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#cbd5e1' }}>
                Team Lead — ASSASSIN CODER&apos;S • Municipal Sanitation Intelligence Division
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <a
                  href={`mailto:${ADMIN_EMAIL}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    fontWeight: 700
                  }}
                >
                  <Mail size={17} color="#4ade80" />
                  <div>
                    <div style={{ fontSize: '10px', color: '#93c5fd', textTransform: 'uppercase' }}>Administrator Email</div>
                    <div style={{ wordBreak: 'break-all' }}>{ADMIN_EMAIL}</div>
                  </div>
                </a>

                <a
                  href="tel:+917219341650"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    fontWeight: 700
                  }}
                >
                  <Phone size={17} color="#4ade80" />
                  <div>
                    <div style={{ fontSize: '10px', color: '#93c5fd', textTransform: 'uppercase' }}>Administrator Direct Phone / Helpline</div>
                    <div>+91 7219341650</div>
                  </div>
                </a>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    fontWeight: 600
                  }}
                >
                  <MapPin size={17} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: '10px', color: '#93c5fd', textTransform: 'uppercase' }}>Command Grid Jurisdiction</div>
                    <div>Madgaon Municipal Council Sector, Margao, South Goa — 403601</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Direct Inquiry Form via Nitrosend Agent */}
          <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#092C5E' }}>
              Send Direct Message via Nitrosend Agent
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Your Full Name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                required
                style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <input
                type="email"
                placeholder="Your Email Address"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                required
                style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="tel"
                placeholder="Phone (e.g., +91 98XXXXXXXX)"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
              >
                <option value="Municipal Ward SLA Escalation">Municipal Ward SLA Escalation</option>
                <option value="Citizen Redressal & Verification Support">Citizen Redressal Support</option>
                <option value="Commercial / Event Permit Forecast">Commercial / Event Permit Forecast</option>
                <option value="Nitrosend Email Agent & API Integration">Nitrosend Email Agent Inquiry</option>
              </select>
            </div>

            <textarea
              rows={4}
              placeholder="Write your message or ticket inquiry for Admin Pranav Kantak..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
            />

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem' }}>
              <Send size={15} /> Dispatch Inquiry to Admin ({ADMIN_EMAIL})
            </button>

            {submittedMsg && (
              <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.8rem', fontWeight: 700 }}>
                ✓ {submittedMsg}
              </div>
            )}
          </form>
        </div>

        <PageFooterLinks />
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="page-container">
      <div className="ios-card" style={{ padding: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(9, 44, 94, 0.08)',
            color: '#092C5E',
            padding: '5px 12px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '12px'
          }}
        >
          <Lock size={13} /> PRIVACY POLICY • EFFECTIVE NOVEMBER 2026
        </div>

        <h1 className="page-title" style={{ marginBottom: '12px' }}>
          Privacy Policy & Municipal Data Governance
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
          GridShift-AI is committed to protecting citizen privacy, securing municipal telemetry, and providing transparent data ownership across all web and mobile interfaces.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.86rem', color: '#334155', lineHeight: 1.65 }}>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#092C5E', fontSize: '0.98rem', fontWeight: 800 }}>
              1. Live Camera Incident Capture & Geotagging
            </h3>
            <p style={{ margin: 0 }}>
              When you report a waste incident, GridShift-AI accesses your live device camera stream and GPS coordinates solely to pin the incident to the Madgaon Municipal Ward Grid and verify authentic field conditions. Local file explorer uploads on desktop are disabled to prevent spoofed metadata. Captured thumbnails are compressed (≤ 480px) and stored in the MongoDB <code>tickets</code> collection for municipal cleanup verification.
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#092C5E', fontSize: '0.98rem', fontWeight: 800 }}>
              2. Authentication & Role-Based Access Control (RBAC)
            </h3>
            <p style={{ margin: 0 }}>
              Authentication is processed via Google Firebase Authentication (supporting Google OAuth, Email/Password, and +91 Mobile SMS OTP). Administrative dispatch privileges are strictly restricted to verified municipal administrator credentials (<code>{ADMIN_EMAIL}</code> and <code>+91 7219341650</code>).
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#092C5E', fontSize: '0.98rem', fontWeight: 800 }}>
              3. Nitrosend Email Agent & User Preference Center
            </h3>
            <p style={{ margin: 0 }}>
              Transactional receipts (SLA ticket creation, cleanup verification, password resets) and optional civic surge alerts are managed by the Nitrosend Email Agent. Users have full visibility into their personal transactional logs and can opt in or opt out of any notification category at any time via the <Link to="/email-agent" style={{ color: '#0284c7', fontWeight: 700 }}>Nitrosend Preferences Center</Link>.
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#092C5E', fontSize: '0.98rem', fontWeight: 800 }}>
              4. Data Protection Contact
            </h3>
            <p style={{ margin: 0 }}>
              For data export, deletion requests, or privacy inquiries, contact Platform Administrator <strong>Pranav Kantak</strong> at <strong>{ADMIN_EMAIL}</strong> or <strong>+91 7219341650</strong>.
            </p>
          </div>
        </div>

        <PageFooterLinks />
      </div>
    </div>
  );
}

export function TermsAndConditionsPage() {
  return (
    <div className="page-container">
      <div className="ios-card" style={{ padding: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(9, 44, 94, 0.08)',
            color: '#092C5E',
            padding: '5px 12px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '12px'
          }}
        >
          <FileText size={13} /> TERMS & CONDITIONS • VERSION 1.3.0
        </div>

        <h1 className="page-title" style={{ marginBottom: '12px' }}>
          Terms and Conditions of Use
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
          By accessing or using the GridShift-AI Municipal Sanitation Portal (<code>https://gridshift-ai.web.app/</code>), you agree to the following operational terms and civic reporting guidelines.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.86rem', color: '#334155', lineHeight: 1.65 }}>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#092C5E', fontSize: '0.98rem', fontWeight: 800 }}>
              1. Authentic Live Citizen Waste Reporting
            </h3>
            <p style={{ margin: 0 }}>
              Citizens and ward operators must submit accurate, live-captured photographs of genuine municipal waste incidents. Submitting falsified, pre-downloaded, or non-municipal imagery is prohibited and blocked by the desktop live webcam enforcement policy.
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#092C5E', fontSize: '0.98rem', fontWeight: 800 }}>
              2. SLA Timelines & Zero-Capex Crew Allocation
            </h3>
            <p style={{ margin: 0 }}>
              Target SLA windows (Critical: 4h, High: 12h, Medium: 24h, Low: 48h) guide the dispatch of existing Municipal Sanitation Staff (on foot), Small Pickup Vans (V-102, V-104), and Compactor Trucks. Citizen 1–5 star verification ratings govern final ticket closure or automatic escalation.
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#092C5E', fontSize: '0.98rem', fontWeight: 800 }}>
              3. Nitrosend Email Communications & Approval Gate
            </h3>
            <p style={{ margin: 0 }}>
              Automated email campaigns drafted by the AI Copilot require review and approval in the Nitrosend Admin Approval Gate prior to broadcast. Transactional receipts for ticket creation and security events are delivered automatically.
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#092C5E', fontSize: '0.98rem', fontWeight: 800 }}>
              4. Administrative Governance & Contact
            </h3>
            <p style={{ margin: 0 }}>
              Platform administration is governed by <strong>Pranav Kantak</strong> (Email: <strong>{ADMIN_EMAIL}</strong> • Phone: <strong>+91 7219341650</strong>). Licensed under the MIT License.
            </p>
          </div>
        </div>

        <PageFooterLinks />
      </div>
    </div>
  );
}
