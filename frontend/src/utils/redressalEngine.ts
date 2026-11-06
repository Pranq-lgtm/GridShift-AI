export const ADMIN_EMAIL = 'pranavkantak9@gmail.com';

export type UserRole = 'admin' | 'citizen';

export type WasteCategory =
  | 'Construction Debris'
  | 'Overflowing Bin'
  | 'Illegal Dumping'
  | 'Organic Market Surge'
  | 'Hazardous / E-Waste';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type TicketStatus =
  | 'REPORTED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED_CLOSED'
  | 'REOPENED';

export type RBACAction =
  | 'TRIAGE_TICKET'
  | 'ASSIGN_UNIT'
  | 'UPDATE_STATUS'
  | 'RESOLVE_TICKET'
  | 'VIEW_ADMIN_CONSOLE'
  | 'RUN_BULK_INGEST'
  | 'SUBMIT_REPORT'
  | 'SUBMIT_FEEDBACK'
  | 'REOPEN_TICKET';

export interface TicketTimelineEvent {
  id: string;
  timestamp: string;
  status: TicketStatus;
  actorEmail: string;
  actorRole: UserRole;
  note: string;
}

export interface CitizenFeedback {
  rating: number; // 1 to 5
  comment: string;
  satisfied: boolean;
  submittedAt: string;
  submittedBy: string;
}

export interface CitizenTicket {
  id: string;
  title: string;
  category: WasteCategory;
  severity: SeverityLevel;
  priorityScore: number; // 0 to 100
  status: TicketStatus;
  ward: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  estimatedTonnage: number;
  description: string;
  reporterName: string;
  reporterEmail: string;
  assignedUnit: string;
  slaHours: number;
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  resolutionNote?: string;
  proofImageUrl?: string;
  aiTriageSummary?: string;
  feedback?: CitizenFeedback;
  timeline: TicketTimelineEvent[];
}

export interface RateLimitWindowState {
  timestamps: number[];
  maxRequestsPerMinute: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAtMs: number;
  updatedState: RateLimitWindowState;
}

/**
 * Resolves the platform role strictly checking if the normalized email matches
 * the designated administrator account: pranavkantak9@gmail.com
 */
export function resolveUserRole(email?: string | null): UserRole {
  if (!email) return 'citizen';
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'citizen';
}

/**
 * Evaluates Role-Based Access Control (RBAC) permissions for platform actions.
 */
export function canPerformAction(
  userEmail: string | null | undefined,
  action: RBACAction,
  ticketReporterEmail?: string
): boolean {
  if (!userEmail || !userEmail.trim()) return false;
  const role = resolveUserRole(userEmail);

  // Admin pranavkantak9@gmail.com has full operational & redressal privileges
  if (role === 'admin') {
    return true;
  }

  // Citizens can submit reports and provide feedback / reopen their own tickets
  switch (action) {
    case 'SUBMIT_REPORT':
      return true;
    case 'SUBMIT_FEEDBACK':
    case 'REOPEN_TICKET':
      if (!ticketReporterEmail) return false;
      return userEmail.trim().toLowerCase() === ticketReporterEmail.trim().toLowerCase();
    case 'TRIAGE_TICKET':
    case 'ASSIGN_UNIT':
    case 'UPDATE_STATUS':
    case 'RESOLVE_TICKET':
    case 'VIEW_ADMIN_CONSOLE':
    case 'RUN_BULK_INGEST':
      return false;
    default:
      return false;
  }
}

/**
 * Computes automated ticket triage parameters (severity, priority score, SLA window,
 * and nearest autonomous/municipal dispatch unit) based on waste category, tonnage, and ward.
 */
