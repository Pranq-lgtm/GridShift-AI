import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_VISION_MODEL_STATE,
  evaluateCitizenVsAiDiscrepancy,
  evaluateSlaPriorityAudit,
  recommendMunicipalUnit,
  enqueueVisionSample,
  applyHumanVerificationLabel,
  runIncrementalTrainingEpoch,
} from './visionTrainingEngine.ts';

test('False-report guard flags images with no municipal waste detected', () => {
  const result = evaluateCitizenVsAiDiscrepancy(
    'Hazardous / Chemical',
    'Critical',
    'No Waste / False Report',
    'Low',
    false
  );
  assert.equal(result.citizenDiscrepancy, true);
  assert.match(result.discrepancyNote || '', /False-report guard triggered/i);
  assert.match(recommendMunicipalUnit('No Waste / False Report', 'Low'), /No Dispatch Required/i);
});

test('Independent AI vision detects category and severity discrepancies despite citizen input', () => {
  const result = evaluateCitizenVsAiDiscrepancy(
    'Overflowing Bin',
    'Low',
    'Construction Debris',
    'High',
    true
  );
  assert.equal(result.citizenDiscrepancy, true);
  assert.match(result.discrepancyNote || '', /AI Vision overrode citizen selection/i);
});

test('Matching citizen and AI vision labels produce no discrepancy', () => {
  const result = evaluateCitizenVsAiDiscrepancy(
    'Illegal Curbside Dump',
    'High',
    'Illegal Curbside Dump',
    'High',
    true
  );
  assert.equal(result.citizenDiscrepancy, false);
  assert.equal(result.discrepancyNote, null);
});

test('Active-learning pipeline enqueues samples, applies human labels, and advances training epoch', () => {
  const afterEnqueue = enqueueVisionSample(INITIAL_VISION_MODEL_STATE, {
    id: 'VS-2026-999',
    createdAt: new Date().toISOString(),
    ward: 'Ward 7 — Margao Central Market',
    citizenCategory: 'Overflowing Bin',
    citizenSeverity: 'Medium',
    aiDetectedCategory: 'No Waste / False Report',
    aiDetectedSeverity: 'Low',
    isWasteDetected: false,
    authenticityScore: 12,
    confidence: 95,
    discrepancyFlagged: true,
    confirmedLabel: null,
    confirmedFalseReport: null,
    trainingStatus: 'QUEUED_FOR_TRAINING',
    reasoning: 'Empty indoor tabletop with no waste detected.',
  });

  assert.equal(afterEnqueue.falseReportsBlocked, INITIAL_VISION_MODEL_STATE.falseReportsBlocked + 1);
  assert.equal(afterEnqueue.discrepanciesOverridden, INITIAL_VISION_MODEL_STATE.discrepanciesOverridden + 1);

  const afterLabel = applyHumanVerificationLabel(
    afterEnqueue,
    'VS-2026-999',
    'No Waste / False Report',
    true
  );
  const labeled = afterLabel.samples.find((s) => s.id === 'VS-2026-999');
  assert.equal(labeled?.trainingStatus, 'BLOCKED_FALSE_REPORT');

  const { nextState, accuracyDelta } = runIncrementalTrainingEpoch(afterLabel);
  assert.equal(nextState.epoch, INITIAL_VISION_MODEL_STATE.epoch + 1);
  assert.ok(nextState.validationAccuracy > INITIAL_VISION_MODEL_STATE.validationAccuracy);
  assert.ok(nextState.trainingLoss < INITIAL_VISION_MODEL_STATE.trainingLoss);
  assert.ok(accuracyDelta > 0);
});

test('SLA priority audit catches citizen priority inflation on minor litter claimed as Critical', () => {
  const audit = evaluateSlaPriorityAudit('Critical', 'Illegal Curbside Dump', 'Low', 0.2, true);
  assert.equal(audit.verdict, 'PRIORITY_INFLATED');
  assert.equal(audit.priorityInflationDetected, true);
  assert.equal(audit.slaAdjusted, true);
  assert.equal(audit.citizenClaimedSlaHours, 4);
  assert.equal(audit.aiVerifiedSeverity, 'Low');
  assert.equal(audit.aiVerifiedSlaHours, 48);
  assert.match(audit.auditReason, /Priority inflation flagged/i);
});

test('SLA priority audit caps Critical claims on tiny non-hazardous piles (<0.8T)', () => {
  const audit = evaluateSlaPriorityAudit('Critical', 'Overflowing Bin', 'Critical', 0.2, true);
  assert.equal(audit.verdict, 'PRIORITY_INFLATED');
  assert.equal(audit.aiVerifiedSeverity, 'Low');
  assert.equal(audit.aiVerifiedSlaHours, 48);
});

test('SLA priority audit escalates under-reported Hazardous waste to Critical 4h SLA', () => {
  const audit = evaluateSlaPriorityAudit('Low', 'Hazardous / Chemical', 'Medium', 0.5, true);
  assert.equal(audit.verdict, 'ESCALATED_HAZARD');
  assert.equal(audit.priorityInflationDetected, false);
  assert.equal(audit.aiVerifiedSeverity, 'Critical');
  assert.equal(audit.aiVerifiedSlaHours, 4);
});

test('SLA priority audit verifies honest matching severity and suspends false reports', () => {
  const verified = evaluateSlaPriorityAudit('High', 'Construction Debris', 'High', 4.5, true);
  assert.equal(verified.verdict, 'VERIFIED');
  assert.equal(verified.slaAdjusted, false);
  assert.equal(verified.aiVerifiedSlaHours, 12);

  const blocked = evaluateSlaPriorityAudit('Critical', 'No Waste / False Report', 'Low', 0, false);
  assert.equal(blocked.verdict, 'BLOCKED_FALSE_REPORT');
  assert.equal(blocked.priorityInflationDetected, true);
});

