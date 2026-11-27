import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Brain,
  Lightbulb,
  BarChart3,
  Activity,
  ScanEye,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Cpu,
  Database
} from 'lucide-react';
import { BACKEND_API_URL, isAdminUser } from '../firebase';
import {
  INITIAL_VISION_MODEL_STATE,
  applyHumanVerificationLabel,
  recommendMunicipalUnit,
  runIncrementalTrainingEpoch
} from '../utils/visionTrainingEngine';

const weeklyData = [
  { name: 'Mon', tonnage: 140, predicted: 150 },
  { name: 'Tue', tonnage: 130, predicted: 135 },
  { name: 'Wed', tonnage: 155, predicted: 160 },
  { name: 'Thu', tonnage: 170, predicted: 165 },
  { name: 'Fri', tonnage: 210, predicted: 220 },
  { name: 'Sat', tonnage: 280, predicted: 275 },
  { name: 'Sun', tonnage: 250, predicted: 260 }
];

const accuracyData = [
  { name: 'Mon', accuracy: 93.2, baseline: 85 },
  { name: 'Tue', accuracy: 96.1, baseline: 85 },
  { name: 'Wed', accuracy: 94.8, baseline: 85 },
  { name: 'Thu', accuracy: 97.3, baseline: 85 },
  { name: 'Fri', accuracy: 95.5, baseline: 85 },
  { name: 'Sat', accuracy: 98.2, baseline: 85 },
  { name: 'Sun', accuracy: 96.8, baseline: 85 }
];

