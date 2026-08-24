import {
  HEALTH_ACTIONS,
  HEALTH_EGRESS_DESTINATIONS,
  HEALTH_PURPOSES,
  HEALTH_SENSITIVITIES,
  WELLNESS_PATTERN_KEYS,
  WELLNESS_PATTERN_TRENDS,
  type HealthPolicyConformanceReport,
  type HealthPolicyDoesNotConform,
  type HealthAdmissionRequest,
  type HealthPolicySimulationRepository,
  type HealthEgressDestination,
  type HealthRecordDescriptor,
  type HealthRuntimeClock,
  type HealthSensitivity,
  type SafeExportPreparation,
  type SecondBrainProjectionDraft,
  type SecondBrainProjectionPreparation,
} from './sovereign-contracts.js';
import {
  assertIsoTimestamp,
  assertSafeId,
  canonicalJson,
  isPlainRecord,
  isSha256,
  sha256Hex,
  snapshotExactOwnData,
} from './integrity.js';

const SYSTEM_CLOCK: HealthRuntimeClock = { now: () => new Date() };
const HEALTH_ENUM_SETS = new Map<readonly string[], ReadonlySet<string>>([
  [HEALTH_ACTIONS, new Set<string>(HEALTH_ACTIONS)],
  [HEALTH_EGRESS_DESTINATIONS, new Set<string>(HEALTH_EGRESS_DESTINATIONS)],
  [HEALTH_PURPOSES, new Set<string>(HEALTH_PURPOSES)],
  [HEALTH_SENSITIVITIES, new Set<string>(HEALTH_SENSITIVITIES)],
  [WELLNESS_PATTERN_KEYS, new Set<string>(WELLNESS_PATTERN_KEYS)],
  [WELLNESS_PATTERN_TRENDS, new Set<string>(WELLNESS_PATTERN_TRENDS)],
]);
const ARRAY_INCLUDES = Array.prototype.includes;
const MAP_GET = Map.prototype.get;
const SET_HAS = Set.prototype.has;
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

const REQUEST_REQUIRED_KEYS = [
  'requestId',
  'tenantId',
  'subjectId',
  'actorId',
  'capabilityId',
  'action',
  'purpose',
  'sensitivity',
  'resourceId',
] as const;
const REQUEST_OPTIONAL_KEYS = ['destination', 'humanApprovalId'] as const;
const CAPABILITY_REQUIRED_KEYS = [
  'id', 'tenantId', 'subjectId', 'actorId', 'actions', 'purposes', 'sensitivities',
  'consentId', 'issuedAt', 'expiresAt',
] as const;
const CAPABILITY_OPTIONAL_KEYS = ['egressPolicyId', 'revokedAt'] as const;
const CONSENT_REQUIRED_KEYS = [
  'id', 'tenantId', 'subjectId', 'actorId', 'actions', 'purposes', 'sensitivities',
  'issuedAt', 'expiresAt',
] as const;
const CONSENT_OPTIONAL_KEYS = ['revokedAt'] as const;
const EGRESS_REQUIRED_KEYS = [
  'id', 'tenantId', 'allowedDestinations', 'allowedPurposes', 'allowedSensitivities',
  'requiresHumanApproval', 'issuedAt', 'expiresAt',
] as const;
const EGRESS_OPTIONAL_KEYS = ['revokedAt'] as const;
const APPROVAL_REQUIRED_KEYS = [
  'id', 'tenantId', 'subjectId', 'actorId', 'operationDigest', 'payloadDigest',
  'destination', 'approvedBy', 'issuedAt', 'expiresAt',
] as const;
const APPROVAL_OPTIONAL_KEYS = ['revokedAt'] as const;

interface InternalSafeExportRecord {
  opaqueRecordRef: string;
  sensitivity: HealthSensitivity;
  contentSha256: string;
  byteLength: number;
  mediaType: string;
  sourceReceiptIds: readonly string[];
}

interface InternalSecondBrainProjectionPlan {
  payload: {
    schemaVersion: '1.0.0';
    kind: 'second-brain-projection-plan';
    title: 'Monthly wellness pattern review';
    period: string;
    patterns: readonly { key: string; trend: string }[];
    sensitivity: 'personal';
  };
  payloadSha256: string;
}

