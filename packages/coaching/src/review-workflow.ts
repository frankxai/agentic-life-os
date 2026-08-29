import {
  COACHING_DOMAINS,
  type CoachReviewBlockCode,
  type CoachReviewBlocked,
  type CoachReviewPlanConforms,
  type CoachReviewSimulationRequest,
  type CoachReviewSimulationResult,
} from './contracts.js';
import { validateCoachingKnowledgeGraph } from './knowledge-graph.js';

function block(
  request: CoachReviewSimulationRequest,
  code: CoachReviewBlockCode,
  reason: string,
): CoachReviewBlocked {
  return {
    conforms: false,
    code,
    authorityStatus: 'caller-supplied-simulation',
    executionPermitted: false,
    requestId: request.requestId,
    reason,
  };
}

function isActive(issuedAt: string, expiresAt: string, revokedAt: string | undefined, evaluatedAt: string): boolean {
  const now = Date.parse(evaluatedAt);
  const issued = Date.parse(issuedAt);
  const expires = Date.parse(expiresAt);
  return (
    Number.isFinite(now) &&
    Number.isFinite(issued) &&
    Number.isFinite(expires) &&
    issued <= now &&
    now < expires &&
    revokedAt === undefined
  );
}

export function simulateCoachReview(request: CoachReviewSimulationRequest): CoachReviewSimulationResult {
  const evaluatedAt = Date.parse(request.evaluatedAt);
  const submittedAt = Date.parse(request.checkIn.submittedAt);
  if (
    !request.requestId.trim() ||
    !Number.isFinite(evaluatedAt) ||
    !request.checkIn.checkInId.trim() ||
    !request.checkIn.programPhaseId.trim() ||
    !Number.isFinite(submittedAt) ||
    submittedAt > evaluatedAt
  ) {
    return block(request, 'invalid-request', 'Request identifier and evaluation timestamp are required.');
  }

  const tenantIds = [
    request.actor.tenantId,
    request.assignment.tenantId,
    request.consent.tenantId,
    request.checkIn.tenantId,
  ];
  if (new Set(tenantIds).size !== 1) {
    return block(request, 'tenant-binding-mismatch', 'Actor, assignment, consent, and check-in must share one tenant.');
  }

  if (!['coach', 'lead-coach'].includes(request.actor.role)) {
    return block(request, 'actor-role-denied', 'Only a coach or lead coach may prepare a review plan.');
  }
  if (
    !request.actor.capabilities.includes('review-assigned-check-in') ||
    !request.actor.capabilities.includes('propose-next-action')
  ) {
    return block(request, 'actor-capability-denied', 'The actor lacks review or next-action capability.');
  }

  if (!isActive(request.assignment.issuedAt, request.assignment.expiresAt, request.assignment.revokedAt, request.evaluatedAt)) {
    return block(request, 'assignment-inactive', 'The assignment is missing, expired, future-dated, or revoked.');
  }
  if (
    request.assignment.coachActorId !== request.actor.actorId ||
    request.assignment.memberRef !== request.checkIn.memberRef ||
    request.assignment.assignmentId !== request.checkIn.assignmentId ||
    request.assignment.programId !== request.checkIn.programId
  ) {
    return block(request, 'assignment-binding-mismatch', 'The assignment does not bind this coach, member, check-in, and program.');
  }

  if (!isActive(request.consent.issuedAt, request.consent.expiresAt, request.consent.revokedAt, request.evaluatedAt)) {
    return block(request, 'consent-inactive', 'Consent is missing, expired, future-dated, or revoked.');
  }
  if (
    request.consent.coachActorId !== request.actor.actorId ||
    request.consent.memberRef !== request.checkIn.memberRef ||
    request.consent.consentId !== request.checkIn.consentId
  ) {
    return block(request, 'consent-binding-mismatch', 'Consent does not bind this coach, member, and check-in.');
  }
  if (!request.consent.capabilities.includes('review-assigned-check-in')) {
    return block(request, 'consent-scope-denied', 'Consent does not include review of this structured check-in.');
  }

  if (request.checkIn.programId !== request.graph.programId) {
    return block(request, 'check-in-binding-mismatch', 'The check-in and knowledge graph must bind to one program.');
  }
  if (request.checkIn.status !== 'submitted') {
    return block(request, 'check-in-state-denied', 'Only a submitted check-in may enter review.');
  }

  if (request.checkIn.sensitivity === 'clinical-restricted') {
    return block(
      request,
      'clinical-scope-referral-required',
      'Clinical-restricted content is outside coaching scope and requires a qualified-care handoff.',
    );
  }

  const submittedDomains = request.checkIn.lensSignals.map((signal) => signal.domain);
  if (
    submittedDomains.length !== COACHING_DOMAINS.length ||
    new Set(submittedDomains).size !== COACHING_DOMAINS.length ||
    COACHING_DOMAINS.some((domain) => !submittedDomains.includes(domain))
  ) {
    return block(request, 'five-lens-contract-denied', 'A structured review requires one signal for each of the five lenses.');
  }

  const graphValidation = validateCoachingKnowledgeGraph(request.graph);
  if (!graphValidation.valid) {
    return block(
      request,
      'knowledge-graph-invalid',
      `The knowledge graph failed ${graphValidation.issues.length} integrity check(s).`,
    );
  }

  const nodeIds = new Set(request.graph.nodes.map((node) => node.nodeId));
  const signalNodeIds = request.checkIn.lensSignals.flatMap((signal) => signal.knowledgeNodeIds);
  if (signalNodeIds.some((nodeId) => !nodeIds.has(nodeId))) {
    return block(request, 'evidence-binding-denied', 'Every lens reference must bind to an existing knowledge node.');
  }

  const evidenceNodeIds = request.proposedAction.evidenceNodeIds;
  const evidenceNodes = request.graph.nodes.filter((node) => evidenceNodeIds.includes(node.nodeId));
  if (
    !request.proposedAction.actionId.trim() ||
    !request.proposedAction.actionTemplateId.trim() ||
    evidenceNodeIds.length === 0 ||
    new Set(evidenceNodeIds).size !== evidenceNodeIds.length ||
    evidenceNodeIds.some((nodeId) => !nodeIds.has(nodeId)) ||
    !evidenceNodes.some((node) => node.domain === request.proposedAction.domain)
  ) {
    return block(
      request,
      'evidence-binding-denied',
      'The proposed action must have unique identifiers and bind to existing evidence nodes in its declared domain.',
    );
  }

  const result: CoachReviewPlanConforms = {
    conforms: true,
    code: 'review-plan-conforms',
    authorityStatus: 'caller-supplied-simulation',
    executionPermitted: false,
    requestId: request.requestId,
    evaluatedAt: request.evaluatedAt,
    tenantId: request.actor.tenantId,
    memberRef: request.checkIn.memberRef,
    coachActorId: request.actor.actorId,
    assignmentId: request.assignment.assignmentId,
    consentId: request.consent.consentId,
    checkInId: request.checkIn.checkInId,
    graphId: request.graph.graphId,
    action: request.proposedAction,
    agreementRequired: ['coach', 'member'],
    auditReceiptDraft: {
      eventType: 'coach-review-plan-prepared',
      actorId: request.actor.actorId,
      memberRef: request.checkIn.memberRef,
      checkInId: request.checkIn.checkInId,
      actionId: request.proposedAction.actionId,
      evidenceNodeIds,
    },
  };

  return result;
}
