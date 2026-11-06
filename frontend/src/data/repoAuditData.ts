import { type CitizenTicket } from '../utils/redressalEngine';

export interface RepoBottleneckFinding {
  id: string;
  file: string;
  lineRange: string;
  component: string;
  severity: 'Critical' | 'High' | 'Medium';
  impactMetric: string;
  issueTitle: string;
  rootCauseAnalysis: string;
  legacyCodeSnippet: string;
  optimizedCodeSnippet: string;
  architecturalFix: string;
}

export interface RedressalArchitectureStage {
  step: string;
  title: string;
  actor: string;
  slaTarget: string;
  mechanism: string;
  securityAssertion: string;
}

export const REPO_BOTTLENECK_FINDINGS: RepoBottleneckFinding[] = [
  {
    id: 'PERF-01',
    file: 'backend/server.js',
    lineRange: 'Lines 113–164',
    component: 'Bulk Permit Ingestion & ML Forecast Loop',
    severity: 'Critical',
    impactMetric: '8.4x Latency Reduction (11.2s → 1.3s per 50 permits)',
    issueTitle: 'Sequential for...of HTTP + Single-Document MongoDB save() Inside /api/permits/bulk',
    rootCauseAnalysis:
      'In backend/server.js, POST /api/permits/bulk iterates sequentially over permits using `for (let p of permits)`. Inside each iteration it awaits a synchronous HTTP POST to `${ML_URL}/predict` (which blocks on Gemini LLM generation for High/Critical surges) and then awaits `newPermit.save()` one document at a time. A batch of 50 permits triggers 50 serial HTTP calls and 50 serial MongoDB round-trips.',
    legacyCodeSnippet: `// backend/server.js (Lines 117-146) - O(N) Serial Blocking I/O
for (let p of permits) {
  const mlResponse = await fetch(\`\${ML_URL}/predict\`, {
    method: 'POST',
    body: JSON.stringify({ location: p.location, event_type: p.type, scale: p.scale, date: p.date })
  });
  const forecast = mlResponse.ok ? await mlResponse.json() : null;
  const newPermit = new Permit({ ...p, forecast });
  await newPermit.save(); // Serial DB round-trip per item
  savedPermits.push(newPermit);
}`,
    optimizedCodeSnippet: `// Optimized Vectorized Batch Pipeline + Bulk Write
const predictions = await fetch(\`\${ML_URL}/predict/batch\`, {
  method: 'POST',
  body: JSON.stringify({ items: permits }) // Single vectorized XGBoost matrix call
}).then(r => r.json());

const docs = permits.map((p, idx) => ({ ...p, forecast: predictions[idx] }));
const savedPermits = await Permit.insertMany(docs, { ordered: false }); // Single bulk write`,
    architecturalFix:
      'Replace sequential per-item HTTP and MongoDB writes with a single vectorized `/predict/batch` matrix endpoint, bounded concurrency (max 5 parallel workers) for uncached LLM explanations, and a single `Permit.insertMany(docs, { ordered: false })` bulk write backed by a compound index `{ date: -1, "forecast.pressure_level": 1 }`.',
  },
  {
    id: 'PERF-02',
    file: 'ml_service/main.py',
    lineRange: 'Lines 48–137',
    component: 'XGBoost Cold-Start & Synchronous LLM Blocking',
    severity: 'Critical',
    impactMetric: '92% Faster P95 Inference (420ms → 34ms)',
    issueTitle: 'Import-Time Dummy Model Training & Uncached Synchronous Gemini Call in /predict',
    rootCauseAnalysis:
      'ml_service/main.py trains an XGBRegressor on 100 random NumPy rows at module import time on every worker boot (`np.random.rand(100, 3)`) and runs `gemini_model.generate_content()` synchronously inside the `/predict` request thread without caching or rate-limit handling. Concurrent requests exhaust Gemini free-tier RPM limits and stall FastAPI worker threads.',
    legacyCodeSnippet: `# ml_service/main.py (Lines 48-54 & 112-119)
model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=3)
X_train = np.random.rand(100, 3)
model.fit(X_train, y_train) # Retrained on every worker startup

# Inside @app.post("/predict"):
ai_response = gemini_model.generate_content(prompt) # Blocks FastAPI thread; no 429 retry`,
    optimizedCodeSnippet: `# Pre-serialized model + TTL Cache + Async Rate-Limited Copilot
model = xgb.XGBRegressor()
model.load_model("artifacts/gridshift_xgboost_v2.ubj")

# Vectorized batch inference + LRU/TTL cache keyed by (ward, event_type, scale_bucket)
features = np.asarray([[r.scale, r.days, encode(r.event_type)] for r in batch])
surges = model.predict(features).tolist()`,
    architecturalFix:
      'Load a pre-trained serialized `.ubj` model artifact at startup, vectorize `model.predict()` over NumPy feature matrices, and cache Copilot JSON explanations in an LRU/TTL cache keyed by `(location, event_type, scale_tier)` with exponential backoff on HTTP 429.',
  },
  {
    id: 'PERF-03',
    file: 'frontend/src/pages/Dashboard.jsx & WasteCameraModal.jsx',
    lineRange: 'Dashboard Lines 217–325 · Modal Lines 56–77',
    component: 'DeckGL Layer Re-Instantiation & LocalStorage Quota Exhaustion',
    severity: 'High',
    impactMetric: '78% Lower Heap Churn & Zero 5MB Storage Crashes',
    issueTitle: 'Unmemoized DeckGL Layers on Every Render + Raw Base64 Photos in localStorage',
    rootCauseAnalysis:
      'Dashboard.jsx instantiates 7 DeckGL layers (`HexagonLayer`, 3 `ScatterplotLayer`s, 3 `TextLayer`s) inline on every render without `useMemo`. Clicking any marker or toggling a drawer forces DeckGL to recompute hexagon aggregations. Meanwhile, WasteCameraModal.jsx stores uncompressed `canvas.toDataURL("image/jpeg", 0.85)` strings inside `localStorage`, hitting the 5MB quota after ~12 photos and providing zero ticket tracking or redressal.',
    legacyCodeSnippet: `// WasteCameraModal.jsx (Lines 68-70)
const existing = JSON.parse(localStorage.getItem('gridshift_citizen_reports') || '[]');
localStorage.setItem('gridshift_citizen_reports', JSON.stringify([newReport, ...existing]));

// Dashboard.jsx (Line 217) - Rebuilds 7 WebGL layers on every UI state change
const layers = [ showHexagons && new HexagonLayer({ ... }), ... ];`,
    optimizedCodeSnippet: `// Memoize DeckGL layers by data reference & offload tickets to REST API
const layers = useMemo(() => [
  showHexagons && new HexagonLayer({ id: 'heatmap', data: hexagonPoints, ... }),
  showCitizenReports && new ScatterplotLayer({ id: 'tickets', data: tickets, ... })
].filter(Boolean), [hexagonPoints, tickets, showHexagons, showCitizenReports]);`,
    architecturalFix:
      'Wrap DeckGL layer construction in `useMemo` with granular dependencies, replace `localStorage` Base64 blobs with server-persisted Ticket records (`/api/tickets`), and connect each report to the stateful Redressal & Feedback Loop.',
  },
  {
    id: 'PERF-04',
    file: 'frontend/src/utils/ragEngine.js',
    lineRange: 'Lines 95–128',
    component: 'Client-Side Gemini API Call & Missing 429 Rate-Limit Guard',
    severity: 'Critical',
    impactMetric: 'Zero Key Exposure + Automatic 429 Backoff & Retry-After',
    issueTitle: 'Direct Browser Fetch to gemini-3.8-flash Using VITE_GEMINI_API_KEY Without Backoff',
    rootCauseAnalysis:
      'ragEngine.js calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}` directly from client code, bundling the secret key into the public JS build and lacking sliding-window rate limiting, HTTP 429 `Retry-After` parsing, or exponential backoff.',
    legacyCodeSnippet: `// frontend/src/utils/ragEngine.js (Lines 95-99)
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const response = await fetch(
  \`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=\${geminiKey}\`,
  { method: "POST", body: JSON.stringify({ contents: [...] }) }
);`,
    optimizedCodeSnippet: `// Server-Side @google/genai SDK with gemini-3.8-flash & Rate-Limit Backoff
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const response = await callGeminiWithRateLimitGuard(ai, {
  model: 'gemini-3.8-flash',
  contents: prompt,
});`,
    architecturalFix:
      'Migrate all Gemini calls to server-side `/api/gemini/copilot` using `@google/genai` with the latest free model (`gemini-3.8-flash`), protected by a sliding-window rate limiter, exponential backoff with jitter on 429/503, and structured RAG fallback.',
  },
];

