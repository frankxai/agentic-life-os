import {
  HEALTH_ACTIONS,
  HEALTH_EGRESS_DESTINATIONS,
  HEALTH_PURPOSES,
  HEALTH_SENSITIVITIES,
  type HealthAdmissionAllowed,
  type HealthAdmissionBlocked,
  type HealthAdmissionDecision,
  type HealthAdmissionRequest,
  type HealthApprovalClaimRequest,
  type HealthAuthorityRepository,
  type HealthEgressDestination,
  type HealthRecordDescriptor,
  type HealthRuntimeClock,
  type HealthSensitivity,
  type SafeExportManifest,
  type SafeExportPlan,
  type SafeExportPreparation,
  type SafeExportRecord,
  type SanitizedSecondBrainProjection,
  type SecondBrainProjectionDraft,
  type SecondBrainProjectionPlan,
  type SecondBrainProjectionPreparation,
} from './sovereign-contracts.js';
import {
  assertIsoTimestamp,
  assertSafeId,
  canonicalJson,
  isSha256,
  sha256Hex,
} from './integrity.js';

const SYSTEM_CLOCK: HealthRuntimeClock = { now: () => new Date() };
const SENSITIVITY_RANK: Record<HealthSensitivity, number> = {
  public: 0,
  personal: 1,
  clinical: 2,
  genomic: 3,
};

const DESTINATION_CEILINGS: Record<HealthEgressDestination, HealthSensitivity> = {
  'second-brain': 'personal',
  'clinician-handoff': 'clinical',
  'encrypted-local-export': 'genomic',
};

const DESTINATION_BY_ACTION: Partial<Record<HealthAdmissionRequest['action'], HealthEgressDestination>> = {
  'create-second-brain-projection': 'second-brain',
  'prepare-clinician-export': 'clinician-handoff',
  'prepare-encrypted-local-export': 'encrypted-local-export',
};

function assertOnlyKeys(value: object, allowed: readonly string[], label: string): void {
  const keySet = new Set(allowed);
  if (Object.keys(value).some((key) => !keySet.has(key))) {
    throw new Error(`${label} contains unknown fields`);
  }
}

function isEnumValue<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function assertEnumArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string
): asserts value is readonly T[] {
  if (!Array.isArray(value) || value.some((entry) => !isEnumValue(allowed, entry))) {
    throw new Error(`${label} contains an unknown enum value`);
  }
}

function assertSafeRuntimeId(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
  assertSafeId(value, label);
}

function blocked(
  request: Pick<HealthAdmissionRequest, 'requestId'> | unknown,
  code: HealthAdmissionBlocked['code'],
  reason: string
): HealthAdmissionBlocked {
  const requestId =
    request !== null &&
    typeof request === 'object' &&
    typeof (request as { requestId?: unknown }).requestId === 'string'
      ? (request as { requestId: string }).requestId
      : 'invalid-request';
  return { allowed: false, code, requestId, reason };
}

function isActive(
  record: { issuedAt: string; expiresAt: string; revokedAt?: string },
  now: Date
): boolean {
  assertIsoTimestamp(record.issuedAt, 'issuedAt');
  assertIsoTimestamp(record.expiresAt, 'expiresAt');
  if (record.revokedAt !== undefined) assertIsoTimestamp(record.revokedAt, 'revokedAt');
  const instant = now.getTime();
  return (
    Date.parse(record.issuedAt) <= instant &&
    instant < Date.parse(record.expiresAt) &&
    (record.revokedAt === undefined || instant < Date.parse(record.revokedAt))
  );
}

function sameBinding(
  record: { tenantId: string; subjectId: string; actorId: string },
  request: HealthAdmissionRequest
): boolean {
  return (
    record.tenantId === request.tenantId &&
    record.subjectId === request.subjectId &&
    record.actorId === request.actorId
  );
}

