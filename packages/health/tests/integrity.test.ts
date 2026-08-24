import { describe, expect, it } from 'vitest';
import {
  assessPublicHisArtifactPin,
  assertHisArtifactPin,
  sha256Hex,
  type HisArtifactPin,
} from '../src/integrity.js';

const SYNTHETIC_COMMIT = 'a'.repeat(40);

function pinFor(bytes: string): HisArtifactPin {
  return {
    pinVersion: '1.0.0',
    repository: 'frankxai/health-intelligence-system',
    commitSha: SYNTHETIC_COMMIT,
    artifactPath: 'bios/schemas/claim.schema.json',
    artifactVersion: '0.3.0',
    mediaType: 'application/json',
    byteLength: Buffer.byteLength(bytes),
    sha256: sha256Hex(bytes),
  };
}

describe('public Health Intelligence System artifact pin assessment', () => {
  it('checks exact bytes without minting provenance or authority', () => {
    const bytes = '{"schemaVersion":"1.0.0","kind":"synthetic-claim"}';
    const pin = pinFor(bytes);
    const matching = assessPublicHisArtifactPin(pin, bytes);
    const altered = assessPublicHisArtifactPin(pin, `${bytes}\n`);

    expect(matching.matchesPin).toBe(true);
    expect(matching.authoritative).toBe(false);
    expect(matching.trustBoundary).toMatch(/requires-private-git-and-authority-verification/);
    expect(matching.pinDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(altered.matchesPin).toBe(false);
  });

  it('does not treat a syntactically valid caller-authored commit as verified provenance', () => {
    const bytes = '{}';
    const assessment = assessPublicHisArtifactPin(pinFor(bytes), bytes);

    expect(assessment.matchesPin).toBe(true);
    expect(assessment.authoritative).toBe(false);
  });

  it('rejects unknown fields and unsafe artifact paths', () => {
    const bytes = '{}';
    const pin = pinFor(bytes);
    expect(() => assertHisArtifactPin({ ...pin, unexpectedPayload: true } as HisArtifactPin)).toThrow(/unknown fields/i);

    for (const artifactPath of ['../private-vault/record.json', '/absolute/record.json', 'C:/private/record.json']) {
      expect(() => assertHisArtifactPin({ ...pin, artifactPath })).toThrow(/repository-relative path/);
    }
  });

  it('rejects inherited or accessor-backed pin fields instead of hashing an empty object', () => {
    const bytes = '{}';
    const inheritedPin = Object.create(pinFor(bytes)) as HisArtifactPin;
    expect(() => assertHisArtifactPin(inheritedPin)).toThrow(/plain object/i);
    expect(() => assessPublicHisArtifactPin(inheritedPin, bytes)).toThrow(/plain object/i);

    const accessorPin = pinFor(bytes);
    Object.defineProperty(accessorPin, 'commitSha', {
      enumerable: true,
      get: () => SYNTHETIC_COMMIT,
    });
    expect(() => assessPublicHisArtifactPin(accessorPin, bytes)).toThrow(/data properties/i);
  });

  it('binds distinct complete pins to distinct digests', () => {
    const bytes = '{}';
    const first = assessPublicHisArtifactPin(pinFor(bytes), bytes);
    const second = assessPublicHisArtifactPin({
      ...pinFor(bytes),
      artifactVersion: '0.3.1',
    }, bytes);
    expect(first.pinDigest).not.toBe(second.pinDigest);
  });

  it('snapshots pin descriptors without invoking Proxy property getters', () => {
    const bytes = '{}';
    const pin = pinFor(bytes);
    let propertyReads = 0;
    const proxiedPin = new Proxy(pin, {
      get(target, property, receiver) {
        propertyReads += 1;
        return Reflect.get(target, property, receiver);
      },
    });

    expect(assessPublicHisArtifactPin(proxiedPin, bytes)).toEqual(
      assessPublicHisArtifactPin(pin, bytes),
    );
    expect(propertyReads).toBe(0);
  });
});