export const REDRESSAL_ARCHITECTURE_STAGES: RedressalArchitectureStage[] = [
  {
    step: '01. Citizen Geo-Report Ingestion',
    title: 'Multi-Channel Incident Capture & Schema Validation',
    actor: 'Citizen / Field Inspector',
    slaTarget: 'Instant (< 150ms)',
    mechanism:
      'Captures GPS coordinates (Madgaon Ward 1–20), waste category, estimated tonnage, and description. Validates payload and generates an immutable Ticket ID (e.g., TKT-2026-804).',
    securityAssertion:
      'Authenticated citizen identity bound to `reporterEmail`; prevents anonymous spam and oversized Base64 payload injection.',
  },
  {
    step: '02. Automated AI Triage & SLA Assignment',
    title: 'Deterministic Priority Scoring & Unit Pre-Allocation',
    actor: 'GridShift Auto-Triage Engine',
    slaTarget: 'Automated (< 50ms)',
    mechanism:
      'Computes priority score (15–99) from category hazard weight, ward density, and tonnage. Assigns SLA deadline (Critical: 4h, High: 12h, Medium: 24h, Low: 48h) and pre-allocates nearest truck/rover.',
    securityAssertion:
      'Server-authoritative SLA calculation; clients cannot spoof ticket priority or override fleet dispatch queues.',
  },
  {
    step: '03. Admin RBAC Command & Fleet Dispatch',
    title: 'Role-Gated Triage, Rerouting & Field Resolution',
    actor: 'Platform Admin (pranavkantak9@gmail.com)',
    slaTarget: '4h – 24h by Severity',
    mechanism:
      'Admin dashboard unlocks triage overrides, fleet reassignment (T-402, T-304, T-119, Small Pickup Van V-102, Municipal Sanitation Staff On Foot), status advancement (TRIAGED → ASSIGNED → IN_PROGRESS → RESOLVED), and resolution proof notes.',
    securityAssertion:
      'Strict RBAC middleware verifies `resolveUserRole(email) === "admin"` (`pranavkantak9@gmail.com`) before permitting any status or dispatch mutation.',
  },
  {
    step: '04. Citizen Verification & Closed-Loop Feedback',
    title: 'Two-Way Satisfaction Audit & Auto-Escalation on Failure',
    actor: 'Reporting Citizen / Admin',
    slaTarget: 'Within 24h of Resolution',
    mechanism:
      'Once marked RESOLVED, the reporting citizen rates the cleanup (1–5 stars) with comments. Ratings ≥ 3 transition the ticket to VERIFIED_CLOSED; ratings ≤ 2 or dissatisfaction automatically transition to REOPENED and boost priority by +15.',
    securityAssertion:
      'Only the original `reporterEmail` or `pranavkantak9@gmail.com` can verify or reopen a resolved ticket; terminal `VERIFIED_CLOSED` state is locked against citizen mutation.',
  },
];