interface InternalSafeExportPlan {
  payload: {
    schemaVersion: '1.0.0';
    kind: 'safe-export-plan';
    purpose: HealthAdmissionRequest['purpose'];
    destination: Exclude<HealthEgressDestination, 'second-brain'>;
    requestSensitivity: HealthSensitivity;
    records: readonly InternalSafeExportRecord[];
  };
  payloadSha256: string;
}

function isEnumValue<T extends string>(values: readonly T[], value: unknown): value is T {
  const membership = Reflect.apply(MAP_GET, HEALTH_ENUM_SETS, [values]) as ReadonlySet<string> | undefined;
  return (
    typeof value === 'string' &&
    membership !== undefined &&
    Reflect.apply(SET_HAS, membership, [value])
  );
}

function normalizeOrdinaryDenseArray(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new Error(`${label} must be an ordinary array`);
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
  if (
    lengthDescriptor === undefined ||
    !('value' in lengthDescriptor) ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < minimum ||
    lengthDescriptor.value > maximum
  ) {
    throw new Error(`${label} has an invalid length`);
  }
  const length = lengthDescriptor.value as number;
  const allowedKeys = new Set(['length']);
  for (let index = 0; index < length; index += 1) allowedKeys.add(String(index));
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== allowedKeys.size ||
    ownKeys.some((key) => typeof key !== 'string' || !allowedKeys.has(key))
  ) {
    throw new Error(`${label} contains custom fields or sparse entries`);
  }
  const normalized: unknown[] = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (descriptor === undefined || !descriptor.enumerable || !('value' in descriptor)) {
      throw new Error(`${label} entries must be enumerable data properties`);
    }
    normalized.push(descriptor.value);
  }
  return Object.freeze(normalized);
}

function normalizeEnumArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): readonly T[] {
  const entries = normalizeOrdinaryDenseArray(value, label, 1, 16);
  const normalized: T[] = [];
  for (const entry of entries) {
    if (!isEnumValue(allowed, entry)) throw new Error(`${label} contains an unknown enum value`);
    normalized.push(entry);
  }
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} contains duplicates`);
  return Object.freeze(normalized);
}

function arrayIncludes<T>(values: readonly T[], expected: T): boolean {
  return Reflect.apply(ARRAY_INCLUDES, values, [expected]) as boolean;
}

function assertSafeRuntimeId(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
  assertSafeId(value, label);
}

function blocked(
  request: Pick<HealthAdmissionRequest, 'requestId'> | unknown,
  code: HealthPolicyDoesNotConform['code'],
  reason: string
): HealthPolicyDoesNotConform {
  let requestId = 'invalid-request';
  try {
    if (isPlainRecord(request)) {
      const descriptor = Object.getOwnPropertyDescriptor(request, 'requestId');
      if (descriptor !== undefined && 'value' in descriptor && typeof descriptor.value === 'string') {
        assertSafeId(descriptor.value, 'requestId');
        requestId = descriptor.value;
      }
    }
  } catch {
    requestId = 'invalid-request';
  }
  return {
    conforms: false,
    code,
    requestId,
    reason,
    authorityStatus: 'unverified-policy-simulation',
    executionPermitted: false,
  };
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

function normalizeGrantScopes(record: {
  actions: readonly HealthAdmissionRequest['action'][];
  purposes: readonly HealthAdmissionRequest['purpose'][];
  sensitivities: readonly HealthAdmissionRequest['sensitivity'][];
}): Readonly<{
  actions: readonly HealthAdmissionRequest['action'][];
  purposes: readonly HealthAdmissionRequest['purpose'][];
  sensitivities: readonly HealthAdmissionRequest['sensitivity'][];
}> {
  return Object.freeze({
    actions: normalizeEnumArray(record.actions, HEALTH_ACTIONS, 'Authority actions'),
    purposes: normalizeEnumArray(record.purposes, HEALTH_PURPOSES, 'Authority purposes'),
    sensitivities: normalizeEnumArray(record.sensitivities, HEALTH_SENSITIVITIES, 'Authority sensitivities'),
  });
}

function includesScope(
  record: {
    actions: readonly HealthAdmissionRequest['action'][];
    purposes: readonly HealthAdmissionRequest['purpose'][];
    sensitivities: readonly HealthAdmissionRequest['sensitivity'][];
  },
  request: HealthAdmissionRequest
): boolean {
  const scopes = normalizeGrantScopes(record);
  return (
    arrayIncludes(scopes.actions, request.action) &&
    arrayIncludes(scopes.purposes, request.purpose) &&
    arrayIncludes(scopes.sensitivities, request.sensitivity)
  );
}

function normalizeRequest(request: HealthAdmissionRequest): Readonly<HealthAdmissionRequest> {
  const snapshot = snapshotExactOwnData(
    request,
    REQUEST_REQUIRED_KEYS,
    REQUEST_OPTIONAL_KEYS,
    'Health admission request',
  );
  for (const [label, value] of [
    ['requestId', snapshot.requestId],
    ['tenantId', snapshot.tenantId],
    ['subjectId', snapshot.subjectId],
    ['actorId', snapshot.actorId],
    ['capabilityId', snapshot.capabilityId],
    ['resourceId', snapshot.resourceId],
  ] as const) {
    assertSafeRuntimeId(value, label);
  }
  if (!isEnumValue(HEALTH_ACTIONS, snapshot.action)) throw new Error('Unknown health action');
  if (!isEnumValue(HEALTH_PURPOSES, snapshot.purpose)) throw new Error('Unknown health purpose');
  if (!isEnumValue(HEALTH_SENSITIVITIES, snapshot.sensitivity)) throw new Error('Unknown sensitivity');
  if (
    snapshot.destination !== undefined &&
    !isEnumValue(HEALTH_EGRESS_DESTINATIONS, snapshot.destination)
  ) {
    throw new Error('Unknown egress destination');
  }
  if (snapshot.humanApprovalId !== undefined) {
    assertSafeRuntimeId(snapshot.humanApprovalId, 'humanApprovalId');
  }

  const expectedDestination = DESTINATION_BY_ACTION[snapshot.action];
  if (expectedDestination !== snapshot.destination) {
    throw new Error(
      expectedDestination === undefined
        ? 'This action must not declare an egress destination'
        : `This action requires the ${expectedDestination} destination`
    );
  }
  return Object.freeze({
    requestId: snapshot.requestId as string,
    tenantId: snapshot.tenantId as string,
    subjectId: snapshot.subjectId as string,
    actorId: snapshot.actorId as string,
    capabilityId: snapshot.capabilityId as string,
    action: snapshot.action,
    purpose: snapshot.purpose,
    sensitivity: snapshot.sensitivity,
    resourceId: snapshot.resourceId as string,
    ...(snapshot.destination === undefined ? {} : { destination: snapshot.destination }),
    ...(snapshot.humanApprovalId === undefined ? {} : { humanApprovalId: snapshot.humanApprovalId }),
  });
}

export function healthOperationDigest(request: HealthAdmissionRequest): string {
  const normalizedRequest = normalizeRequest(request);
  const approvalBoundRequest = Object.freeze({
    requestId: normalizedRequest.requestId,
    tenantId: normalizedRequest.tenantId,
    subjectId: normalizedRequest.subjectId,
    actorId: normalizedRequest.actorId,
    capabilityId: normalizedRequest.capabilityId,
    action: normalizedRequest.action,
    purpose: normalizedRequest.purpose,
    sensitivity: normalizedRequest.sensitivity,
    resourceId: normalizedRequest.resourceId,
    ...(normalizedRequest.destination === undefined ? {} : { destination: normalizedRequest.destination }),
  });
  return sha256Hex(canonicalJson(approvalBoundRequest));
}

/**
 * Produces a narrowly structured, non-free-text projection plan. It is still a
 * report-only draft; public code cannot authorize or transport it.
 */
function createSecondBrainProjectionPlan(
  draft: SecondBrainProjectionDraft
): InternalSecondBrainProjectionPlan {
  const draftSnapshot = snapshotExactOwnData(
    draft,
    ['period', 'patterns'],
    [],
    'Second Brain projection draft',
  );
  const period = typeof draftSnapshot.period === 'string'
    ? draftSnapshot.period.normalize('NFC')
    : draftSnapshot.period;
  if (typeof period !== 'string' || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(period)) {
    throw new Error('period must use month precision (YYYY-MM)');
  }
  const patternEntries = normalizeOrdinaryDenseArray(
    draftSnapshot.patterns,
    'patterns',
    1,
    5,
  );
  const patterns = patternEntries.map((pattern) => {
    const patternSnapshot = snapshotExactOwnData(pattern, ['key', 'trend'], [], 'wellness pattern');
    if (!isEnumValue(WELLNESS_PATTERN_KEYS, patternSnapshot.key)) throw new Error('pattern key is unknown');
    if (!isEnumValue(WELLNESS_PATTERN_TRENDS, patternSnapshot.trend)) throw new Error('pattern trend is unknown');
    return Object.freeze({ key: patternSnapshot.key, trend: patternSnapshot.trend });
  });
  if (new Set(patterns.map((pattern) => pattern.key)).size !== patterns.length) {
    throw new Error('wellness pattern keys must be unique');
  }
  patterns.sort((left, right) => left.key.localeCompare(right.key));

  const payload = Object.freeze({
    schemaVersion: '1.0.0' as const,
    kind: 'second-brain-projection-plan' as const,
    title: 'Monthly wellness pattern review' as const,
    period,
    patterns: Object.freeze(patterns),
    sensitivity: 'personal' as const,
  });
  return Object.freeze({
    payload,
    payloadSha256: sha256Hex(canonicalJson(payload)),
  });
}

function normalizeSafeExportRecord(
  request: HealthAdmissionRequest,
  record: HealthRecordDescriptor
): InternalSafeExportRecord {
  const recordSnapshot = snapshotExactOwnData(
    record,
    [
      'opaqueRecordRef',
      'tenantId',
      'subjectId',
      'sensitivity',
      'contentSha256',
      'byteLength',
      'mediaType',
      'sourceReceiptIds',
    ],
    [],
    'Health record descriptor',
  );
  record = recordSnapshot as unknown as HealthRecordDescriptor;
  if (typeof record.opaqueRecordRef !== 'string' || !/^opaque:[a-f0-9]{32,64}$/.test(record.opaqueRecordRef)) {
    throw new Error('opaqueRecordRef must use the bounded opaque:<hex> reference syntax');
  }
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
  const receiptEntries = normalizeOrdinaryDenseArray(
    record.sourceReceiptIds,
    'Record source receipt IDs',
    0,
    64,
  );
  const receiptIds: string[] = [];
  for (const receiptId of receiptEntries) {
    assertSafeRuntimeId(receiptId, 'sourceReceiptId');
    receiptIds.push(receiptId);
  }
  if (new Set(receiptIds).size !== receiptIds.length) {
    throw new Error('Record source receipt IDs must be unique');
  }

  return Object.freeze({
    opaqueRecordRef: record.opaqueRecordRef,
    sensitivity: record.sensitivity,
    contentSha256: record.contentSha256,
    byteLength: record.byteLength,
    mediaType: record.mediaType.toLowerCase(),
    sourceReceiptIds: Object.freeze(receiptIds.sort()),
  });
}

/** Produces the exact canonical export record set that an approval must bind. */
function createSafeExportPlan(
  request: HealthAdmissionRequest,
  records: readonly HealthRecordDescriptor[]
): InternalSafeExportPlan {
  request = normalizeRequest(request);
  if (request.destination === undefined || request.destination === 'second-brain') {
    throw new Error('Safe exports require a clinician or encrypted-local destination');
  }
  const recordEntries = normalizeOrdinaryDenseArray(records, 'Export records', 1, 128);
  const safeRecords = recordEntries
    .map((record) => normalizeSafeExportRecord(request, record as HealthRecordDescriptor))
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

function normalizeAuthorityEgressPolicy(policy: {
  allowedDestinations: readonly HealthEgressDestination[];
  allowedPurposes: readonly HealthAdmissionRequest['purpose'][];
  allowedSensitivities: readonly HealthSensitivity[];
  requiresHumanApproval: true;
}): Readonly<{
  allowedDestinations: readonly HealthEgressDestination[];
  allowedPurposes: readonly HealthAdmissionRequest['purpose'][];
  allowedSensitivities: readonly HealthSensitivity[];
}> {
  if (policy.requiresHumanApproval !== true) {
    throw new Error('Egress policy must require human approval');
  }
  return Object.freeze({
    allowedDestinations: normalizeEnumArray(
      policy.allowedDestinations,
      HEALTH_EGRESS_DESTINATIONS,
      'Egress destinations',
    ),
    allowedPurposes: normalizeEnumArray(policy.allowedPurposes, HEALTH_PURPOSES, 'Egress purposes'),
    allowedSensitivities: normalizeEnumArray(
      policy.allowedSensitivities,
      HEALTH_SENSITIVITIES,
      'Egress sensitivities',
    ),
  });
}

export class PublicHealthPolicySimulator {
  readonly mode = 'public-report-only' as const;
  readonly #authority: HealthPolicySimulationRepository;
  readonly #clock: HealthRuntimeClock;

  constructor(
    authority: HealthPolicySimulationRepository,
    clock: HealthRuntimeClock = SYSTEM_CLOCK
  ) {
    this.#authority = authority;
    this.#clock = clock;
  }

  /**
   * Read-only admission preview. Egress cannot be admitted through this method:
   * a runtime-computed payload digest and atomic approval claim are mandatory.
   */
  evaluate(request: HealthAdmissionRequest): HealthPolicyConformanceReport {
    return this.#authorizeInternal(request);
  }

  #authorizeInternal(
    request: HealthAdmissionRequest,
    payloadDigest?: string
  ): HealthPolicyConformanceReport {
    try {
      request = normalizeRequest(request);
      const clockValue = this.#clock.now();
      if (!(clockValue instanceof Date)) {
        return blocked(request, 'invalid-request', 'Runtime clock must return a Date');
      }
      const timeValue = Date.prototype.getTime.call(clockValue);
      if (!Number.isFinite(timeValue)) {
        return blocked(request, 'invalid-request', 'Runtime clock returned an invalid time');
      }
      const now = new Date(timeValue);

      const resolvedCapability = this.#authority.resolveCapability(request.capabilityId);
      if (resolvedCapability === undefined) {
        return blocked(request, 'capability-not-found', 'No authority-owned capability exists');
      }
      const capability = snapshotExactOwnData(
        resolvedCapability,
        CAPABILITY_REQUIRED_KEYS,
        CAPABILITY_OPTIONAL_KEYS,
        'Capability record',
      ) as unknown as typeof resolvedCapability;
      if (!isActive(capability, now)) {
        return blocked(request, 'capability-inactive', 'Capability is not currently active');
      }
      assertSafeRuntimeId(capability.id, 'capability.id');
      assertSafeRuntimeId(capability.tenantId, 'capability.tenantId');
      assertSafeRuntimeId(capability.subjectId, 'capability.subjectId');
      assertSafeRuntimeId(capability.actorId, 'capability.actorId');
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

      const resolvedConsent = this.#authority.resolveConsent(capability.consentId);
      if (resolvedConsent === undefined) {
        return blocked(request, 'consent-not-found', 'Capability has no current authority-owned consent');
      }
      const consent = snapshotExactOwnData(
        resolvedConsent,
        CONSENT_REQUIRED_KEYS,
        CONSENT_OPTIONAL_KEYS,
        'Consent record',
      ) as unknown as typeof resolvedConsent;
      if (!isActive(consent, now)) {
        return blocked(request, 'consent-inactive', 'Consent is expired, revoked, or not yet active');
      }
      assertSafeRuntimeId(consent.id, 'consent.id');
      assertSafeRuntimeId(consent.tenantId, 'consent.tenantId');
      assertSafeRuntimeId(consent.subjectId, 'consent.subjectId');
      assertSafeRuntimeId(consent.actorId, 'consent.actorId');
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
          conforms: true,
          code: 'policy-conforms',
          authorityStatus: 'unverified-policy-simulation',
          executionPermitted: false,
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
      const resolvedEgress = this.#authority.resolveEgressPolicy(capability.egressPolicyId);
      if (resolvedEgress === undefined) {
        return blocked(request, 'egress-policy-not-found', 'Egress policy was not found');
      }
      const egress = snapshotExactOwnData(
        resolvedEgress,
        EGRESS_REQUIRED_KEYS,
        EGRESS_OPTIONAL_KEYS,
        'Egress policy record',
      ) as unknown as typeof resolvedEgress;
      if (!isActive(egress, now)) {
        return blocked(request, 'egress-policy-inactive', 'Egress policy is not currently active');
      }
      assertSafeRuntimeId(egress.id, 'egress.id');
      assertSafeRuntimeId(egress.tenantId, 'egress.tenantId');
      if (egress.tenantId !== request.tenantId || egress.id !== capability.egressPolicyId) {
        return blocked(
          request,
          'egress-policy-binding-mismatch',
          'Egress policy belongs to another tenant'
        );
      }
      const egressScopes = normalizeAuthorityEgressPolicy(egress);
      if (
        !arrayIncludes(egressScopes.allowedDestinations, request.destination) ||
        !arrayIncludes(egressScopes.allowedPurposes, request.purpose) ||
        !arrayIncludes(egressScopes.allowedSensitivities, request.sensitivity)
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
      const resolvedApproval = this.#authority.resolveHumanApproval(request.humanApprovalId);
      if (resolvedApproval === undefined) {
        return blocked(
          request,
          'human-approval-not-found',
          'Human approval was not found in the authority repository'
        );
      }
      const approval = snapshotExactOwnData(
        resolvedApproval,
        APPROVAL_REQUIRED_KEYS,
        APPROVAL_OPTIONAL_KEYS,
        'Human approval record',
      ) as unknown as typeof resolvedApproval;
      if (!isActive(approval, now)) {
        return blocked(
          request,
          'human-approval-inactive',
          'Human approval is expired, revoked, or not yet active'
        );
      }
      assertSafeRuntimeId(approval.id, 'approval.id');
      assertSafeRuntimeId(approval.tenantId, 'approval.tenantId');
      assertSafeRuntimeId(approval.subjectId, 'approval.subjectId');
      assertSafeRuntimeId(approval.actorId, 'approval.actorId');
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
        conforms: true,
        code: 'policy-conforms',
        authorityStatus: 'unverified-policy-simulation',
        executionPermitted: false,
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
      void error;
      return blocked(
        request,
        'invalid-request',
        'Request or authority record is malformed'
      );
    }
  }

  async prepareSecondBrainProjection(
    request: HealthAdmissionRequest,
    draft: SecondBrainProjectionDraft
  ): Promise<SecondBrainProjectionPreparation> {
    let plan: InternalSecondBrainProjectionPlan;
    try {
      request = normalizeRequest(request);
      plan = createSecondBrainProjectionPlan(draft);
    } catch (error) {
      void error;
      return {
        ok: false,
        decision: blocked(
          request,
          'invalid-request',
          'Projection request is malformed'
        ),
      };
    }
    void plan;
    return {
      ok: false,
      decision: blocked(
        request,
        'public-runtime-report-only',
        'Public code can validate a structured draft but cannot authorize or produce Second Brain egress.',
      ),
    };
  }

  async prepareSafeExport(
    request: HealthAdmissionRequest,
    records: readonly HealthRecordDescriptor[]
  ): Promise<SafeExportPreparation> {
    let plan: InternalSafeExportPlan;
    try {
      plan = createSafeExportPlan(request, records);
    } catch (error) {
      void error;
      return {
        ok: false,
        decision: blocked(
          request,
          'invalid-request',
          'Export request is malformed'
        ),
      };
    }
    void plan;
    return {
      ok: false,
      decision: blocked(
        request,
        'public-runtime-report-only',
        'Public code can validate a manifest-only draft but cannot authorize or produce an export.',
      ),
    };
  }
}
