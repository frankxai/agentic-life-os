import { describe, expect, it } from 'vitest';
import {
  InMemoryEncryptedProjectionStore,
  LOCAL_ONLY_SYNC_GATE,
  resolveProjectionConflict,
} from '../src/projection-store.js';

const baseEnvelope = {
  id: 'today-overview',
  vaultId: 'vault-a',
  deviceId: 'device-a',
  schemaVersion: 'liveos.projection.v1',
  revision: 1,
  ciphertext: 'opaque-ciphertext',
  metadata: {
    contentType: 'application/json',
    byteLength: 17,
    createdAt: '2026-07-12T12:00:00.000Z',
  },
};

describe('encrypted projection boundary', () => {
  it('stores opaque envelopes without interpreting their content', async () => {
    const store = new InMemoryEncryptedProjectionStore();
    await store.put(baseEnvelope);

    expect(await store.get('today-overview')).toEqual(baseEnvelope);
  });

  it('accepts a newer revision and blocks concurrent revisions for review', () => {
    const newer = { ...baseEnvelope, revision: 2, ciphertext: 'newer-ciphertext' };
    const concurrent = { ...baseEnvelope, ciphertext: 'different-ciphertext' };

    expect(resolveProjectionConflict(baseEnvelope, newer).resolution).toBe('accept-incoming');
    expect(resolveProjectionConflict(baseEnvelope, concurrent).resolution).toBe('needs-user-review');
  });

  it('keeps remote sync behind the local-only gate', () => {
    expect(LOCAL_ONLY_SYNC_GATE.status).toBe('local-only');
    expect(LOCAL_ONLY_SYNC_GATE.prohibited).toContain(
      'Do not send raw reflections, health artifacts, fitness logs, or private memory content to a remote service.',
    );
  });
});
