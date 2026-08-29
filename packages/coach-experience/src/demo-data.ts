import type {
  CoachReviewSimulationRequest,
  CoachingDomain,
  CoachingKnowledgeGraph,
} from '@frankx-ai/agentic-coaching-os';

export type LensPresentation = {
  domain: CoachingDomain;
  label: string;
  band: 'steady' | 'rising' | 'dipping' | 'watch';
  signal: string;
  detail: string;
};

export const lensPresentations: readonly LensPresentation[] = [
  { domain: 'body', label: 'Body', band: 'steady', signal: 'Ready', detail: 'Movement quality is consistent with this phase.' },
  { domain: 'mind', label: 'Mind', band: 'steady', signal: 'Clear', detail: 'Attention is available for focused practice.' },
  { domain: 'performance', label: 'Performance', band: 'rising', signal: 'Building', detail: 'The current skill block is progressing.' },
  { domain: 'recovery', label: 'Recovery', band: 'watch', signal: 'Protect', detail: 'Preserve the recovery window before adding load.' },
  { domain: 'context', label: 'Context', band: 'dipping', signal: 'Narrow', detail: 'Today offers one realistic practice window.' },
] as const;

export const knowledgeGraph: CoachingKnowledgeGraph = {
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
    {
      sourceId: 'source_practice_design',
      title: 'Synthetic focused-practice standard',
      publisher: 'Coach Performance OS fixture library',
      canonicalUrl: 'https://example.invalid/evidence/focused-practice',
      status: 'approved',
      reviewedAt: '2026-08-08T00:00:00.000Z',
      licenseOrRights: 'synthetic-owned-fixture',
    },
  ],
  nodes: [
    {
      nodeId: 'node_context_window',
      domain: 'context',
      title: 'Available practice window',
      summary: 'A bounded program constraint used to select a realistic next practice window.',
      visibility: 'program',
      evidenceSourceIds: ['source_recovery_guide'],
      reviewedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      nodeId: 'node_load_recovery_balance',
      domain: 'recovery',
      title: 'Load and recovery balance',
      summary: 'A coaching concept used to review planned practice against self-reported recovery context.',
      visibility: 'program',
      evidenceSourceIds: ['source_recovery_guide'],
      reviewedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      nodeId: 'node_deliberate_repetition',
      domain: 'performance',
      title: 'Deliberate repetition',
      summary: 'A focused-practice pattern that favors one observable skill over diffuse volume.',
      visibility: 'program',
      evidenceSourceIds: ['source_practice_design'],
      reviewedAt: '2026-08-08T00:00:00.000Z',
    },
  ],
  relations: [
    {
      relationId: 'relation_context_constrains_load',
      fromNodeId: 'node_context_window',
      toNodeId: 'node_load_recovery_balance',
      type: 'constrains',
      rationale: 'The available practice window constrains the next program action.',
      evidenceSourceIds: ['source_recovery_guide'],
    },
    {
      relationId: 'relation_recovery_prepares_performance',
      fromNodeId: 'node_load_recovery_balance',
      toNodeId: 'node_deliberate_repetition',
      type: 'prepares-for',
      rationale: 'Protected recovery preserves the quality of the next focused repetition.',
      evidenceSourceIds: ['source_recovery_guide', 'source_practice_design'],
    },
  ],
};

export const reviewRequest: CoachReviewSimulationRequest = {
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
    lensSignals: lensPresentations.map(({ domain, band }) => ({
      domain,
      band,
      knowledgeNodeIds:
        domain === 'recovery'
          ? ['node_load_recovery_balance']
          : domain === 'context'
            ? ['node_context_window']
            : domain === 'performance'
              ? ['node_deliberate_repetition']
              : [],
    })),
  },
  graph: knowledgeGraph,
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

export const coachDecisionOptions = {
  adjust: {
    label: 'Prepare adjustment',
    title: 'Protect recovery. Keep one focused practice.',
    proposedAction: reviewRequest.proposedAction,
  },
  continue: {
    label: 'Continue phase',
    title: 'Continue the phase with one deliberate repetition.',
    proposedAction: {
      ...reviewRequest.proposedAction,
      actionId: 'action_continue_phase',
      actionTemplateId: 'template_continue_focused_practice',
      domain: 'performance' as const,
      kind: 'continue-program' as const,
      evidenceNodeIds: ['node_deliberate_repetition'],
    },
  },
  referral: {
    label: 'Request referral',
    title: 'Stop the coaching action and prepare a qualified-care handoff.',
    proposedAction: {
      ...reviewRequest.proposedAction,
      actionId: 'action_referral_handoff',
      actionTemplateId: 'template_qualified_care_handoff',
      domain: 'context' as const,
      kind: 'referral-handoff' as const,
      evidenceNodeIds: ['node_context_window'],
    },
  },
} as const;

export type CoachDecisionKey = keyof typeof coachDecisionOptions;

export const memberCapabilities = [
  ['Program', 'View the current phase, method, practices, and coach-curated knowledge.'],
  ['Check-in', 'Share five structured, non-clinical signals for an assigned coach to review.'],
  ['Next action', 'Read and agree to one bounded action after the coach prepares it.'],
  ['Consent', 'See and manage the capabilities granted to the assigned coaching relationship.'],
] as const;

export const coachCapabilities = [
  ['Review', 'Open only assigned check-ins with current consent and program binding.'],
  ['Evidence', 'Trace every proposed action to reviewed program knowledge.'],
  ['Decide', 'Continue, adjust a practice, or stop for a qualified-care referral.'],
  ['Prove', 'Prepare a non-executable audit receipt for coach and member agreement.'],
] as const;
