export const COACHING_DOMAINS = Object.freeze([
  'body',
  'mind',
  'performance',
  'recovery',
  'context',
] as const);
export type CoachingDomain = (typeof COACHING_DOMAINS)[number];

export const COACHING_ROLES = Object.freeze([
  'member',
  'coach',
  'lead-coach',
  'organization-owner',
  'evidence-reviewer',
] as const);
export type CoachingRole = (typeof COACHING_ROLES)[number];

export const COACHING_CAPABILITIES = Object.freeze([
  'view-assigned-program',
  'submit-structured-check-in',
  'view-agreed-next-action',
  'manage-own-consent',
  'review-assigned-check-in',
  'propose-next-action',
  'request-referral-handoff',
  'review-program-quality',
  'review-evidence-provenance',
  'manage-organization-roles',
] as const);
export type CoachingCapability = (typeof COACHING_CAPABILITIES)[number];

export const CHECK_IN_SIGNAL_BANDS = Object.freeze([
  'steady',
  'rising',
  'dipping',
  'watch',
] as const);
export type CheckInSignalBand = (typeof CHECK_IN_SIGNAL_BANDS)[number];

export interface CoachingActorSnapshot {
  actorId: string;
  tenantId: string;
  role: CoachingRole;
  capabilities: readonly CoachingCapability[];
}

export interface CoachingAssignmentSnapshot {
  assignmentId: string;
  tenantId: string;
  memberRef: string;
  coachActorId: string;
  programId: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface CoachingConsentSnapshot {
  consentId: string;
  tenantId: string;
  memberRef: string;
  coachActorId: string;
  capabilities: readonly Extract<
    CoachingCapability,
    'submit-structured-check-in' | 'review-assigned-check-in' | 'view-agreed-next-action'
  >[];
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface EvidenceSource {
  sourceId: string;
  title: string;
  publisher: string;
  canonicalUrl: string;
  status: 'approved' | 'review-required' | 'blocked';
  reviewedAt: string;
  licenseOrRights: string;
}

export interface KnowledgeNode {
  nodeId: string;
  domain: CoachingDomain;
  title: string;
  summary: string;
  visibility: 'public' | 'program';
  evidenceSourceIds: readonly string[];
  reviewedAt: string;
}

export const KNOWLEDGE_RELATION_TYPES = Object.freeze([
  'supports',
  'prepares-for',
  'depends-on',
  'constrains',
  'balances',
  'requires-referral-boundary',
] as const);
export type KnowledgeRelationType = (typeof KNOWLEDGE_RELATION_TYPES)[number];

export interface KnowledgeRelation {
  relationId: string;
  fromNodeId: string;
  toNodeId: string;
  type: KnowledgeRelationType;
  rationale: string;
  evidenceSourceIds: readonly string[];
}

export interface CoachingKnowledgeGraph {
  graphId: string;
  version: string;
  programId: string;
  sources: readonly EvidenceSource[];
  nodes: readonly KnowledgeNode[];
  relations: readonly KnowledgeRelation[];
}

export interface StructuredLensSignal {
  domain: CoachingDomain;
  band: CheckInSignalBand;
  knowledgeNodeIds: readonly string[];
}

export interface StructuredCheckInDescriptor {
  checkInId: string;
  tenantId: string;
  memberRef: string;
  programId: string;
  programPhaseId: string;
  assignmentId: string;
  consentId: string;
  submittedAt: string;
  status: 'submitted' | 'reviewed' | 'referral-required';
  sensitivity: 'wellness-structured' | 'clinical-restricted';
  lensSignals: readonly StructuredLensSignal[];
}

export interface NextActionDraft {
  actionId: string;
  actionTemplateId: string;
  domain: CoachingDomain;
  kind: 'continue-program' | 'adjust-practice' | 'recovery-practice' | 'referral-handoff';
  cadence: 'today' | 'this-week' | 'this-phase';
  evidenceNodeIds: readonly string[];
  requiresCoachAgreement: true;
  requiresMemberAgreement: true;
}

export interface CoachReviewSimulationRequest {
  requestId: string;
  evaluatedAt: string;
  actor: CoachingActorSnapshot;
  assignment: CoachingAssignmentSnapshot;
  consent: CoachingConsentSnapshot;
  checkIn: StructuredCheckInDescriptor;
  graph: CoachingKnowledgeGraph;
  proposedAction: NextActionDraft;
}

export type CoachReviewBlockCode =
  | 'invalid-request'
  | 'tenant-binding-mismatch'
  | 'actor-role-denied'
  | 'actor-capability-denied'
  | 'assignment-inactive'
  | 'assignment-binding-mismatch'
  | 'consent-inactive'
  | 'consent-binding-mismatch'
  | 'consent-scope-denied'
  | 'check-in-binding-mismatch'
  | 'check-in-state-denied'
  | 'five-lens-contract-denied'
  | 'knowledge-graph-invalid'
  | 'evidence-binding-denied'
  | 'clinical-scope-referral-required'
  | 'public-runtime-report-only';

export interface CoachReviewBlocked {
  conforms: false;
  code: CoachReviewBlockCode;
  authorityStatus: 'caller-supplied-simulation';
  executionPermitted: false;
  requestId: string;
  reason: string;
}

export interface CoachReviewPlanConforms {
  conforms: true;
  code: 'review-plan-conforms';
  authorityStatus: 'caller-supplied-simulation';
  executionPermitted: false;
  requestId: string;
  evaluatedAt: string;
  tenantId: string;
  memberRef: string;
  coachActorId: string;
  assignmentId: string;
  consentId: string;
  checkInId: string;
  graphId: string;
  action: NextActionDraft;
  agreementRequired: readonly ['coach', 'member'];
  auditReceiptDraft: {
    eventType: 'coach-review-plan-prepared';
    actorId: string;
    memberRef: string;
    checkInId: string;
    actionId: string;
    evidenceNodeIds: readonly string[];
  };
}

export type CoachReviewSimulationResult = CoachReviewBlocked | CoachReviewPlanConforms;
