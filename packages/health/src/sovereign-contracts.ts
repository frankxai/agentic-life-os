export const HEALTH_SENSITIVITIES = ['public', 'personal', 'clinical', 'genomic'] as const;
export type HealthSensitivity = (typeof HEALTH_SENSITIVITIES)[number];

export const HEALTH_PURPOSES = [
  'self-tracking',
  'wellness-planning',
  'clinician-handoff',
  'personal-research',
] as const;
export type HealthPurpose = (typeof HEALTH_PURPOSES)[number];

export const HEALTH_ACTIONS = [
  'read-vault-metadata',
  'create-second-brain-projection',
  'prepare-clinician-export',
  'prepare-encrypted-local-export',
] as const;
export type HealthAction = (typeof HEALTH_ACTIONS)[number];

export const HEALTH_EGRESS_DESTINATIONS = [
  'second-brain',
  'clinician-handoff',
  'encrypted-local-export',
] as const;
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

export interface HealthApprovalClaimRequest {
  approvalId: string;
  tenantId: string;
  subjectId: string;
  actorId: string;
  destination: HealthEgressDestination;
  operationDigest: string;
  payloadDigest: string;
}

export type HealthApprovalClaimFailureReason =
  | 'not-found'
  | 'inactive'
  | 'binding-mismatch'
  | 'already-claimed';

export type HealthApprovalClaimResult =
  | ({
      claimed: true;
      claimId: string;
      claimedAt: string;
    } & HealthApprovalClaimRequest)
  | {
      claimed: false;
      reason: HealthApprovalClaimFailureReason;
    };

/**
 * Implementations are part of the trusted local control plane. Request payloads,
 * prompts, files, and agents must never be allowed to implement this interface.
 */
export interface HealthAuthorityRepository {
  resolveCapability(id: string): HealthCapabilityGrant | undefined;
  resolveConsent(id: string): HealthConsentGrant | undefined;
  resolveEgressPolicy(id: string): HealthEgressPolicy | undefined;
  resolveHumanApproval(id: string): HealthHumanApproval | undefined;

  /**
   * Atomically re-resolve the canonical approval, verify that it is active and
   * exactly bound to every supplied field, verify activity against an
   * authority-owned clock, then durably mark it consumed before returning
   * success. Implementations must never split validation and consume into
   * separate transactions or permit a second claim across processes.
   */
  claimHumanApproval(request: HealthApprovalClaimRequest): Promise<HealthApprovalClaimResult>;
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
  | 'human-approval-already-claimed'
  | 'human-approval-claim-failed'
  | 'sensitivity-ceiling-denied';

export interface HealthAdmissionAllowed {
  allowed: true;
  code: 'allowed';
  requestId: string;
  evaluatedAt: string;
  operationDigest: string;
  capabilityId: string;
  consentId: string;
  egressPolicyId?: string;
  humanApprovalId?: string;
  payloadDigest?: string;
  approvalClaimId?: string;
}

export interface HealthAdmissionBlocked {
  allowed: false;
  code: HealthAdmissionBlockCode;
  requestId: string;
  reason: string;
}

export type HealthAdmissionDecision = HealthAdmissionAllowed | HealthAdmissionBlocked;

/**
 * The public runtime sees descriptors only. Decryption and raw bytes stay behind
 * a separately encrypted, local adapter owned by the private instance.
 */
export interface HealthRecordDescriptor {
  recordId: string;
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

export interface SafeExportRecord {
  opaqueRecordRef: string;
  sensitivity: HealthSensitivity;
  contentSha256: string;
  byteLength: number;
  mediaType: string;
  sourceReceiptIds: readonly string[];
}

export interface SafeExportManifest {
  schemaVersion: '1.0.0';
  exportId: string;
  createdAt: string;
  purpose: HealthPurpose;
  destination: Exclude<HealthEgressDestination, 'second-brain'>;
  records: readonly SafeExportRecord[];
  capabilityId: string;
  consentId: string;
  egressPolicyId: string;
  humanApprovalId: string;
  approvalClaimId: string;
  payloadSha256: string;
  manifestSha256: string;
  rawBytesIncluded: false;
  transportPerformed: false;
}

export type SafeExportPreparation =
  | { ok: false; decision: HealthAdmissionBlocked }
  | { ok: true; decision: HealthAdmissionAllowed; manifest: SafeExportManifest };

export interface SecondBrainProjectionDraft {
  title: string;
  summary: string;
  period: string;
  tags: readonly string[];
  sourceRecordDigests: readonly string[];
  sensitivity: Extract<HealthSensitivity, 'public' | 'personal'>;
}

export interface SecondBrainProjectionPayload {
  schemaVersion: '1.0.0';
  kind: 'second-brain-projection-plan';
  title: string;
  summary: string;
  period: string;
  tags: readonly string[];
  sourceRecordDigests: readonly string[];
  sensitivity: Extract<HealthSensitivity, 'public' | 'personal'>;
}

export interface SecondBrainProjectionPlan {
  payload: SecondBrainProjectionPayload;
  payloadSha256: string;
}

export interface SafeExportPayload {
  schemaVersion: '1.0.0';
  kind: 'safe-export-plan';
  purpose: HealthPurpose;
  destination: Exclude<HealthEgressDestination, 'second-brain'>;
  requestSensitivity: HealthSensitivity;
  records: readonly SafeExportRecord[];
}

export interface SafeExportPlan {
  payload: SafeExportPayload;
  payloadSha256: string;
}

export interface SanitizedSecondBrainProjection {
  schemaVersion: '1.0.0';
  projectionId: string;
  createdAt: string;
  title: string;
  summary: string;
  period: string;
  tags: readonly string[];
  sensitivity: Extract<HealthSensitivity, 'public' | 'personal'>;
  sourceRecordDigests: readonly string[];
  payloadSha256: string;
  projectionSha256: string;
  direction: 'health-vault-to-second-brain-only';
  containsRawRecords: false;
  containsVaultLocation: false;
}

export interface OneWaySecondBrainSink {
  writeProjection(projection: SanitizedSecondBrainProjection): Promise<{
    receiptId: string;
    projectionSha256: string;
  }>;
}

export type SecondBrainProjectionPreparation =
  | { ok: false; decision: HealthAdmissionBlocked }
  | {
      ok: true;
      decision: HealthAdmissionAllowed;
      projection: SanitizedSecondBrainProjection;
    };