function assertGrantScopes(record: {
  actions: readonly HealthAdmissionRequest['action'][];
  purposes: readonly HealthAdmissionRequest['purpose'][];
  sensitivities: readonly HealthAdmissionRequest['sensitivity'][];
}): void {
  assertEnumArray(record.actions, HEALTH_ACTIONS, 'Authority actions');
  assertEnumArray(record.purposes, HEALTH_PURPOSES, 'Authority purposes');
  assertEnumArray(record.sensitivities, HEALTH_SENSITIVITIES, 'Authority sensitivities');
}

function includesScope(
  record: {
    actions: readonly HealthAdmissionRequest['action'][];
    purposes: readonly HealthAdmissionRequest['purpose'][];
    sensitivities: readonly HealthAdmissionRequest['sensitivity'][];
  },
  request: HealthAdmissionRequest
): boolean {
  assertGrantScopes(record);
  return (
    record.actions.includes(request.action) &&
    record.purposes.includes(request.purpose) &&
    record.sensitivities.includes(request.sensitivity)
  );
}

function validateRequest(request: HealthAdmissionRequest): void {
  if (request === null || typeof request !== 'object') {
    throw new Error('Health admission request must be an object');
  }
  assertOnlyKeys(
    request,
    [
      'requestId',
      'tenantId',
      'subjectId',
      'actorId',
      'capabilityId',
      'action',
      'purpose',
      'sensitivity',
      'resourceId',
      'destination',
      'humanApprovalId',
    ],
    'Health admission request'
  );
  for (const [label, value] of [
    ['requestId', request.requestId],
    ['tenantId', request.tenantId],
    ['subjectId', request.subjectId],
    ['actorId', request.actorId],
    ['capabilityId', request.capabilityId],
    ['resourceId', request.resourceId],
  ] as const) {
    assertSafeRuntimeId(value, label);
  }
  if (!isEnumValue(HEALTH_ACTIONS, request.action)) throw new Error('Unknown health action');
  if (!isEnumValue(HEALTH_PURPOSES, request.purpose)) throw new Error('Unknown health purpose');
  if (!isEnumValue(HEALTH_SENSITIVITIES, request.sensitivity)) throw new Error('Unknown sensitivity');
  if (
    request.destination !== undefined &&
    !isEnumValue(HEALTH_EGRESS_DESTINATIONS, request.destination)
  ) {
    throw new Error('Unknown egress destination');
  }
  if (request.humanApprovalId !== undefined) {
    assertSafeRuntimeId(request.humanApprovalId, 'humanApprovalId');
  }

  const expectedDestination = DESTINATION_BY_ACTION[request.action];
  if (expectedDestination !== request.destination) {
    throw new Error(
      expectedDestination === undefined
        ? 'This action must not declare an egress destination'
        : `This action requires the ${expectedDestination} destination`
    );
  }
}

export function healthOperationDigest(request: HealthAdmissionRequest): string {
  validateRequest(request);
  const { humanApprovalId: _humanApprovalId, ...approvalBoundRequest } = request;
  return sha256Hex(canonicalJson(approvalBoundRequest));
}

function assertProjectionTextSafe(value: unknown, label: string, maxLength: number): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maxLength ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error(`${label} must be non-empty, bounded, single-line text`);
  }

  const forbidden = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:mrn|medical record|patient id|date of birth|dob)\s*[:#]/i,
    /\b(?:bearer|api[_ -]?key|access[_ -]?token|password)\s*[:=]/i,
    /\b\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/,
    /\b(?:\+?\d[\d .()-]{7,}\d)\b/,
    /file:\/\/[A-Za-z]:\//i,
    /(?:^|\s)[A-Za-z]:\\(?:Users|Documents)\\/i,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  ];
  if (forbidden.some((pattern) => pattern.test(value))) {
    throw new Error(`${label} contains a direct identifier, credential, or local path`);
  }
}

/**
 * Produces the exact canonical payload that a human approval must bind. Runtime
 * timestamps and authority identifiers are intentionally excluded.
 */
