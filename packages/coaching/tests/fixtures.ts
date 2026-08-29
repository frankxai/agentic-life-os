import type {
  CoachReviewSimulationRequest,
  CoachingKnowledgeGraph,
} from '../src/index.js';

export function makeKnowledgeGraph(): CoachingKnowledgeGraph {
  return {
    graphId: 'graph_program_foundation_v1',
    version: '1.0.0',
    programId: 'program_foundation',
    sources: [
      {
        sourceId: 'source_recovery_guide',
        title: 'Synthetic recovery practice guide',
        publisher: 'Coach Performance OS fixture library',
        canonicalUrl: 'https://example.invalid/evidence/recovery-practice',
        status: 'approved',
        reviewedAt: '2026-08-01T00:00:00.000Z',
        licenseOrRights: 'synthetic-owned-fixture',
      },
    ],
    nodes: [
      {
        nodeId: 'node_load_recovery_balance',
        domain: 'recovery',
        title: 'Load and recovery balance',
        summary: 'A synthetic coaching concept used to review planned practice against self-reported recovery context.',
        visibility: 'program',
        evidenceSourceIds: ['source_recovery_guide'],
        reviewedAt: '2026-08-01T00:00:00.000Z',
      },
      {
        nodeId: 'node_context_window',
        domain: 'context',
        title: 'Available practice window',
        summary: 'A synthetic program constraint used to choose a realistic next practice window.',
        visibility: 'program',
        evidenceSourceIds: ['source_recovery_guide'],
        reviewedAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    relations: [
      {
        relationId: 'relation_context_constrains_load',
        fromNodeId: 'node_context_window',
        toNodeId: 'node_load_recovery_balance',
        type: 'constrains',
        rationale: 'The available practice window constrains the next synthetic program action.',
        evidenceSourceIds: ['source_recovery_guide'],
      },
    ],
  };
}

export function makeReviewRequest(): CoachReviewSimulationRequest {
  return {
    requestId: 'request_review_001',
    evaluatedAt: '2026-08-29T12:00:00.000Z',
    actor: {
      actorId: 'coach_actor_001',
      tenantId: 'tenant_synthetic_001',
      role: 'coach',
      capabilities: ['review-assigned-check-in', 'propose-next-action'],
    },
    assignment: {
      assignmentId: 'assignment_001',
      tenantId: 'tenant_synthetic_001',
      memberRef: 'member_synthetic_001',
      coachActorId: 'coach_actor_001',
      programId: 'program_foundation',
      issuedAt: '2026-08-01T00:00:00.000Z',
      expiresAt: '2026-09-30T00:00:00.000Z',
    },
    consent: {
      consentId: 'consent_001',
      tenantId: 'tenant_synthetic_001',
      memberRef: 'member_synthetic_001',
      coachActorId: 'coach_actor_001',
      capabilities: ['submit-structured-check-in', 'review-assigned-check-in', 'view-agreed-next-action'],
      issuedAt: '2026-08-01T00:00:00.000Z',
      expiresAt: '2026-09-30T00:00:00.000Z',
    },
    checkIn: {
      checkInId: 'check_in_001',
      tenantId: 'tenant_synthetic_001',
      memberRef: 'member_synthetic_001',
      programId: 'program_foundation',
      programPhaseId: 'phase_foundation_02',
      assignmentId: 'assignment_001',
      consentId: 'consent_001',
      submittedAt: '2026-08-29T08:00:00.000Z',
      status: 'submitted',
      sensitivity: 'wellness-structured',
      lensSignals: [
        { domain: 'body', band: 'steady', knowledgeNodeIds: [] },
        { domain: 'mind', band: 'steady', knowledgeNodeIds: [] },
        { domain: 'performance', band: 'rising', knowledgeNodeIds: [] },
        { domain: 'recovery', band: 'watch', knowledgeNodeIds: ['node_load_recovery_balance'] },
        { domain: 'context', band: 'dipping', knowledgeNodeIds: ['node_context_window'] },
      ],
    },
    graph: makeKnowledgeGraph(),
    proposedAction: {
      actionId: 'action_recovery_window',
      actionTemplateId: 'template_short_recovery_practice',
      domain: 'recovery',
      kind: 'adjust-practice',
      cadence: 'this-week',
      evidenceNodeIds: ['node_load_recovery_balance', 'node_context_window'],
      requiresCoachAgreement: true,
      requiresMemberAgreement: true,
    },
  };
}
