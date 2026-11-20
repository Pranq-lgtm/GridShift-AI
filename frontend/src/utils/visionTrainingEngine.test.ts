import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_VISION_MODEL_STATE,
  evaluateCitizenVsAiDiscrepancy,
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
