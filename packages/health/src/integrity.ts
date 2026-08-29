import { createHash } from 'node:crypto';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

export function assertExactOwnKeys(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
  label: string,
): asserts value is Record<string, unknown> {
  void snapshotExactOwnData(value, requiredKeys, optionalKeys, label);
}

export function snapshotExactOwnData(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
  label: string,
): Readonly<Record<string, unknown>> {
  if (!isPlainRecord(value)) throw new Error(`${label} must be a plain object`);
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== 'string' || !allowed.has(key))) {
    throw new Error(`${label} contains unknown fields`);
  }
  for (const requiredKey of requiredKeys) {
    if (!Object.prototype.hasOwnProperty.call(value, requiredKey)) {
      throw new Error(`${label} is missing required fields`);
    }
  }
  const snapshot: Record<string, unknown> = {};
  for (const key of ownKeys) {
    if (typeof key !== 'string') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !descriptor.enumerable || !('value' in descriptor)) {
      throw new Error(`${label} fields must be enumerable data properties`);
    }
    snapshot[key] = descriptor.value;
  }
  return Object.freeze(snapshot);
}

export function sha256Hex(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

export function isSha256(value: unknown): value is string {
  return typeof value === 'string' && SHA256_PATTERN.test(value);
}

export function assertSafeId(value: string, label: string): void {
  if (typeof value !== 'string' || !SAFE_ID_PATTERN.test(value)) {
    throw new Error(`${label} must be a bounded opaque identifier`);
  }
}

export function assertIsoTimestamp(value: string, label: string): void {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${label} must be a UTC ISO-8601 timestamp`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error(`${label} must be a valid timestamp`);
  const canonical = value.includes('.') ? parsed.toISOString() : parsed.toISOString().replace('.000Z', 'Z');
  if (canonical !== value) throw new Error(`${label} must be a real canonical UTC timestamp`);
}

export function assertSafeRepoRelativePath(value: string): void {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 240 ||
    value.includes('\\') ||
    value.startsWith('/') ||
    /^[A-Za-z]:/.test(value) ||
    value.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error('artifactPath must be a normalized repository-relative path');
  }
}

export function assertArtifactVersion(value: string): void {
  if (typeof value !== 'string' || !SEMVER_PATTERN.test(value)) {
    throw new Error('artifactVersion must be an explicit semantic version');
  }
}

export function assertCommitSha(value: string): void {
  if (typeof value !== 'string' || !COMMIT_PATTERN.test(value)) {
    throw new Error('commitSha must be an immutable 40- or 64-character Git object ID');
  }
}

function sortForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForCanonicalJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortForCanonicalJson(nested)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortForCanonicalJson(value));
}

/**
 * An exact artifact pin supplied by a private, authenticated authority store.
 * This public type and its validators do not establish that authority or prove
 * that commitSha/path exist in Git; the private ingestion adapter must do so.
 */
export interface HisArtifactPin {
  pinVersion: '1.0.0';
  repository: 'frankxai/health-intelligence-system';
  commitSha: string;
  artifactPath: string;
  artifactVersion: string;
  mediaType: string;
  byteLength: number;
  sha256: string;
}

export interface HisArtifactIntegrityAssessment {
  assessmentVersion: '1.0.0';
  pinDigest: string;
  observedByteLength: number;
  observedSha256: string;
  matchesPin: boolean;
  authoritative: false;
  trustBoundary: 'caller-supplied-pin-requires-private-git-and-authority-verification';
}

function normalizeHisArtifactPin(pin: HisArtifactPin): Readonly<HisArtifactPin> {
  const requiredKeys = [
    'pinVersion',
    'repository',
    'commitSha',
    'artifactPath',
    'artifactVersion',
    'mediaType',
    'byteLength',
    'sha256',
  ] as const;
  const snapshot = snapshotExactOwnData(pin, requiredKeys, [], 'HIS artifact pin');
  if (snapshot.pinVersion !== '1.0.0') throw new Error('Unsupported HIS artifact pin version');
  if (snapshot.repository !== 'frankxai/health-intelligence-system') {
    throw new Error('Only the canonical public Health Intelligence System repository is accepted');
  }
  if (typeof snapshot.commitSha !== 'string') throw new Error('commitSha must be a string');
  if (typeof snapshot.artifactPath !== 'string') throw new Error('artifactPath must be a string');
  if (typeof snapshot.artifactVersion !== 'string') throw new Error('artifactVersion must be a string');
  assertCommitSha(snapshot.commitSha);
  assertSafeRepoRelativePath(snapshot.artifactPath);
  assertArtifactVersion(snapshot.artifactVersion);
  if (
    typeof snapshot.mediaType !== 'string' ||
    !/^[a-z0-9][a-z0-9.+-]+\/[a-z0-9][a-z0-9.+-]+$/i.test(snapshot.mediaType)
  ) {
    throw new Error('mediaType must be an explicit MIME type');
  }
  if (!Number.isSafeInteger(snapshot.byteLength) || (snapshot.byteLength as number) < 0) {
    throw new Error('byteLength must be a non-negative safe integer');
  }
  if (!isSha256(snapshot.sha256)) throw new Error('sha256 must be a lowercase SHA-256 digest');
  return Object.freeze({
    pinVersion: snapshot.pinVersion,
    repository: snapshot.repository,
    commitSha: snapshot.commitSha,
    artifactPath: snapshot.artifactPath,
    artifactVersion: snapshot.artifactVersion,
    mediaType: snapshot.mediaType,
    byteLength: snapshot.byteLength as number,
    sha256: snapshot.sha256,
  });
}

export function assertHisArtifactPin(pin: HisArtifactPin): void {
  void normalizeHisArtifactPin(pin);
}

export function assessPublicHisArtifactPin(
  pin: HisArtifactPin,
  bytes: string | Uint8Array,
): HisArtifactIntegrityAssessment {
  const normalizedPin = normalizeHisArtifactPin(pin);
  const normalized = typeof bytes === 'string' ? Buffer.from(bytes, 'utf8') : Buffer.from(bytes);
  const observedSha256 = sha256Hex(normalized);
  return Object.freeze({
    assessmentVersion: '1.0.0',
    pinDigest: sha256Hex(canonicalJson(normalizedPin)),
    observedByteLength: normalized.byteLength,
    observedSha256,
    matchesPin:
      normalized.byteLength === normalizedPin.byteLength &&
      observedSha256 === normalizedPin.sha256,
    authoritative: false,
    trustBoundary: 'caller-supplied-pin-requires-private-git-and-authority-verification',
  });
}
