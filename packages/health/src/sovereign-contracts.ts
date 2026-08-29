export const HEALTH_SENSITIVITIES = Object.freeze(['public', 'personal', 'clinical', 'genomic'] as const);
export type HealthSensitivity = (typeof HEALTH_SENSITIVITIES)[number];

export const HEALTH_PURPOSES = Object.freeze([
  'self-tracking',
  'wellness-planning',
  'clinician-handoff',
  'personal-research',
] as const);
export type HealthPurpose = (typeof HEALTH_PURPOSES)[number];

export const HEALTH_ACTIONS = Object.freeze([
  'read-vault-metadata',
  'create-second-brain-projection',
  'prepare-clinician-export',
  'prepare-encrypted-local-export',
] as const);
export type HealthAction = (typeof HEALTH_ACTIONS)[number];

export const HEALTH_EGRESS_DESTINATIONS = Object.freeze([
  'second-brain',
  'clinician-handoff',
  'encrypted-local-export',
] as const);
export type HealthEgressDestination = (typeof HEALTH_EGRESS_DESTINATIONS)[number];

export interface HealthCapabilityGrant {
  id: string;
  tenantId: string;
  subjectId: string;
  actorId: string;
  actions: readonly HealthAction[];
  purposes: readonly HealthPurpose[];
  sensitivities: readonly HealthSensitivity[];
  consentId: string;
  egressPolicyId?: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface HealthConsentGrant {
  id: string;
  tenantId: string;
  subjectId: string;
  actorId: string;
  actions: readonly HealthAction[];
  purposes: readonly HealthPurpose[];
  sensitivities: readonly HealthSensitivity[];
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface HealthEgressPolicy {
  id: string;
  tenantId: string;
  allowedDestinations: readonly HealthEgressDestination[];
  allowedPurposes: readonly HealthPurpose[];
  allowedSensitivities: readonly HealthSensitivity[];
  requiresHumanApproval: true;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface HealthHumanApproval {
  id: string;
  tenantId: string;
  subjectId: string;
  actorId: string;
  operationDigest: string;
  payloadDigest: string;
  destination: HealthEgressDestination;
  approvedBy: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

/**
 * Caller-supplied policy snapshot used only for deterministic conformance
 * simulation. It is not an authenticated authority repository and cannot grant
 * execution or egress in the public package.
 */
export interface HealthPolicySimulationRepository {
  resolveCapability(id: string): HealthCapabilityGrant | undefined;
  resolveConsent(id: string): HealthConsentGrant | undefined;
  resolveEgressPolicy(id: string): HealthEgressPolicy | undefined;
  resolveHumanApproval(id: string): HealthHumanApproval | undefined;
}

export interface HealthRuntimeClock {
  now(): Date;
}

export interface HealthAdmissionRequest {
  requestId: string;
  tenantId: string;
  subjectId: string;
  actorId: string;
  capabilityId: string;
  action: HealthAction;
  purpose: HealthPurpose;
  sensitivity: HealthSensitivity;
  resourceId: string;
  destination?: HealthEgressDestination;
  humanApprovalId?: string;
}

export type HealthAdmissionBlockCode =
  | 'invalid-request'
  | 'capability-not-found'
  | 'capability-inactive'
  | 'capability-binding-mismatch'
  | 'capability-scope-denied'
  | 'consent-not-found'
  | 'consent-inactive'
  | 'consent-binding-mismatch'
  | 'consent-scope-denied'
  | 'egress-policy-required'
  | 'egress-policy-not-found'
  | 'egress-policy-inactive'
  | 'egress-policy-binding-mismatch'
  | 'egress-scope-denied'
  | 'human-approval-required'
  | 'human-approval-not-found'
  | 'human-approval-inactive'
  | 'human-approval-binding-mismatch'
  | 'payload-digest-required'
  | 'payload-binding-mismatch'
  | 'sensitivity-ceiling-denied'
  | 'public-runtime-report-only';

export interface HealthPolicyConforms {
  conforms: true;
  code: 'policy-conforms';
  authorityStatus: 'unverified-policy-simulation';
  executionPermitted: false;
  requestId: string;
  evaluatedAt: string;
  operationDigest: string;
  capabilityId: string;
  consentId: string;
  egressPolicyId?: string;
  humanApprovalId?: string;
  payloadDigest?: string;
}

export interface HealthPolicyDoesNotConform {
  conforms: false;
  code: HealthAdmissionBlockCode;
  authorityStatus: 'unverified-policy-simulation';
  executionPermitted: false;
  requestId: string;
  reason: string;
}

export type HealthPolicyConformanceReport = HealthPolicyConforms | HealthPolicyDoesNotConform;

/**
 * The public runtime sees descriptors only. Decryption and raw bytes stay behind
 * a separately encrypted, local adapter owned by the private instance.
 */
export interface HealthRecordDescriptor {
  opaqueRecordRef: string;
  tenantId: string;
  subjectId: string;
  sensitivity: HealthSensitivity;
  contentSha256: string;
  byteLength: number;
  mediaType: string;
  sourceReceiptIds: readonly string[];
}

export interface EncryptedLocalHealthVault {
  readonly boundary: 'separately-encrypted-local-vault';
  listRecordDescriptors(input: {
    tenantId: string;
    subjectId: string;
  }): Promise<readonly HealthRecordDescriptor[]>;
}

export type SafeExportPreparation = { ok: false; decision: HealthPolicyDoesNotConform };

export const WELLNESS_PATTERN_KEYS = Object.freeze([
  'sleep-consistency',
  'training-consistency',
  'meal-consistency',
  'recovery-self-rating',
  'stress-self-rating',
] as const);
export type WellnessPatternKey = (typeof WELLNESS_PATTERN_KEYS)[number];

export const WELLNESS_PATTERN_TRENDS = Object.freeze(['improving', 'stable', 'declining', 'unknown'] as const);
export type WellnessPatternTrend = (typeof WELLNESS_PATTERN_TRENDS)[number];

export interface SecondBrainWellnessPattern {
  key: WellnessPatternKey;
  trend: WellnessPatternTrend;
}

export interface SecondBrainProjectionDraft {
  period: string;
  patterns: readonly SecondBrainWellnessPattern[];
}

export type SecondBrainProjectionPreparation = { ok: false; decision: HealthPolicyDoesNotConform };