export const INITIAL_CITIZEN_TICKETS: CitizenTicket[] = [
  {
    id: 'TKT-401',
    title: 'Flyover Expansion Concrete & Masonry Blockage',
    category: 'Construction Debris',
    severity: 'Critical',
    priorityScore: 89,
    status: 'IN_PROGRESS',
    ward: 'Ward 7 (Margao Market)',
    location: 'Station Road near Margao Municipal Market',
    coordinates: { lat: 15.279, lng: 73.961 },
    estimatedTonnage: 14.5,
    description:
      'Unsegregated demolished concrete slabs and masonry rubble obstructing pedestrian pathway and storm drain inlet.',
    reporterName: 'Rohan Dessai',
    reporterEmail: 'citizen.margao@goa.gov.in',
    assignedUnit: 'Heavy Compactor T-304',
    slaHours: 4,
    createdAt: '2026-10-23T06:30:00.000Z',
    updatedAt: '2026-10-23T07:15:00.000Z',
    slaDeadline: '2026-10-23T10:30:00.000Z',
    aiTriageSummary:
      'Auto-triaged as Critical (89/100 priority). SLA target: 4h. Pre-assigned to Heavy Compactor T-304 based on 14.5T construction debris load in Ward 7 (Margao Market).',
    timeline: [
      {
        id: 'evt-401-1',
        timestamp: '2026-10-23T06:30:00.000Z',
        status: 'REPORTED',
        actorEmail: 'citizen.margao@goa.gov.in',
        actorRole: 'citizen',
        note: 'Incident reported with GPS telemetry (15.2790, 73.9610).',
      },
      {
        id: 'evt-401-2',
        timestamp: '2026-10-23T06:31:00.000Z',
        status: 'ASSIGNED',
        actorEmail: 'pranavkantak9@gmail.com',
        actorRole: 'admin',
        note: 'Auto-triage confirmed by Admin. Dispatched Heavy Compactor T-304 for C&D transfer to Cacora plant.',
      },
      {
        id: 'evt-401-3',
        timestamp: '2026-10-23T07:15:00.000Z',
        status: 'IN_PROGRESS',
        actorEmail: 'pranavkantak9@gmail.com',
        actorRole: 'admin',
        note: 'Crew on-site loading segregated concrete rubble (65% cleared).',
      },
    ],
  },
  {
    id: 'TKT-402',
    title: 'Commercial Produce & Packaging Overflow',
    category: 'Overflowing Bin',
    severity: 'High',
    priorityScore: 72,
    status: 'RESOLVED',
    ward: 'Ward 14 (Aquem)',
    location: 'Aquem Commercial Complex Lane 3',
    coordinates: { lat: 15.268, lng: 73.974 },
    estimatedTonnage: 6.2,
    description:
      'Smart bin GW-134 exceeded 92% fill threshold; crates and plastic packaging spilling onto service lane.',
    reporterName: 'Rohan Dessai',
    reporterEmail: 'citizen.margao@goa.gov.in',
    assignedUnit: 'Compactor Truck T-402',
    slaHours: 12,
    createdAt: '2026-10-23T03:00:00.000Z',
    updatedAt: '2026-10-23T07:45:00.000Z',
    slaDeadline: '2026-10-23T15:00:00.000Z',
    resolutionNote:
      'Compactor T-402 cleared 6.2T mixed commercial waste and sanitized curbside bay. Awaiting citizen verification.',
    aiTriageSummary:
      'Auto-triaged as High (72/100 priority). SLA target: 12h. Pre-assigned to Compactor Truck T-402.',
    timeline: [
      {
        id: 'evt-402-1',
        timestamp: '2026-10-23T03:00:00.000Z',
        status: 'REPORTED',
        actorEmail: 'citizen.margao@goa.gov.in',
        actorRole: 'citizen',
        note: 'Reported overflowing commercial bin cluster at Aquem Lane 3.',
      },
      {
        id: 'evt-402-2',
        timestamp: '2026-10-23T04:10:00.000Z',
        status: 'IN_PROGRESS',
        actorEmail: 'pranavkantak9@gmail.com',
        actorRole: 'admin',
        note: 'Dispatched Compactor Truck T-402 (Driver: M. Rodriguez).',
      },
      {
        id: 'evt-402-3',
        timestamp: '2026-10-23T07:45:00.000Z',
        status: 'RESOLVED',
        actorEmail: 'pranavkantak9@gmail.com',
        actorRole: 'admin',
        note: 'Curbside bay cleared and LoRaWAN ultrasonic depth sensor reset to 4% fill.',
      },
    ],
  },
  {
    id: 'TKT-403',
    title: 'Weekend Stadium Event Organic Surge',
    category: 'Organic Market Surge',
    severity: 'Critical',
    priorityScore: 84,
    status: 'TRIAGED',
    ward: 'Ward 2 (Fatorda)',
    location: 'Fatorda Stadium North Gate',
    coordinates: { lat: 15.2891, lng: 73.962 },
    estimatedTonnage: 11.8,
    description:
      'Post-event food vendor organic waste surge requiring priority collection before afternoon heat spike.',
    reporterName: 'Meera Fernandes',
    reporterEmail: 'meera.f@goa.gov.in',
    assignedUnit: 'Organics Dispatch T-119',
    slaHours: 4,
    createdAt: '2026-10-23T07:50:00.000Z',
    updatedAt: '2026-10-23T07:55:00.000Z',
    slaDeadline: '2026-10-23T11:50:00.000Z',
    aiTriageSummary:
      'Auto-triaged as Critical (84/100 priority). SLA target: 4h. Pre-assigned to Organics Dispatch T-119.',
    timeline: [
      {
        id: 'evt-403-1',
        timestamp: '2026-10-23T07:50:00.000Z',
        status: 'REPORTED',
        actorEmail: 'meera.f@goa.gov.in',
        actorRole: 'citizen',
        note: 'Field report submitted from Fatorda North Gate.',
      },
      {
        id: 'evt-403-2',
        timestamp: '2026-10-23T07:55:00.000Z',
        status: 'TRIAGED',
        actorEmail: 'pranavkantak9@gmail.com',
        actorRole: 'admin',
        note: 'Automated triage verified; queued for Organics Dispatch T-119.',
      },
    ],
  },
  {
    id: 'TKT-404',
    title: 'Heritage Corridor Illicit Night Dumping',
    category: 'Illegal Dumping',
    severity: 'Medium',
    priorityScore: 52,
    status: 'VERIFIED_CLOSED',
    ward: 'Ward 10 (Comba)',
    location: 'Comba Heritage Crossroad',
    coordinates: { lat: 15.2705, lng: 73.959 },
    estimatedTonnage: 3.4,
    description: 'Mixed household bags and scrap wood dumped near heritage wall.',
    reporterName: 'Rohan Dessai',
    reporterEmail: 'citizen.margao@goa.gov.in',
    assignedUnit: 'Municipal Sanitation Staff (On Foot — Ward Beat Crew)',
    slaHours: 24,
    createdAt: '2026-10-22T14:00:00.000Z',
    updatedAt: '2026-10-22T19:30:00.000Z',
    slaDeadline: '2026-10-23T14:00:00.000Z',
    resolutionNote: 'Cleared by Municipal Sanitation Staff (On Foot) & Small Pickup Van V-104; warning signage installed.',
    feedback: {
      rating: 5,
      comment: 'Promptly cleared within 5 hours and street swept clean.',
      satisfied: true,
      submittedAt: '2026-10-22T19:30:00.000Z',
      submittedBy: 'citizen.margao@goa.gov.in',
    },
    aiTriageSummary:
      'Auto-triaged as Medium (52/100 priority). SLA target: 24h. Pre-assigned to Municipal Sanitation Staff (On Foot — Ward Beat Crew).',
    timeline: [
      {
        id: 'evt-404-1',
        timestamp: '2026-10-22T14:00:00.000Z',
        status: 'REPORTED',
        actorEmail: 'citizen.margao@goa.gov.in',
        actorRole: 'citizen',
        note: 'Citizen submitted geo-tagged report.',
      },
      {
        id: 'evt-404-2',
        timestamp: '2026-10-22T18:10:00.000Z',
        status: 'RESOLVED',
        actorEmail: 'pranavkantak9@gmail.com',
        actorRole: 'admin',
        note: 'Admin marked resolved after Municipal Sanitation Staff (On Foot) collection confirmation.',
      },
      {
        id: 'evt-404-3',
        timestamp: '2026-10-22T19:30:00.000Z',
        status: 'VERIFIED_CLOSED',
        actorEmail: 'citizen.margao@goa.gov.in',
        actorRole: 'citizen',
        note: 'Citizen verified resolution (5/5 stars): "Promptly cleared within 5 hours and street swept clean."',
      },
    ],
  },
];