export function createSecondBrainProjectionPlan(
  draft: SecondBrainProjectionDraft
): SecondBrainProjectionPlan {
  if (draft === null || typeof draft !== 'object') {
    throw new Error('Second Brain projection draft must be an object');
  }
  assertOnlyKeys(
    draft,
    ['title', 'summary', 'period', 'tags', 'sourceRecordDigests', 'sensitivity'],
    'Second Brain projection draft'
  );
  assertProjectionTextSafe(draft.title, 'title', 120);
  assertProjectionTextSafe(draft.summary, 'summary', 1_000);

  const title = draft.title.normalize('NFC');
  const summary = draft.summary.normalize('NFC');
  assertProjectionTextSafe(title, 'title', 120);
  assertProjectionTextSafe(summary, 'summary', 1_000);
  const period = typeof draft.period === 'string' ? draft.period.normalize('NFC') : draft.period;
  if (typeof period !== 'string' || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(period)) {
    throw new Error('period must use month precision (YYYY-MM)');
  }
  if (
    !isEnumValue(HEALTH_SENSITIVITIES, draft.sensitivity) ||
    (draft.sensitivity !== 'public' && draft.sensitivity !== 'personal')
  ) {
    throw new Error('Second Brain projections cannot carry clinical or genomic sensitivity');
  }
  if (!Array.isArray(draft.tags) || draft.tags.length > 12) {
    throw new Error('tags must be unique and limited to 12 values');
  }
  const tags = draft.tags.map((tag) => {
    if (typeof tag !== 'string') throw new Error('tags must be strings');
    const normalized = tag.normalize('NFC');
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(normalized)) {
      throw new Error('tags must be bounded lowercase slugs');
    }
    return normalized;
  });
  if (new Set(tags).size !== tags.length) {
    throw new Error('tags must be unique and limited to 12 values');
  }
  if (
    !Array.isArray(draft.sourceRecordDigests) ||
    draft.sourceRecordDigests.length === 0 ||
    draft.sourceRecordDigests.length > 32
  ) {
    throw new Error('sourceRecordDigests must contain 1 to 32 hashes');
  }
  if (
    !draft.sourceRecordDigests.every(isSha256) ||
    new Set(draft.sourceRecordDigests).size !== draft.sourceRecordDigests.length
  ) {
    throw new Error('sourceRecordDigests must contain unique SHA-256 values');
  }

  const payload = Object.freeze({
    schemaVersion: '1.0.0' as const,
    kind: 'second-brain-projection-plan' as const,
    title,
    summary,
    period,
    tags: Object.freeze([...tags].sort()),
    sensitivity: draft.sensitivity,
    sourceRecordDigests: Object.freeze([...draft.sourceRecordDigests].sort()),
  });
  return Object.freeze({
    payload,
    payloadSha256: sha256Hex(canonicalJson(payload)),
  });
}

function normalizeSafeExportRecord(
  request: HealthAdmissionRequest,
  record: HealthRecordDescriptor
): SafeExportRecord {
  if (record === null || typeof record !== 'object') {
    throw new Error('Health record descriptor must be an object');
  }
  assertOnlyKeys(
    record,
    [
      'recordId',
      'tenantId',
      'subjectId',
      'sensitivity',
      'contentSha256',
      'byteLength',
      'mediaType',
      'sourceReceiptIds',
    ],
    'Health record descriptor'
  );
  assertSafeRuntimeId(record.recordId, 'recordId');
  if (record.tenantId !== request.tenantId || record.subjectId !== request.subjectId) {
    throw new Error('Export record belongs to another tenant or subject');
  }
  if (!isEnumValue(HEALTH_SENSITIVITIES, record.sensitivity)) {
    throw new Error('Record sensitivity is unknown');
  }
  if (!isSha256(record.contentSha256)) throw new Error('Record content hash must be SHA-256');
  if (!Number.isSafeInteger(record.byteLength) || record.byteLength < 0) {
    throw new Error('Record byte length must be a non-negative safe integer');
  }

  // Both values have been validated against HEALTH_SENSITIVITIES before indexing.
  if (SENSITIVITY_RANK[record.sensitivity] > SENSITIVITY_RANK[request.sensitivity]) {
    throw new Error('Record sensitivity exceeds the admitted export sensitivity');
  }
  if (
    typeof record.mediaType !== 'string' ||
    !/^[a-z0-9][a-z0-9.+-]+\/[a-z0-9][a-z0-9.+-]+$/i.test(record.mediaType)
  ) {
    throw new Error('Record media type must be explicit');
  }
  if (!Array.isArray(record.sourceReceiptIds) || record.sourceReceiptIds.length > 64) {
    throw new Error('Record source receipt IDs must be a bounded array');
  }
  if (new Set(record.sourceReceiptIds).size !== record.sourceReceiptIds.length) {
    throw new Error('Record source receipt IDs must be unique');
  }
  for (const receiptId of record.sourceReceiptIds) {
    assertSafeRuntimeId(receiptId, 'sourceReceiptId');
  }

  return Object.freeze({
    opaqueRecordRef: `record:${sha256Hex(record.recordId)}`,
    sensitivity: record.sensitivity,
    contentSha256: record.contentSha256,
    byteLength: record.byteLength,
    mediaType: record.mediaType.toLowerCase(),
    sourceReceiptIds: Object.freeze([...record.sourceReceiptIds].sort()),
  });
}

