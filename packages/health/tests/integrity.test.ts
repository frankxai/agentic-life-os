import { describe, expect, it } from 'vitest';
import {
  createPublicHisArtifactReceipt,
  verifyPublicHisArtifactBytes,
} from '../src/integrity.js';

const COMMIT = 'a'.repeat(40);
const RECEIVED_AT = '2026-08-24T10:00:00.000Z';

describe('public Health Intelligence System artifact receipts', () => {
  it('binds a versioned canonical artifact to its immutable bytes', () => {
    const bytes = '{"schemaVersion":"1.0.0","kind":"claim"}';
    const receipt = createPublicHisArtifactReceipt({
      repository: 'frankxai/health-intelligence-system',
      commitSha: COMMIT,
      artifactPath: 'bios/schemas/claim.schema.json',
      artifactVersion: '0.2.1',
      mediaType: 'application/json',
      bytes,
      receivedAt: RECEIVED_AT,
    });

    expect(receipt.receiptId).toMatch(/^his:[a-f0-9]{64}$/);
    expect(receipt.immutable).toBe(true);
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(verifyPublicHisArtifactBytes(receipt, bytes)).toBe(true);
    expect(verifyPublicHisArtifactBytes(receipt, `${bytes}\n`)).toBe(false);
    expect(
      verifyPublicHisArtifactBytes({ ...receipt, unexpectedPayload: 'not-authority' } as typeof receipt, bytes)
    ).toBe(false);
  });

  it.each(['../private-vault/record.json', '/absolute/record.json', 'C:/private/record.json']) (
    'rejects unsafe artifact path %s',
    (artifactPath) => {
      expect(() =>
        createPublicHisArtifactReceipt({
          repository: 'frankxai/health-intelligence-system',
          commitSha: COMMIT,
          artifactPath,
          artifactVersion: '0.2.1',
          mediaType: 'application/json',
          bytes: '{}',
          receivedAt: RECEIVED_AT,
        })
      ).toThrow(/repository-relative path/);
    }
  );
});