const CustomTooltipBar = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
        }}
      >
        <p
          style={{
            color: '#94A3B8',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          {label}
        </p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: '0.85rem', fontWeight: 600, margin: '2px 0' }}>
            {entry.name}: {entry.value}{' '}
            {entry.name === 'Actual Tonnage' || entry.name === 'AI Prediction' ? 'tons' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltipLine = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
        }}
      >
        <p
          style={{
            color: '#94A3B8',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          {label}
        </p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: '0.85rem', fontWeight: 600, margin: '2px 0' }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function buildVisionApiUrl(path) {
  return BACKEND_API_URL ? `${BACKEND_API_URL}${path}` : path;
}

async function fetchJsonSafe(url, options) {
  const res = await fetch(url, options);
  const text = (await res.text()).trim();
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!res.ok || !text || text.startsWith('<') || contentType.includes('text/html')) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function loadPersistedVerdicts() {
  try {
    const raw = JSON.parse(localStorage.getItem('gridshift_vision_verdicts') || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function savePersistedVerdict(key, verdict) {
  try {
    const current = loadPersistedVerdicts();
    current[key] = verdict;
    localStorage.setItem('gridshift_vision_verdicts', JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

function buildMergedVisionSamples(serverSamples = []) {
  const verdicts = loadPersistedVerdicts();
  const byKey = new Map();

  const normalizeKey = (s) => s.ticketId || s.id;

  const upsert = (raw) => {
    if (!raw || !raw.id) return;
    const key = normalizeKey(raw);
    const existing = byKey.get(key) || byKey.get(raw.id);
    const verdict = verdicts[raw.id] || (raw.ticketId ? verdicts[raw.ticketId] : null);
    const merged = {
      ...(existing || {}),
      ...raw,
      imagePreview: raw.imagePreview || existing?.imagePreview || undefined,
      ticketId: raw.ticketId || existing?.ticketId,
      ...(verdict
        ? {
            isWasteDetected: !verdict.confirmedFalseReport,
            aiDetectedCategory: verdict.confirmedFalseReport ? 'No Waste / False Report' : verdict.confirmedLabel,
            confirmedLabel: verdict.confirmedLabel,
            confirmedFalseReport: verdict.confirmedFalseReport,
            adminVerdict: verdict.confirmedFalseReport ? 'MARKED_FALSE' : 'CONFIRMED_WASTE',
            trainingStatus: verdict.confirmedFalseReport ? 'BLOCKED_FALSE_REPORT' : 'VERIFIED_IN_DATASET'
          }
        : {})
    };
    byKey.set(key, merged);
    if (merged.id !== key) {
      byKey.delete(merged.id);
    }
  };

  // 1. Seed with server/default samples
  (serverSamples || []).forEach(upsert);

  // 2. Merge locally persisted VisionNet scans
  try {
    const localSamples = JSON.parse(localStorage.getItem('gridshift_vision_samples') || '[]');
    if (Array.isArray(localSamples)) {
      localSamples.forEach(upsert);
    }
  } catch {
    // ignore
  }

  // 3. Merge citizen tickets (ensures flagged tickets like TKT-2026-1516 always appear with their real photo)
  try {
    const tickets = JSON.parse(localStorage.getItem('gridshift_redressal_tickets') || '[]');
    if (Array.isArray(tickets)) {
      tickets.forEach((t) => {
        if (!t || !t.id) return;
        const isHeldForAudit =
          String(t.assignedUnit || '').toLowerCase().includes('visual audit') ||
          String(t.description || '').toLowerCase().includes('no waste / false report') ||
          String(t.adminNotes || '').toLowerCase().includes('false report');
        const hasCustomPhoto = Boolean(t.photo && t.photo !== '/street-detection.jpg');
        if (!t.visionVerification && !isHeldForAudit && !hasCustomPhoto) return;

        const v = t.visionVerification || {};
        const sampleId = v.sampleId || `VS-${t.id.replace(/^TKT-/, '')}`;
        const isWaste = typeof v.isWasteDetected === 'boolean' ? v.isWasteDetected : !isHeldForAudit;
        upsert({
          id: sampleId,
          ticketId: t.id,
          createdAt: t.createdAt || new Date().toISOString(),
          ward: t.ward || 'Ward 7 — Margao Central Market',
          imagePreview: t.photo || undefined,
          citizenCategory: t.category || 'Construction Debris',
          citizenSeverity: t.severity || 'High',
          aiDetectedCategory: v.detectedCategory || (isWaste ? t.category || 'Illegal Curbside Dump' : 'No Waste / False Report'),
          aiDetectedSeverity: v.detectedSeverity || t.severity || 'Low',
          isWasteDetected: isWaste,
          authenticityScore: v.authenticityScore ?? (isWaste ? 90 : 18),
          confidence: v.confidence ?? 92,
          discrepancyFlagged: Boolean(v.citizenDiscrepancy || isHeldForAudit),
          confirmedLabel: v.adminVerdict
            ? v.adminVerdict === 'MARKED_FALSE'
              ? 'No Waste / False Report'
              : t.category
            : null,
          confirmedFalseReport: v.adminVerdict ? v.adminVerdict === 'MARKED_FALSE' : null,
          adminVerdict: v.adminVerdict || null,
          trainingStatus: v.adminVerdict
            ? v.adminVerdict === 'MARKED_FALSE'
              ? 'BLOCKED_FALSE_REPORT'
              : 'VERIFIED_IN_DATASET'
            : isHeldForAudit
            ? 'QUEUED_FOR_TRAINING'
            : isWaste
            ? 'QUEUED_FOR_TRAINING'
            : 'BLOCKED_FALSE_REPORT',
          reasoning:
            v.reasoning ||
            t.description ||
            (isHeldForAudit
              ? `Flagged by GridShift-VisionNet as No Waste / False Report for ${t.id} — awaiting Admin visual confirmation.`
              : `Citizen photo report ${t.id} scanned at ${t.ward}.`)
        });
      });
    }
  } catch {
    // ignore
  }

  // Sort newest / pending-audit citizen samples first
  return Array.from(byKey.values()).sort((a, b) => {
    const aPending = a.ticketId && !a.adminVerdict ? 1 : 0;
    const bPending = b.ticketId && !b.adminVerdict ? 1 : 0;
    if (aPending !== bPending) return bPending - aPending;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

function syncVerdictToRedressalTicket(sample, confirmedLabel, confirmedFalseReport) {
  if (!sample?.ticketId) return;
  try {
    const raw = JSON.parse(localStorage.getItem('gridshift_redressal_tickets') || '[]');
    if (!Array.isArray(raw) || raw.length === 0) return;
    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let updatedTicket = null;
    const updatedTickets = raw.map((t) => {
      if (t.id !== sample.ticketId) return t;
      const nextCategory = confirmedFalseReport ? t.category : confirmedLabel || t.category;
      const nextStatus = confirmedFalseReport ? 'VERIFIED_CLOSED' : t.status === 'REPORTED' ? 'TRIAGED' : t.status;
      const nextUnit = confirmedFalseReport
        ? 'Rejected — Confirmed False Report by Admin (No Dispatch)'
        : String(t.assignedUnit || '').toLowerCase().includes('visual audit')
        ? recommendMunicipalUnit(nextCategory, t.severity || 'High')
        : t.assignedUnit;
      const note = confirmedFalseReport
        ? `Admin visual audit confirmed ${sample.id} is a False / Non-Waste Report. Ticket closed without truck dispatch.`
        : `Admin visual audit overrode AI flag on ${sample.id} and confirmed real ${nextCategory}. Ticket approved & dispatched to ${nextUnit}.`;
      updatedTicket = {
        ...t,
        category: nextCategory,
        status: nextStatus,
        assignedUnit: nextUnit,
        adminNotes: note,
        visionVerification: {
          ...(t.visionVerification || {}),
          sampleId: sample.id,
          isWasteDetected: !confirmedFalseReport,
          detectedCategory: confirmedFalseReport ? 'No Waste / False Report' : nextCategory,
          adminVerdict: confirmedFalseReport ? 'MARKED_FALSE' : 'CONFIRMED_WASTE'
        },
        history: [
          ...(t.history || []),
          {
            status: nextStatus,
            by: 'pranavkantak9@gmail.com (Admin Visual Audit)',
            note,
            timestamp: `Today, ${nowLabel}`
          }
        ]
      };
      return updatedTicket;
    });
    if (updatedTicket) {
      localStorage.setItem('gridshift_redressal_tickets', JSON.stringify(updatedTickets));
      window.dispatchEvent(new CustomEvent('redressalTicketUpdated', { detail: updatedTicket }));
    }
  } catch {
    // ignore storage errors
  }
}

function Analytics({ user }) {
  const isAdmin = isAdminUser(user);
  const [visionState, setVisionState] = useState(() => ({
    ...INITIAL_VISION_MODEL_STATE,
    samples: buildMergedVisionSamples(INITIAL_VISION_MODEL_STATE.samples)
  }));
  const [retraining, setRetraining] = useState(false);
  const [trainBanner, setTrainBanner] = useState('');

  const loadVisionStatus = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await fetchJsonSafe(buildVisionApiUrl('/api/vision/model-status'));
      if (data && typeof data.validationAccuracy === 'number') {
        setVisionState({
          ...data,
          samples: buildMergedVisionSamples(data.samples || INITIAL_VISION_MODEL_STATE.samples)
        });
        return;
      }
    } catch {
      // keep local merged state when offline
    }
    setVisionState((prev) => ({
      ...(prev || INITIAL_VISION_MODEL_STATE),
      samples: buildMergedVisionSamples(prev?.samples || INITIAL_VISION_MODEL_STATE.samples)
    }));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadVisionStatus();
    const handleSync = () => loadVisionStatus();
    window.addEventListener('citizenReportAdded', handleSync);
    window.addEventListener('visionSampleAdded', handleSync);
    window.addEventListener('redressalTicketUpdated', handleSync);
    return () => {
      window.removeEventListener('citizenReportAdded', handleSync);
      window.removeEventListener('visionSampleAdded', handleSync);
      window.removeEventListener('redressalTicketUpdated', handleSync);
    };
  }, [isAdmin, loadVisionStatus]);

  const handleLabelSample = async (sample, confirmedLabel, confirmedFalseReport) => {
    const sampleId = sample.id;
    const verdictPayload = {
      confirmedLabel,
      confirmedFalseReport: Boolean(confirmedFalseReport),
      updatedAt: new Date().toISOString()
    };

    // 1. Persist verdict locally so UI updates immediately and never resets on reload
    savePersistedVerdict(sampleId, verdictPayload);
    if (sample.ticketId) {
      savePersistedVerdict(sample.ticketId, verdictPayload);
    }

    // 2. Update React state immediately (optimistic & guaranteed responsive)
    setVisionState((prev) =>
      applyHumanVerificationLabel(prev || INITIAL_VISION_MODEL_STATE, sampleId, confirmedLabel, confirmedFalseReport)
    );

    // 3. Sync decision to linked Redressal ticket (e.g., TKT-2026-1516)
    syncVerdictToRedressalTicket(sample, confirmedLabel, confirmedFalseReport);

    const ticketSuffix = sample.ticketId
      ? confirmedFalseReport
        ? ` • Linked ticket ${sample.ticketId} closed as False Report.`
        : ` • Linked ticket ${sample.ticketId} approved & moved to TRIAGED queue.`
      : '';
    setTrainBanner(
      confirmedFalseReport
        ? `Marked ${sampleId} as False / Non-Waste Report and queued for active-learning negative training.${ticketSuffix}`
        : `Confirmed real waste ("${confirmedLabel}") for ${sampleId} and queued for active-learning training.${ticketSuffix}`
    );

    // 4. Sync with backend in background (without overwriting local merged samples)
    try {
      await fetchJsonSafe(buildVisionApiUrl('/api/vision/feedback-label'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId,
          confirmedLabel,
          confirmedFalseReport,
          sample
        })
      });
    } catch {
      // local state & localStorage already persisted
    }
  };

  const handleTriggerRetrain = async () => {
    setRetraining(true);
    setTrainBanner('');
    try {
      const data = await fetchJsonSafe(buildVisionApiUrl('/api/vision/retrain'), { method: 'POST' });
      if (data?.modelState) {
        setVisionState({
          ...data.modelState,
          samples: buildMergedVisionSamples(data.modelState.samples || visionState?.samples)
        });
        setTrainBanner(
          `Completed Epoch #${data.modelState.epoch} (${data.modelState.version}): ingested ${data.samplesTrainedThisEpoch} samples, validation accuracy +${data.accuracyDelta}% -> ${data.modelState.validationAccuracy}%.`
        );
      } else {
        const localRes = runIncrementalTrainingEpoch(visionState || INITIAL_VISION_MODEL_STATE);
        setVisionState(localRes.nextState);
        setTrainBanner(
          `Completed Epoch #${localRes.nextState.epoch} (${localRes.nextState.version}): ingested ${localRes.samplesTrainedThisEpoch} samples, validation accuracy +${localRes.accuracyDelta}% -> ${localRes.nextState.validationAccuracy}%.`
        );
      }
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div
      className="page-container"
      style={{ padding: '28px 32px', minHeight: '100%', width: '100%', boxSizing: 'border-box' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.30)'
              }}
            >
              <BarChart3 size={18} color="white" />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.8rem',
                fontWeight: 900,
                color: '#0F172A',
                letterSpacing: '-0.03em'
              }}
            >
              Surge Analytics & Deep Learning Vision Lab
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.92rem', fontWeight: 500 }}>
            Dual-model AI telemetry: XGBoost for tabular municipal surge forecasting + GridShift-VisionNet Deep Learning for pixel-level waste verification and false-report prevention.
          </p>
        </div>
      </div>

      {/* Dual-Model Architecture Comparison Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div className="gs-card" style={{ padding: '18px 20px', borderLeft: '4px solid #06B6D4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Cpu size={17} color="#06B6D4" />
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F172A' }}>
              Model 1: XGBoost Tabular Forecaster
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.55 }}>
            Processes structured permit tables (event scale, days to event, permit category) to forecast tonnage surges across Madgaon wards. Cannot inspect image pixels.
          </p>
        </div>

        <div className="gs-card" style={{ padding: '18px 20px', borderLeft: '4px solid #092C5E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ScanEye size={17} color="#092C5E" />
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F172A' }}>
              Model 2: GridShift-VisionNet (Deep Learning)
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.55 }}>
            Dedicated neural vision model that scans every citizen-reported photo independently—blocking false reports, overriding misclassified waste types, and continuously training on verified images.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* Bar Chart: Weekly Surge Trend */}
        <div className="gs-card" style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="#06B6D4" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                Weekly Surge Trend (Tons)
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#059669',
                background: 'rgba(5, 150, 105, 0.08)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(5, 150, 105, 0.15)'
              }}
            >
              LIVE DATA
            </span>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="20%">
                <defs>
                  <linearGradient id="barActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F172A" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#334155" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="barPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }}
                  axisLine={{ stroke: 'rgba(15, 23, 42, 0.08)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(6, 182, 212, 0.06)' }} />
                <Legend
                  wrapperStyle={{ fontSize: '0.78rem', fontWeight: 600, paddingTop: '12px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="tonnage"
                  fill="url(#barActual)"
                  name="Actual Tonnage"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="predicted"
                  fill="url(#barPredicted)"
                  name="AI Prediction"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  animationBegin={300}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart: Model Accuracy Over Time */}
        <div className="gs-card" style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#06B6D4" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                XGBoost Forecast Accuracy
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#06B6D4',
                background: 'rgba(6, 182, 212, 0.08)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(6, 182, 212, 0.15)'
              }}
            >
              XGBoost v4.2
            </span>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accuracyData}>
                <defs>
                  <linearGradient id="areaAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="areaBaseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }}
                  axisLine={{ stroke: 'rgba(15, 23, 42, 0.08)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[80, 100]}
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltipLine />} />
                <Area
                  type="monotone"
                  dataKey="baseline"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill="url(#areaBaseline)"
                  name="Baseline Target"
                  animationDuration={1500}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  fill="url(#areaAccuracy)"
                  name="Model Accuracy"
                  animationDuration={1500}
                  animationEasing="ease-out"
                  dot={{ r: 4, fill: '#06B6D4', stroke: 'white', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#06B6D4', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DEEP LEARNING VISION TRAINING & FALSE-REPORT PREVENTION PANEL (ADMIN ONLY) */}
      {isAdmin && visionState && (
        <div className="gs-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '18px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Brain size={19} color="#092C5E" />
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
                  {visionState.modelName} {visionState.version} — Active-Learning & False-Report Guard
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                {visionState.architecture} • Epoch #{visionState.epoch} • Training Loss {visionState.trainingLoss}
              </p>
            </div>

            <button
              type="button"
              disabled={retraining}
              onClick={handleTriggerRetrain}
              className="btn btn-primary"
              style={{
                padding: '9px 16px',
                fontSize: '0.82rem',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} className={retraining ? 'animate-spin' : ''} />
              <span>{retraining ? 'Training Epoch...' : `Train Epoch #${visionState.epoch + 1}`}</span>
            </button>
          </div>

          {trainBanner && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              {trainBanner}
            </div>
          )}

          {/* Vision Model KPI Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}
          >
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Validation Accuracy
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#092C5E' }}>
                {visionState.validationAccuracy}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                Epoch #{visionState.epoch} • Loss {visionState.trainingLoss}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                False Reports Blocked
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626' }}>
                {visionState.falseReportsBlocked}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 600 }}>
                {visionState.falseReportPrecision}% spam-filter precision
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                Mismatches Overridden
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706' }}>
                {visionState.discrepanciesOverridden}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
                AI corrected citizen labels
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#075985', textTransform: 'uppercase' }}>
                Labeled Training Images
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7' }}>
                {visionState.totalTrainedSamples.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 600 }}>
                6 municipal waste classes
              </div>
            </div>
          </div>

          {/* Active-Learning Sample Verification Queue */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <Database size={15} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>
                Recent Scanned Citizen Photos (Active-Learning Training Queue)
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(visionState.samples || []).slice(0, 10).map((sample) => {
                const isConfirmedWaste =
                  sample.adminVerdict === 'CONFIRMED_WASTE' ||
                  (sample.confirmedFalseReport === false && sample.trainingStatus === 'VERIFIED_IN_DATASET');
                const isMarkedFalse =
                  sample.adminVerdict === 'MARKED_FALSE' ||
                  (sample.confirmedFalseReport === true && sample.trainingStatus === 'BLOCKED_FALSE_REPORT');
                const needsAdminAudit = Boolean(sample.ticketId && !sample.adminVerdict && !sample.isWasteDetected);
                const resolvedWasteLabel =
                  sample.citizenCategory && sample.citizenCategory !== 'No Waste / False Report'
                    ? sample.citizenCategory
                    : sample.aiDetectedCategory && sample.aiDetectedCategory !== 'No Waste / False Report'
                    ? sample.aiDetectedCategory
                    : 'Illegal Curbside Dump';

                return (
                  <div
                    key={sample.ticketId || sample.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: needsAdminAudit ? '#fff7ed' : '#f8fafc',
                      border: needsAdminAudit ? '1.5px solid #fdba74' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '240px' }}>
                      {sample.imagePreview && (
                        <img
                          src={sample.imagePreview}
                          alt={sample.ticketId || sample.id}
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid #cbd5e1',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                          <strong style={{ fontSize: '0.82rem', color: '#092C5E' }}>{sample.id}</strong>
                          {sample.ticketId && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1'
                              }}
                            >
                              {sample.ticketId}
                            </span>
                          )}
                          {needsAdminAudit && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: '#ffedd5',
                                color: '#c2410c'
                              }}
                            >
                              Awaiting Admin Review
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              backgroundColor: sample.isWasteDetected ? '#dcfce7' : '#fee2e2',
                              color: sample.isWasteDetected ? '#166534' : '#991b1b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            {sample.isWasteDetected ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
                            {sample.adminVerdict === 'CONFIRMED_WASTE'
                              ? `Admin Verified: ${sample.confirmedLabel || resolvedWasteLabel}`
                              : sample.adminVerdict === 'MARKED_FALSE'
                              ? 'Admin Confirmed: False Report'
                              : `AI: ${sample.aiDetectedCategory} (${sample.confidence}%)`}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                            Citizen said: {sample.citizenCategory} ({sample.citizenSeverity})
                          </span>
                        </div>
                        <p style={{ margin: '0 0 3px 0', fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                          {sample.reasoning}
                        </p>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                          {sample.ward} • Authenticity {sample.authenticityScore}% • Status:{' '}
                          <strong style={{ color: isMarkedFalse ? '#b91c1c' : isConfirmedWaste ? '#15803d' : '#092C5E' }}>
                            {sample.trainingStatus}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleLabelSample(sample, resolvedWasteLabel, false)}
                        style={{
                          padding: '6px 11px',
                          borderRadius: '8px',
                          border: isConfirmedWaste ? '1px solid #15803d' : '1px solid #bbf7d0',
                          backgroundColor: isConfirmedWaste ? '#16a34a' : '#f0fdf4',
                          color: isConfirmedWaste ? '#ffffff' : '#15803d',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <CheckCircle2 size={13} /> {isConfirmedWaste ? 'Waste Confirmed' : 'Confirm Waste'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabelSample(sample, 'No Waste / False Report', true)}
                        style={{
                          padding: '6px 11px',
                          borderRadius: '8px',
                          border: isMarkedFalse ? '1px solid #b91c1c' : '1px solid #fecaca',
                          backgroundColor: isMarkedFalse ? '#dc2626' : '#fef2f2',
                          color: isMarkedFalse ? '#ffffff' : '#b91c1c',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <XCircle size={13} /> {isMarkedFalse ? 'Marked False' : 'Mark False'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Insights Panel */}
      <div className="gs-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(6, 182, 212, 0.12)'
          }}
        >
          <Lightbulb size={20} color="#06B6D4" />
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
            AI-Generated Operational Insights
          </h3>
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.65, color: '#475569' }}>
            Combining <strong style={{ color: '#0F172A' }}>XGBoost surge forecasting</strong> with{' '}
            <strong style={{ color: '#0F172A' }}>GridShift-VisionNet pixel verification</strong> prevents unnecessary compactor dispatches on false reports while automatically escalating misclassified construction debris in Madgaon wards.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