/** Produces the exact canonical export record set that an approval must bind. */
export function createSafeExportPlan(
  request: HealthAdmissionRequest,
  records: readonly HealthRecordDescriptor[]
): SafeExportPlan {
  validateRequest(request);
  if (request.destination === undefined || request.destination === 'second-brain') {
    throw new Error('Safe exports require a clinician or encrypted-local destination');
  }
  if (!Array.isArray(records) || records.length === 0 || records.length > 128) {
    throw new Error('Export requires 1 to 128 records');
  }

  const safeRecords = records
    .map((record) => normalizeSafeExportRecord(request, record))
    .sort((left, right) => left.opaqueRecordRef.localeCompare(right.opaqueRecordRef));
  if (new Set(safeRecords.map((record) => record.opaqueRecordRef)).size !== safeRecords.length) {
    throw new Error('Export records must be unique');
  }

  const payload = Object.freeze({
    schemaVersion: '1.0.0' as const,
    kind: 'safe-export-plan' as const,
    purpose: request.purpose,
    destination: request.destination,
    requestSensitivity: request.sensitivity,
    records: Object.freeze(safeRecords),
  });
  return Object.freeze({
    payload,
    payloadSha256: sha256Hex(canonicalJson(payload)),
  });
}

function createProjection(
  plan: SecondBrainProjectionPlan,
  createdAt: string
): SanitizedSecondBrainProjection {
  const body = {
    schemaVersion: '1.0.0' as const,
    createdAt,
    title: plan.payload.title,
    summary: plan.payload.summary,
    period: plan.payload.period,
    tags: plan.payload.tags,
    sensitivity: plan.payload.sensitivity,
    sourceRecordDigests: plan.payload.sourceRecordDigests,
    payloadSha256: plan.payloadSha256,
    direction: 'health-vault-to-second-brain-only' as const,
    containsRawRecords: false as const,
    containsVaultLocation: false as const,
  };
  const projectionSha256 = sha256Hex(canonicalJson(body));
  return Object.freeze({
    ...body,
    projectionId: `sbp:${projectionSha256}`,
    projectionSha256,
  });
}

function validateAuthorityEgressPolicy(policy: {
  allowedDestinations: readonly HealthEgressDestination[];
  allowedPurposes: readonly HealthAdmissionRequest['purpose'][];
  allowedSensitivities: readonly HealthSensitivity[];
  requiresHumanApproval: true;
}): void {
  assertEnumArray(policy.allowedDestinations, HEALTH_EGRESS_DESTINATIONS, 'Egress destinations');
  assertEnumArray(policy.allowedPurposes, HEALTH_PURPOSES, 'Egress purposes');
  assertEnumArray(policy.allowedSensitivities, HEALTH_SENSITIVITIES, 'Egress sensitivities');
  if (policy.requiresHumanApproval !== true) {
    throw new Error('Egress policy must require human approval');
  }
}

export class SovereignHealthRuntime {
  readonly mode = 'local-open-core-runtime' as const;

