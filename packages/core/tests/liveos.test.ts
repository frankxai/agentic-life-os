import { describe, expect, it } from 'vitest';
import {
  ActionRequestSchema,
  LiveOSModuleSchema,
  ProjectionEnvelopeSchema,
  requestNeedsApproval,
} from '../src/liveos.js';

const requestedAt = '2026-07-12T12:00:00.000Z';

describe('LiveOS contracts', () => {
  it('validates a modular command definition', () => {
    const module = LiveOSModuleSchema.parse({
      id: 'palace',
      label: 'Memory Palace',
      domain: 'palace',
      owner: 'ALOS memory adapter',
      capabilities: ['capture', 'link', 'recall'],
      riskLevel: 'guarded',
      privacyClass: 'sensitive',
      sourceAdapter: 'starlight-memory',
      dashboardRoute: '/palace',
      command: '/liveos palace',
      proofGate: 'Every anchor includes an evidence reference.',
      requiresConsent: true,
    });

    expect(module.dashboardRoute).toBe('/palace');
  });

  it('requires explicit approval for apply actions and health preparation', () => {
    const applyRequest = ActionRequestSchema.parse({
      id: 'action-1',
      command: '/liveos today',
      mode: 'apply',
      scope: ['practice'],
      requestedOutcome: 'Schedule a practice.',
      requestedAt,
    });
    const healthRequest = ActionRequestSchema.parse({
      id: 'action-2',
      command: '/liveos health-prep',
      mode: 'plan',
      scope: ['health'],
      requestedOutcome: 'Prepare clinician questions.',
      requestedAt,
    });

    expect(requestNeedsApproval(applyRequest)).toBe(true);
    expect(requestNeedsApproval(healthRequest)).toBe(true);
  });

  it('accepts ciphertext-only projection envelopes', () => {
    const envelope = ProjectionEnvelopeSchema.parse({
      id: 'projection-1',
      vaultId: 'vault-local',
      deviceId: 'device-a',
      schemaVersion: 'liveos.projection.v1',
      revision: 0,
      ciphertext: 'opaque-ciphertext-placeholder',
      metadata: {
        contentType: 'application/json',
        byteLength: 29,
        createdAt: requestedAt,
      },
    });

    expect(envelope.metadata.contentType).toBe('application/json');
  });
});