export function computeAutoTriage(
  category: WasteCategory,
  estimatedTonnage: number,
  ward: string
): {
  severity: SeverityLevel;
  priorityScore: number;
  slaHours: number;
  assignedUnit: string;
  aiTriageSummary: string;
} {
  const categoryWeight: Record<WasteCategory, number> = {
    'Hazardous / E-Waste': 45,
    'Organic Market Surge': 38,
    'Construction Debris': 32,
    'Illegal Dumping': 28,
    'Overflowing Bin': 22,
  };

  const highTrafficWards = ['Ward 7 (Margao Market)', 'Ward 2 (Fatorda)', 'Ward 14 (Aquem)'];
  const wardBonus = highTrafficWards.some((w) =>
    ward.toLowerCase().includes(w.split(' ')[1]?.toLowerCase() || '___')
  )
    ? 12
    : 5;

  const tonnageScore = Math.min(40, Math.round(Math.max(0.5, estimatedTonnage) * 2.5));
  const rawScore = (categoryWeight[category] || 25) + wardBonus + tonnageScore;
  const priorityScore = Math.min(99, Math.max(15, rawScore));

  let severity: SeverityLevel = 'Low';
  let slaHours = 48;
  let assignedUnit = 'Municipal Sanitation Staff (On Foot Patrol)';

  if (priorityScore >= 75 || estimatedTonnage >= 12) {
    severity = 'Critical';
    slaHours = 4;
    assignedUnit =
      category === 'Construction Debris'
        ? 'Heavy Compactor T-304'
        : 'Compactor Truck T-402';
  } else if (priorityScore >= 55 || estimatedTonnage >= 5) {
    severity = 'High';
    slaHours = 12;
    assignedUnit =
      category === 'Organic Market Surge'
        ? 'Organics Dispatch T-119'
        : 'Municipal Small Pickup Van V-102';
  } else if (priorityScore >= 38) {
    severity = 'Medium';
    slaHours = 24;
    assignedUnit = 'Municipal Sanitation Staff (On Foot — Ward Beat Crew)';
  }

  const aiTriageSummary = `Auto-triaged as ${severity} (${priorityScore}/100 priority). SLA target: ${slaHours}h. Pre-assigned to ${assignedUnit} based on ${estimatedTonnage.toFixed(1)}T ${category.toLowerCase()} load in ${ward}.`;

  return {
    severity,
    priorityScore,
    slaHours,
    assignedUnit,
    aiTriageSummary,
  };
}

/**
 * Enforces deterministic state transitions in the Citizen Redressal State Machine.
 */
export function validateTicketTransition(
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
  actorRole: UserRole
): { valid: boolean; reason?: string } {
  if (currentStatus === nextStatus) {
    return { valid: false, reason: 'Ticket is already in the requested status.' };
  }

  if (currentStatus === 'VERIFIED_CLOSED' && actorRole !== 'admin') {
    return {
      valid: false,
      reason: 'Closed & verified tickets are locked. Only an Administrator can reopen them.',
    };
  }

  // Citizen rules: can only verify/close or reopen a RESOLVED ticket
  if (actorRole === 'citizen') {
    if (
      currentStatus === 'RESOLVED' &&
      (nextStatus === 'VERIFIED_CLOSED' || nextStatus === 'REOPENED')
    ) {
      return { valid: true };
    }
    return {
      valid: false,
      reason: 'Citizens can only verify closure or request reopening once a ticket is marked RESOLVED.',
    };
  }

  // Admin rules: valid operational pipeline transitions
  const allowedAdminTransitions: Record<TicketStatus, TicketStatus[]> = {
    REPORTED: ['TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
    TRIAGED: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
    ASSIGNED: ['IN_PROGRESS', 'RESOLVED', 'TRIAGED'],
    IN_PROGRESS: ['RESOLVED', 'ASSIGNED'],
    RESOLVED: ['VERIFIED_CLOSED', 'REOPENED', 'IN_PROGRESS'],
    REOPENED: ['TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
    VERIFIED_CLOSED: ['REOPENED'],
  };

  const allowed = allowedAdminTransitions[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      reason: `Invalid state transition from ${currentStatus} to ${nextStatus}.`,
    };
  }

  return { valid: true };
}

/**
 * Applies citizen feedback to a RESOLVED ticket, automatically closing it if satisfied
 * (rating >= 3) or reopening & escalating it to the Admin queue if dissatisfied (rating <= 2).
 */
export function applyCitizenFeedback(
  ticket: CitizenTicket,
  input: {
    rating: number;
    comment: string;
    satisfied: boolean;
    actorEmail: string;
    nowIso?: string;
  }
): CitizenTicket {
  const role = resolveUserRole(input.actorEmail);
  const isReporter =
    ticket.reporterEmail.trim().toLowerCase() === input.actorEmail.trim().toLowerCase();

  if (role !== 'admin' && !isReporter) {
    throw new Error('Unauthorized: Only the reporting citizen or platform admin can submit feedback.');
  }

  if (ticket.status !== 'RESOLVED') {
    throw new Error(`Feedback can only be submitted when ticket status is RESOLVED (current: ${ticket.status}).`);
  }

  const clampedRating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const isVerifiedClosed = input.satisfied && clampedRating >= 3;
  const nextStatus: TicketStatus = isVerifiedClosed ? 'VERIFIED_CLOSED' : 'REOPENED';
  const timestamp = input.nowIso || new Date().toISOString();

  const feedbackRecord: CitizenFeedback = {
    rating: clampedRating,
    comment: input.comment.trim() || (isVerifiedClosed ? 'Resolution verified by citizen.' : 'Issue persists; citizen requested re-dispatch.'),
    satisfied: isVerifiedClosed,
    submittedAt: timestamp,
    submittedBy: input.actorEmail.trim(),
  };

  const eventNote = isVerifiedClosed
    ? `Citizen verified resolution (${clampedRating}/5 stars): "${feedbackRecord.comment}"`
    : `Citizen rejected resolution (${clampedRating}/5 stars) & reopened ticket: "${feedbackRecord.comment}"`;

  // Escalate priority if reopened
  const updatedPriority = isVerifiedClosed
    ? ticket.priorityScore
    : Math.min(99, ticket.priorityScore + 15);
  const updatedSeverity: SeverityLevel =
    !isVerifiedClosed && ticket.severity !== 'Critical' ? 'High' : ticket.severity;

  return {
    ...ticket,
    status: nextStatus,
    priorityScore: updatedPriority,
    severity: updatedSeverity,
    updatedAt: timestamp,
    feedback: feedbackRecord,
    timeline: [
      ...ticket.timeline,
      {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp,
        status: nextStatus,
        actorEmail: input.actorEmail.trim(),
        actorRole: role,
        note: eventNote,
      },
    ],
  };
}

/**
 * Sliding-window rate limiter for Gemini API protection.
 */
export function evaluateSlidingWindowRateLimit(
  state: RateLimitWindowState,
  nowMs: number
): RateLimitResult {
  const windowStart = nowMs - state.windowMs;
  const activeTimestamps = state.timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= state.maxRequestsPerMinute) {
    const oldestInWindow = activeTimestamps[0] || nowMs;
    const resetAtMs = oldestInWindow + state.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      resetAtMs,
      updatedState: {
        ...state,
        timestamps: activeTimestamps,
      },
    };
  }

  const nextTimestamps = [...activeTimestamps, nowMs];
  const remaining = Math.max(0, state.maxRequestsPerMinute - nextTimestamps.length);
  const resetAtMs = (nextTimestamps[0] || nowMs) + state.windowMs;

  return {
    allowed: true,
    remaining,
    retryAfterSeconds: 0,
    resetAtMs,
    updatedState: {
      ...state,
      timestamps: nextTimestamps,
    },
  };
}