  constructor(
    private readonly authority: HealthAuthorityRepository,
    private readonly clock: HealthRuntimeClock = SYSTEM_CLOCK
  ) {}

  /**
   * Read-only admission preview. Egress cannot be admitted through this method:
   * a runtime-computed payload digest and atomic approval claim are mandatory.
   */
  authorize(request: HealthAdmissionRequest): HealthAdmissionDecision {
    return this.authorizeInternal(request);
  }

  private authorizeInternal(
    request: HealthAdmissionRequest,
    payloadDigest?: string
  ): HealthAdmissionDecision {
    try {
      validateRequest(request);
      const now = this.clock.now();
      if (!Number.isFinite(now.getTime())) {
        return blocked(request, 'invalid-request', 'Runtime clock returned an invalid time');
      }

      const capability = this.authority.resolveCapability(request.capabilityId);
      if (capability === undefined) {
        return blocked(request, 'capability-not-found', 'No authority-owned capability exists');
      }
      if (!isActive(capability, now)) {
        return blocked(request, 'capability-inactive', 'Capability is not currently active');
      }
      assertSafeRuntimeId(capability.id, 'capability.id');
      assertSafeRuntimeId(capability.consentId, 'capability.consentId');
      if (capability.egressPolicyId !== undefined) {
        assertSafeRuntimeId(capability.egressPolicyId, 'capability.egressPolicyId');
      }
      if (capability.id !== request.capabilityId || !sameBinding(capability, request)) {
        return blocked(
          request,
          'capability-binding-mismatch',
          'Capability belongs to another tenant, subject, or actor'
        );
      }
      if (!includesScope(capability, request)) {
        return blocked(
          request,
          'capability-scope-denied',
          'Capability does not grant this action, purpose, and sensitivity'
        );
      }

      const consent = this.authority.resolveConsent(capability.consentId);
      if (consent === undefined) {
        return blocked(request, 'consent-not-found', 'Capability has no current authority-owned consent');
      }
      if (!isActive(consent, now)) {
        return blocked(request, 'consent-inactive', 'Consent is expired, revoked, or not yet active');
      }
      assertSafeRuntimeId(consent.id, 'consent.id');
      if (consent.id !== capability.consentId || !sameBinding(consent, request)) {
        return blocked(
          request,
          'consent-binding-mismatch',
          'Consent belongs to another tenant, subject, or actor'
        );
      }
      if (!includesScope(consent, request)) {
        return blocked(
          request,
          'consent-scope-denied',
          'Consent does not cover this action, purpose, and sensitivity'
        );
      }

      const operationDigest = healthOperationDigest(request);
      if (request.destination === undefined) {
        return {
          allowed: true,
          code: 'allowed',
          requestId: request.requestId,
          evaluatedAt: now.toISOString(),
          operationDigest,
          capabilityId: capability.id,
          consentId: consent.id,
        };
      }

      const destinationCeiling = DESTINATION_CEILINGS[request.destination];
      // Request destination and sensitivity were validated before both rank lookups.
      if (SENSITIVITY_RANK[request.sensitivity] > SENSITIVITY_RANK[destinationCeiling]) {
        return blocked(
          request,
          'sensitivity-ceiling-denied',
          'Destination has a lower hard sensitivity ceiling'
        );
      }
      if (capability.egressPolicyId === undefined) {
        return blocked(request, 'egress-policy-required', 'Egress requires an authority-owned policy');
      }
      const egress = this.authority.resolveEgressPolicy(capability.egressPolicyId);
      if (egress === undefined) {
        return blocked(request, 'egress-policy-not-found', 'Egress policy was not found');
      }
      if (!isActive(egress, now)) {
        return blocked(request, 'egress-policy-inactive', 'Egress policy is not currently active');
      }
      assertSafeRuntimeId(egress.id, 'egress.id');
      if (egress.tenantId !== request.tenantId || egress.id !== capability.egressPolicyId) {
        return blocked(
          request,
          'egress-policy-binding-mismatch',
          'Egress policy belongs to another tenant'
        );
      }
      validateAuthorityEgressPolicy(egress);
      if (
        !egress.allowedDestinations.includes(request.destination) ||
        !egress.allowedPurposes.includes(request.purpose) ||
        !egress.allowedSensitivities.includes(request.sensitivity)
      ) {
        return blocked(
          request,
          'egress-scope-denied',
          'Egress policy does not cover this destination, purpose, and sensitivity'
        );
      }
      if (payloadDigest === undefined) {
        return blocked(
          request,
          'payload-digest-required',
          'Egress requires a runtime-computed canonical payload digest'
        );
      }
      if (!isSha256(payloadDigest)) {
        return blocked(request, 'invalid-request', 'Egress payload digest must be SHA-256');
      }
      if (request.humanApprovalId === undefined) {
        return blocked(request, 'human-approval-required', 'Egress requires current human approval');
      }
      const approval = this.authority.resolveHumanApproval(request.humanApprovalId);
      if (approval === undefined) {
        return blocked(
          request,
          'human-approval-not-found',
          'Human approval was not found in the authority repository'
        );
      }
      if (!isActive(approval, now)) {
        return blocked(
          request,
          'human-approval-inactive',
          'Human approval is expired, revoked, or not yet active'
        );
      }
      assertSafeRuntimeId(approval.id, 'approval.id');
      assertSafeRuntimeId(approval.approvedBy, 'approval.approvedBy');
      if (!isEnumValue(HEALTH_EGRESS_DESTINATIONS, approval.destination)) {
        throw new Error('Human approval contains an unknown destination');
      }
      if (!isSha256(approval.operationDigest) || !isSha256(approval.payloadDigest)) {
        throw new Error('Human approval digests must be SHA-256');
      }
      if (
        approval.id !== request.humanApprovalId ||
        !sameBinding(approval, request) ||
        approval.destination !== request.destination ||
        approval.operationDigest !== operationDigest
      ) {
        return blocked(
          request,
          'human-approval-binding-mismatch',
          'Human approval is not bound to this exact operation'
        );
      }
      if (approval.payloadDigest !== payloadDigest) {
        return blocked(
          request,
          'payload-binding-mismatch',
          'Human approval is not bound to this exact normalized payload'
        );
      }

      return {
        allowed: true,
        code: 'allowed',
        requestId: request.requestId,
        evaluatedAt: now.toISOString(),
        operationDigest,
        capabilityId: capability.id,
        consentId: consent.id,
        egressPolicyId: egress.id,
        humanApprovalId: approval.id,
        payloadDigest,
      };
    } catch (error) {
      return blocked(
        request,
        'invalid-request',
        error instanceof Error ? error.message : 'Request or authority record is malformed'
      );
    }
  }

