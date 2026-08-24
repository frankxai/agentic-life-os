import { createHash } from 'node:crypto';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;

export function sha256Hex(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

export function isSha256(value: unknown): value is string {
  return typeof value === 'string' && SHA256_PATTERN.test(value);
}

export function assertSafeId(value: string, label: string): void {
  if (!SAFE_ID_PATTERN.test(value)) {
    throw new Error(`${label} must be a bounded opaque identifier`);
  }
}

export function assertIsoTimestamp(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${label} must be a UTC ISO-8601 timestamp`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error(`${label} must be a valid timestamp`);
  }
  const canonical = value.includes('.') ? parsed.toISOString() : parsed.toISOString().replace('.000Z', 'Z');
  if (canonical !== value) throw new Error(`${label} must be a real canonical UTC timestamp`);
}

export function assertSafeRepoRelativePath(value: string): void {
  if (
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
  if (!SEMVER_PATTERN.test(value)) {
    throw new Error('artifactVersion must be an explicit semantic version');
  }
}

export function assertCommitSha(value: string): void {
  if (!COMMIT_PATTERN.test(value)) {
    throw new Error('commitSha must be an immutable 40- or 64-character Git object ID');
  }
}

function sortForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForCanonicalJson);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortForCanonicalJson(nested)])
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortForCanonicalJson(value));
}

export interface PublicHisArtifactReceipt {
  receiptVersion: '1.0.0';
  receiptId: string;
  repository: 'frankxai/health-intelligence-system';
  commitSha: string;
  artifactPath: string;
  artifactVersion: string;
  mediaType: string;
  byteLength: number;
  sha256: string;
  receivedAt: string;
  immutable: true;
}

export interface PublicHisArtifactInput {
  repository: 'frankxai/health-intelligence-system';
  commitSha: string;
  artifactPath: string;
  artifactVersion: string;
  mediaType: string;
  bytes: string | Uint8Array;
  receivedAt: string;
}

export function createPublicHisArtifactReceipt(input: PublicHisArtifactInput): PublicHisArtifactReceipt {
  const allowedKeys = new Set([
    'repository',
    'commitSha',
    'artifactPath',
    'artifactVersion',
    'mediaType',
    'bytes',
    'receivedAt',
  ]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
    throw new Error('Public HIS artifact input contains unknown fields');
  }
  if (input.repository !== 'frankxai/health-intelligence-system') {
    throw new Error('Only the canonical public Health Intelligence System repository is accepted');
  }
  assertCommitSha(input.commitSha);
  assertSafeRepoRelativePath(input.artifactPath);
  assertArtifactVersion(input.artifactVersion);
  assertIsoTimestamp(input.receivedAt, 'receivedAt');
  if (!/^[a-z0-9][a-z0-9.+-]+\/[a-z0-9][a-z0-9.+-]+$/i.test(input.mediaType)) {
    throw new Error('mediaType must be an explicit MIME type');
  }

  const bytes = typeof input.bytes === 'string' ? Buffer.from(input.bytes, 'utf8') : Buffer.from(input.bytes);
  const sha256 = sha256Hex(bytes);
  const receiptBody = {
    repository: input.repository,
    commitSha: input.commitSha,
    artifactPath: input.artifactPath,
    artifactVersion: input.artifactVersion,
    mediaType: input.mediaType,
    byteLength: bytes.byteLength,
    sha256,
    receivedAt: input.receivedAt,
  };

  return Object.freeze({
    receiptVersion: '1.0.0',
    receiptId: `his:${sha256Hex(canonicalJson(receiptBody))}`,
    ...receiptBody,
    immutable: true,
  });
}

export function verifyPublicHisArtifactBytes(
  receipt: PublicHisArtifactReceipt,
  bytes: string | Uint8Array
): boolean {
  try {
    const allowedKeys = new Set([
      'receiptVersion',
      'receiptId',
      'repository',
      'commitSha',
      'artifactPath',
      'artifactVersion',
      'mediaType',
      'byteLength',
      'sha256',
      'receivedAt',
      'immutable',
    ]);
    if (Object.keys(receipt).some((key) => !allowedKeys.has(key))) return false;
    if (
      receipt.repository !== 'frankxai/health-intelligence-system' ||
      receipt.receiptVersion !== '1.0.0' ||
      receipt.immutable !== true
    ) {
      return false;
    }
    assertCommitSha(receipt.commitSha);
    assertSafeRepoRelativePath(receipt.artifactPath);
    assertArtifactVersion(receipt.artifactVersion);
    assertIsoTimestamp(receipt.receivedAt, 'receivedAt');
    if (!isSha256(receipt.sha256)) return false;
    if (!/^[a-z0-9][a-z0-9.+-]+\/[a-z0-9][a-z0-9.+-]+$/i.test(receipt.mediaType)) return false;

    const normalized = typeof bytes === 'string' ? Buffer.from(bytes, 'utf8') : Buffer.from(bytes);
    if (normalized.byteLength !== receipt.byteLength || sha256Hex(normalized) !== receipt.sha256) return false;

    const receiptBody = {
      repository: receipt.repository,
      commitSha: receipt.commitSha,
      artifactPath: receipt.artifactPath,
      artifactVersion: receipt.artifactVersion,
      mediaType: receipt.mediaType,
      byteLength: receipt.byteLength,
      sha256: receipt.sha256,
      receivedAt: receipt.receivedAt,
    };
    return receipt.receiptId === `his:${sha256Hex(canonicalJson(receiptBody))}`;
  } catch {
    return false;
  }
}