/**
 * Exponential backoff with bounded jitter for HTTP 429 / 503 Gemini API retry handling.
 */
export function computeBackoffDelayMs(
  attempt: number,
  baseDelayMs = 800,
  maxDelayMs = 8000,
  jitterFactor = 0.15
): number {
  const safeAttempt = Math.max(0, Math.min(10, attempt));
  const exponential = baseDelayMs * Math.pow(2, safeAttempt);
  const jitter = exponential * Math.max(0, Math.min(0.5, jitterFactor));
  return Math.min(maxDelayMs, Math.round(exponential + jitter));
}

/**
 * Computes comparative performance metrics between the original Pranq-lgtm/GridShift-AI
 * sequential architecture and the optimized vectorized + cached architecture.
 */
export function simulateArchitectureBenchmark(permitBatchSize: number, cacheHitRatio = 0.65): {
  batchSize: number;
  legacySequentialMs: number;
  optimizedBatchMs: number;
  speedupFactor: number;
  dbRoundTripsLegacy: number;
  dbRoundTripsOptimized: number;
  mlCallsLegacy: number;
  mlCallsOptimized: number;
  memoryFootprintReductionPct: number;
} {
  const n = Math.max(1, Math.min(500, Math.round(permitBatchSize)));
  const clampedCache = Math.max(0, Math.min(0.95, cacheHitRatio));

  // Legacy: for (let p of permits) { await fetch('/predict'); await newPermit.save(); }
  // Avg 45ms XGBoost HTTP + 380ms synchronous Gemini on 40% high/critical permits + 28ms MongoDB save per doc
  const legacyPerPermitMs = 45 + 0.4 * 380 + 28; // ~225ms per permit sequentially
  const legacySequentialMs = Math.round(n * legacyPerPermitMs);

  // Optimized: 1 vectorized XGBoost matrix call (18ms + 0.4ms * n) + bounded parallel cached Gemini + 1 insertMany (32ms)
  const uncachedCriticalCount = Math.ceil(n * 0.4 * (1 - clampedCache));
  const parallelGeminiWaves = Math.ceil(uncachedCriticalCount / 5); // concurrency = 5
  const optimizedBatchMs = Math.round(18 + n * 0.4 + parallelGeminiWaves * 190 + 32);

  const speedupFactor = Number((legacySequentialMs / Math.max(1, optimizedBatchMs)).toFixed(1));

  return {
    batchSize: n,
    legacySequentialMs,
    optimizedBatchMs,
    speedupFactor,
    dbRoundTripsLegacy: n,
    dbRoundTripsOptimized: 1,
    mlCallsLegacy: n,
    mlCallsOptimized: 1,
    memoryFootprintReductionPct: 78, // Offloading base64 photos from 5MB localStorage + memoizing 7 DeckGL layers
  };
}