  private async claimEgressApproval(
    request: HealthAdmissionRequest,
    decision: HealthAdmissionAllowed
  ): Promise<HealthAdmissionDecision> {
    if (
      request.destination === undefined ||
      decision.humanApprovalId === undefined ||
      decision.payloadDigest === undefined
    ) {
      return blocked(request, 'human-approval-claim-failed', 'Egress admission is incomplete');
    }

    const claimRequest: HealthApprovalClaimRequest = {
      approvalId: decision.humanApprovalId,
      tenantId: request.tenantId,
      subjectId: request.subjectId,
      actorId: request.actorId,
      destination: request.destination,
      operationDigest: decision.operationDigest,
      payloadDigest: decision.payloadDigest,
    };

    try {
      const result = await this.authority.claimHumanApproval(claimRequest);
      if (!result.claimed) {
        switch (result.reason) {
          case 'already-claimed':
            return blocked(
              request,
              'human-approval-already-claimed',
              'Human approval has already been consumed'
            );
          case 'not-found':
            return blocked(request, 'human-approval-not-found', 'Human approval no longer exists');
          case 'inactive':
            return blocked(request, 'human-approval-inactive', 'Human approval is no longer active');
          case 'binding-mismatch':
            return blocked(
              request,
              'human-approval-binding-mismatch',
              'Human approval changed before it could be claimed'
            );
        }
      }

      assertSafeRuntimeId(result.claimId, 'claimId');
      assertIsoTimestamp(result.claimedAt, 'claimedAt');
      if (
        result.approvalId !== claimRequest.approvalId ||
        result.tenantId !== claimRequest.tenantId ||
        result.subjectId !== claimRequest.subjectId ||
        result.actorId !== claimRequest.actorId ||
        result.destination !== claimRequest.destination ||
        result.operationDigest !== claimRequest.operationDigest ||
        result.payloadDigest !== claimRequest.payloadDigest
      ) {
        return blocked(
          request,
          'human-approval-claim-failed',
          'Authority returned a claim for a different operation or payload'
        );
      }

      return {
        ...decision,
        evaluatedAt: result.claimedAt,
        approvalClaimId: result.claimId,
      };
    } catch {
      return blocked(
        request,
        'human-approval-claim-failed',
        'Trusted authority could not atomically claim human approval'
      );
    }
  }

