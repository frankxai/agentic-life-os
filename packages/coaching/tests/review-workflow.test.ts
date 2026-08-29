import { describe, expect, it } from 'vitest';
import { simulateCoachReview } from '../src/index.js';
import { makeReviewRequest } from './fixtures.js';

describe('simulateCoachReview', () => {
  it('prepares a bounded review plan but never permits execution', () => {
    const result = simulateCoachReview(makeReviewRequest());

    expect(result).toMatchObject({
      conforms: true,
      code: 'review-plan-conforms',
      authorityStatus: 'caller-supplied-simulation',
      executionPermitted: false,
      agreementRequired: ['coach', 'member'],
    });
    if (result.conforms) {
      expect(result.auditReceiptDraft.evidenceNodeIds).toEqual([
        'node_load_recovery_balance',
        'node_context_window',
      ]);
    }
  });

  it('denies cross-tenant review plans', () => {
    const request = makeReviewRequest();
    request.checkIn.tenantId = 'tenant_other';

    expect(simulateCoachReview(request)).toMatchObject({
      conforms: false,
      code: 'tenant-binding-mismatch',
      executionPermitted: false,
    });
  });

  it('denies revoked consent', () => {
    const request = makeReviewRequest();
    request.consent.revokedAt = '2026-08-28T00:00:00.000Z';

    expect(simulateCoachReview(request)).toMatchObject({ conforms: false, code: 'consent-inactive' });
  });

  it('requires the separate next-action capability', () => {
    const request = makeReviewRequest();
    request.actor.capabilities = ['review-assigned-check-in'];

    expect(simulateCoachReview(request)).toMatchObject({
      conforms: false,
      code: 'actor-capability-denied',
    });
  });

  it('stops clinical-restricted content for qualified-care handoff', () => {
    const request = makeReviewRequest();
    request.checkIn.sensitivity = 'clinical-restricted';

    expect(simulateCoachReview(request)).toMatchObject({
      conforms: false,
      code: 'clinical-scope-referral-required',
      executionPermitted: false,
    });
  });

  it('requires one structured signal for every lens', () => {
    const request = makeReviewRequest();
    request.checkIn.lensSignals = request.checkIn.lensSignals.slice(0, 4);

    expect(simulateCoachReview(request)).toMatchObject({
      conforms: false,
      code: 'five-lens-contract-denied',
    });
  });

  it('denies actions that cite knowledge nodes outside the graph', () => {
    const request = makeReviewRequest();
    request.proposedAction.evidenceNodeIds = ['node_missing'];

    expect(simulateCoachReview(request)).toMatchObject({
      conforms: false,
      code: 'evidence-binding-denied',
    });
  });

  it('denies lens signals that cite knowledge nodes outside the graph', () => {
    const request = makeReviewRequest();
    request.checkIn.lensSignals = request.checkIn.lensSignals.map((signal) =>
      signal.domain === 'context' ? { ...signal, knowledgeNodeIds: ['node_missing'] } : signal,
    );

    expect(simulateCoachReview(request)).toMatchObject({
      conforms: false,
      code: 'evidence-binding-denied',
    });
  });

  it('denies future-dated check-ins', () => {
    const request = makeReviewRequest();
    request.checkIn.submittedAt = '2026-08-30T08:00:00.000Z';

    expect(simulateCoachReview(request)).toMatchObject({ conforms: false, code: 'invalid-request' });
  });

  it('requires action evidence from the declared domain', () => {
    const request = makeReviewRequest();
    request.proposedAction.domain = 'body';

    expect(simulateCoachReview(request)).toMatchObject({
      conforms: false,
      code: 'evidence-binding-denied',
    });
  });
});
