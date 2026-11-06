import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_EMAIL,
  resolveUserRole,
  canPerformAction,
  computeAutoTriage,
  validateTicketTransition,
  applyCitizenFeedback,
  evaluateSlidingWindowRateLimit,
  computeBackoffDelayMs,
  simulateArchitectureBenchmark,
  type CitizenTicket,
} from './redressalEngine';

test('resolveUserRole assigns admin strictly to pranavkantak9@gmail.com', () => {
  assert.equal(resolveUserRole('pranavkantak9@gmail.com'), 'admin');
  assert.equal(resolveUserRole('  PRANAVKANTAK9@GMAIL.COM '), 'admin');
  assert.equal(resolveUserRole('citizen@goa.gov.in'), 'citizen');
  assert.equal(resolveUserRole(''), 'citizen');
  assert.equal(resolveUserRole(null), 'citizen');
});

test('canPerformAction enforces RBAC boundaries between admin and citizens', () => {
  // Admin can perform all administrative and citizen actions
  assert.equal(canPerformAction(ADMIN_EMAIL, 'TRIAGE_TICKET'), true);
  assert.equal(canPerformAction(ADMIN_EMAIL, 'ASSIGN_UNIT'), true);
  assert.equal(canPerformAction(ADMIN_EMAIL, 'RESOLVE_TICKET'), true);
  assert.equal(canPerformAction(ADMIN_EMAIL, 'VIEW_ADMIN_CONSOLE'), true);

  // Citizen cannot perform admin actions
  const citizen = 'resident.fatorda@gmail.com';
  assert.equal(canPerformAction(citizen, 'TRIAGE_TICKET'), false);
  assert.equal(canPerformAction(citizen, 'RESOLVE_TICKET'), false);
  assert.equal(canPerformAction(citizen, 'VIEW_ADMIN_CONSOLE'), false);

  // Citizen can submit report and provide feedback on their own ticket only
  assert.equal(canPerformAction(citizen, 'SUBMIT_REPORT'), true);
  assert.equal(canPerformAction(citizen, 'SUBMIT_FEEDBACK', citizen), true);
  assert.equal(canPerformAction(citizen, 'SUBMIT_FEEDBACK', 'other@gmail.com'), false);
});

test('computeAutoTriage calculates severity, SLA hours, and unit assignment', () => {
  const criticalTriage = computeAutoTriage('Construction Debris', 16.5, 'Ward 7 (Margao Market)');
  assert.equal(criticalTriage.severity, 'Critical');
  assert.equal(criticalTriage.slaHours, 4);
  assert.equal(criticalTriage.assignedUnit, 'Heavy Compactor T-304');
  assert.ok(criticalTriage.priorityScore >= 75);

  const mediumTriage = computeAutoTriage('Overflowing Bin', 1.2, 'Ward 18 (Borda)');
  assert.equal(mediumTriage.severity, 'Low');
  assert.equal(mediumTriage.slaHours, 48);
});

test('validateTicketTransition enforces state machine rules for admin and citizen', () => {
  // Citizen cannot mark IN_PROGRESS as RESOLVED
  const citizenAttempt = validateTicketTransition('IN_PROGRESS', 'RESOLVED', 'citizen');
  assert.equal(citizenAttempt.valid, false);

  // Citizen can verify closure or reopen a RESOLVED ticket
  assert.equal(validateTicketTransition('RESOLVED', 'VERIFIED_CLOSED', 'citizen').valid, true);
  assert.equal(validateTicketTransition('RESOLVED', 'REOPENED', 'citizen').valid, true);

  // Admin can transition through pipeline
  assert.equal(validateTicketTransition('REPORTED', 'TRIAGED', 'admin').valid, true);
  assert.equal(validateTicketTransition('IN_PROGRESS', 'RESOLVED', 'admin').valid, true);
});

test('applyCitizenFeedback closes ticket on positive rating and reopens on low rating', () => {
  const sampleTicket: CitizenTicket = {
    id: 'TKT-901',
    title: 'Masonry Rubble on Station Road',
    category: 'Construction Debris',
    severity: 'High',
    priorityScore: 68,
    status: 'RESOLVED',
    ward: 'Ward 7 (Margao Market)',
    location: 'Station Road, Margao',
    coordinates: { lat: 15.279, lng: 73.961 },
    estimatedTonnage: 8.5,
    description: 'Concrete blocks cleared requested',
    reporterName: 'Aarav Naik',
    reporterEmail: 'aarav.naik@gmail.com',
    assignedUnit: 'Heavy Compactor T-304',
    slaHours: 12,
    createdAt: '2026-10-23T01:00:00.000Z',
    updatedAt: '2026-10-23T04:00:00.000Z',
    slaDeadline: '2026-10-23T13:00:00.000Z',
    timeline: [],
  };

  const closedTicket = applyCitizenFeedback(sampleTicket, {
    rating: 5,
    comment: 'Site completely cleared within 3 hours.',
    satisfied: true,
    actorEmail: 'aarav.naik@gmail.com',
  });
  assert.equal(closedTicket.status, 'VERIFIED_CLOSED');
  assert.equal(closedTicket.feedback?.rating, 5);
  assert.equal(closedTicket.timeline.length, 1);

  const reopenedTicket = applyCitizenFeedback(sampleTicket, {
    rating: 2,
    comment: 'Half the rubble is still blocking the pedestrian lane.',
    satisfied: false,
    actorEmail: 'aarav.naik@gmail.com',
  });
  assert.equal(reopenedTicket.status, 'REOPENED');
  assert.ok(reopenedTicket.priorityScore > sampleTicket.priorityScore);
});

test('evaluateSlidingWindowRateLimit enforces per-minute request quotas and retry-after', () => {
  let state = { timestamps: [] as number[], maxRequestsPerMinute: 2, windowMs: 60_000 };
  const t0 = 1_000_000;

  const r1 = evaluateSlidingWindowRateLimit(state, t0);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 1);
  state = r1.updatedState;

  const r2 = evaluateSlidingWindowRateLimit(state, t0 + 5_000);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 0);
  state = r2.updatedState;

  const r3 = evaluateSlidingWindowRateLimit(state, t0 + 10_000);
  assert.equal(r3.allowed, false);
  assert.equal(r3.retryAfterSeconds, 50);

  // After window expires
  const r4 = evaluateSlidingWindowRateLimit(state, t0 + 61_000);
  assert.equal(r4.allowed, true);
});

test('computeBackoffDelayMs and simulateArchitectureBenchmark return valid metrics', () => {
  const d0 = computeBackoffDelayMs(0, 500, 5000, 0);
  const d1 = computeBackoffDelayMs(1, 500, 5000, 0);
  const d2 = computeBackoffDelayMs(2, 500, 5000, 0);
  assert.equal(d0, 500);
  assert.equal(d1, 1000);
  assert.equal(d2, 2000);

  const bench = simulateArchitectureBenchmark(50, 0.65);
  assert.equal(bench.batchSize, 50);
  assert.ok(bench.legacySequentialMs > bench.optimizedBatchMs);
  assert.ok(bench.speedupFactor > 5);
  assert.equal(bench.dbRoundTripsLegacy, 50);
  assert.equal(bench.dbRoundTripsOptimized, 1);
});