  async prepareSecondBrainProjection(
    request: HealthAdmissionRequest,
    draft: SecondBrainProjectionDraft
  ): Promise<SecondBrainProjectionPreparation> {
    let plan: SecondBrainProjectionPlan;
    try {
      validateRequest(request);
      plan = createSecondBrainProjectionPlan(draft);
    } catch (error) {
      return {
        ok: false,
        decision: blocked(
          request,
          'invalid-request',
          error instanceof Error ? error.message : 'Projection is invalid'
        ),
      };
    }

    const admission = this.authorizeInternal(request, plan.payloadSha256);
    if (!admission.allowed) return { ok: false, decision: admission };
    if (request.destination !== 'second-brain' || request.sensitivity !== plan.payload.sensitivity) {
      return {
        ok: false,
        decision: blocked(
          request,
          'egress-scope-denied',
          'Projection sensitivity and destination must match admission'
        ),
      };
    }

    const claimed = await this.claimEgressApproval(request, admission);
    if (!claimed.allowed) return { ok: false, decision: claimed };
    return {
      ok: true,
      decision: claimed,
      projection: createProjection(plan, claimed.evaluatedAt),
    };
  }

  async prepareSafeExport(
    request: HealthAdmissionRequest,
    records: readonly HealthRecordDescriptor[]
  ): Promise<SafeExportPreparation> {
    let plan: SafeExportPlan;
    try {
      plan = createSafeExportPlan(request, records);
    } catch (error) {
      return {
        ok: false,
        decision: blocked(
          request,
          'invalid-request',
          error instanceof Error ? error.message : 'Export is invalid'
        ),
      };
    }

    const admission = this.authorizeInternal(request, plan.payloadSha256);
    if (!admission.allowed) return { ok: false, decision: admission };
    if (
      admission.egressPolicyId === undefined ||
      admission.humanApprovalId === undefined ||
      admission.payloadDigest === undefined
    ) {
      return {
        ok: false,
        decision: blocked(request, 'human-approval-claim-failed', 'Export authority bindings are incomplete'),
      };
    }

    const claimed = await this.claimEgressApproval(request, admission);
    if (!claimed.allowed) return { ok: false, decision: claimed };
    if (claimed.approvalClaimId === undefined) {
      return {
        ok: false,
        decision: blocked(request, 'human-approval-claim-failed', 'Export approval was not claimed'),
      };
    }

    const body = {
      schemaVersion: '1.0.0' as const,
      createdAt: claimed.evaluatedAt,
      purpose: plan.payload.purpose,
      destination: plan.payload.destination,
      records: plan.payload.records,
      capabilityId: claimed.capabilityId,
      consentId: claimed.consentId,
      egressPolicyId: admission.egressPolicyId,
      humanApprovalId: admission.humanApprovalId,
      approvalClaimId: claimed.approvalClaimId,
      payloadSha256: plan.payloadSha256,
      rawBytesIncluded: false as const,
      transportPerformed: false as const,
    };
    const manifestSha256 = sha256Hex(canonicalJson(body));
    const manifest: SafeExportManifest = Object.freeze({
      ...body,
      exportId: `export:${manifestSha256}`,
      manifestSha256,
    });
    return { ok: true, decision: claimed, manifest };
  }
}