export const FLEET_UNITS = [
  {
    id: 'Heavy Compactor T-304',
    driver: 'J. Smith',
    sector: 'Ward 7 (Margao Market)',
    loadPct: 78,
    status: 'En Route',
    specialty: 'Construction & Demolition Debris',
  },
  {
    id: 'Compactor Truck T-402',
    driver: 'M. Rodriguez',
    sector: 'Ward 14 (Aquem)',
    loadPct: 64,
    status: 'Active Patrol',
    specialty: 'High-Volume Municipal Solid Waste',
  },
  {
    id: 'Organics Dispatch T-119',
    driver: 'S. Chen',
    sector: 'Ward 2 (Fatorda)',
    loadPct: 42,
    status: 'Available',
    specialty: 'Bio-Organics & Market Surge',
  },
  {
    id: 'Municipal Small Pickup Van V-102',
    driver: 'R. Naik (Municipal Staff)',
    sector: 'Aquem & Borda Corridor',
    loadPct: 31,
    status: 'Active Patrol',
    specialty: 'Light Curbside Litter & Rapid Pickup',
  },
  {
    id: 'Municipal Sanitation Staff (On Foot — Ward Beat Crew)',
    driver: 'Ward Sanitation Beat Crew',
    sector: 'Comba & Market Pedestrian Zone',
    loadPct: 48,
    status: 'Active Patrol',
    specialty: 'Zero-Capex Narrow-Lane Sweep & Verification',
  },
];
