import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reviewFollowThrough } from '../src/follow-through.ts';

const base = {
  goalStatus: 'active', outcome: 'unknown', obstacle: 'unknown',
  obstacleSource: 'none', scope: 'ordinary',
};
const review = (patch = {}) => reviewFollowThrough({ ...base, ...patch });

test('missing observation asks for outcome without assuming failure', () => {
  assert.equal(review().templateId, 'ask-outcome');
  assert.equal(review({ obstacle: 'time', obstacleSource: 'user-reported' }).templateId, 'ask-outcome');
});
test('pause and closure take precedence over completion pressure', () => {
  assert.equal(review({ goalStatus: 'paused', outcome: 'not-completed' }).templateId, 'respect-pause');
  assert.equal(review({ goalStatus: 'closed', outcome: 'not-completed' }).templateId, 'respect-closure');
});
test('caller-declared qualified-care boundary takes precedence', () => {
  for (const goalStatus of ['active', 'paused', 'closed']) {
    assert.equal(review({ goalStatus, scope: 'qualified-care' }).templateId, 'qualified-handoff');
  }
});
test('completion and adaptation are distinct accepted outcomes', () => {
  assert.equal(review({ outcome: 'completed' }).templateId, 'record-completion');
  assert.equal(review({ outcome: 'adapted' }).templateId, 'record-adaptation');
});
test('missed action without an obstacle asks instead of inventing a cause', () => {
  assert.equal(review({ outcome: 'not-completed' }).templateId, 'ask-obstacle');
});
test('only reported obstacles select adjustment templates', () => {
  const cases = { time: 'resize-commitment', preparation: 'prepare-environment',
    clarity: 'clarify-action', skill: 'request-skill-support',
    concern: 'invite-reflection', fatigue: 'review-load' };
  for (const [obstacle, expected] of Object.entries(cases)) {
    assert.equal(review({ outcome: 'not-completed', obstacle, obstacleSource: 'user-reported' }).templateId, expected);
  }
});
test('contradictory obstacle provenance is rejected', () => {
  assert.equal(review({ obstacle: 'time' }).templateId, 'invalid-state');
  assert.equal(review({ obstacleSource: 'user-reported' }).templateId, 'invalid-state');
});
test('malformed, missing, unknown and extra fields are rejected without echo', () => {
  for (const input of [null, undefined, [], '', 4, {}, { ...base, outcome: 'failed-person' },
    { ...base, journal: 'synthetic-private-marker' }, { ...base, scope: undefined }]) {
    const output = reviewFollowThrough(input);
    assert.equal(output.templateId, 'invalid-state');
    assert.equal(JSON.stringify(output).includes('synthetic-private-marker'), false);
  }
});
test('inherited and symbol fields cannot smuggle additional data', () => {
  assert.equal(reviewFollowThrough(Object.create(base)).templateId, 'invalid-state');
  assert.equal(reviewFollowThrough({ ...base, [Symbol('extra')]: true }).templateId, 'invalid-state');
});
test('accessor data is rejected without running the getter', () => {
  let calls = 0;
  const input = { ...base };
  Object.defineProperty(input, 'outcome', { get() { calls++; return 'unknown'; } });
  assert.equal(reviewFollowThrough(input).templateId, 'invalid-state');
  assert.equal(calls, 0);
});
test('hostile object inspection fails closed', () => {
  const input = new Proxy({}, { getPrototypeOf() { throw new Error('synthetic'); } });
  assert.equal(reviewFollowThrough(input).templateId, 'invalid-state');
});
test('null-prototype JSON-like objects work', () => {
  assert.equal(reviewFollowThrough(Object.assign(Object.create(null), base)).templateId, 'ask-outcome');
});
test('every enum combination remains non-executable and immutable', () => {
  let checked = 0;
  for (const goalStatus of ['active', 'paused', 'closed'])
    for (const outcome of ['unknown', 'completed', 'adapted', 'not-completed'])
      for (const obstacle of ['unknown', 'time', 'preparation', 'clarity', 'skill', 'concern', 'fatigue'])
        for (const obstacleSource of ['none', 'user-reported'])
          for (const scope of ['ordinary', 'qualified-care']) {
            const output = review({ goalStatus, outcome, obstacle, obstacleSource, scope });
            assert.equal(output.executionPermitted, false);
            assert.equal(output.requiresHumanReview, true);
            assert.equal(output.authorityStatus, 'caller-supplied-simulation');
            assert.equal(Object.isFrozen(output), true);
            assert.deepEqual(Object.keys(output).sort(), [
              'authorityStatus', 'executionPermitted', 'requiresHumanReview', 'schemaVersion', 'templateId',
            ]);
            checked++;
          }
  assert.equal(checked, 336);
});
