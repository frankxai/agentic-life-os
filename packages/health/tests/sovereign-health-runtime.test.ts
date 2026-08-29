import { describe, expect, it } from 'vitest';
import {
  PublicHealthPolicySimulator,
  healthOperationDigest,
} from '../src/sovereign-health-runtime.js';
import * as sovereignRuntime from '../src/sovereign-health-runtime.js';
import { sha256Hex } from '../src/integrity.js';
import type {
  HealthAdmissionRequest,
  HealthCapabilityGrant,
  HealthConsentGrant,
  HealthEgressPolicy,
  HealthHumanApproval,
  HealthPolicySimulationRepository,
  HealthRecordDescriptor,
  SecondBrainProjectionDraft,
} from '../src/sovereign-contracts.js';
import {
  HEALTH_ACTIONS,
  HEALTH_EGRESS_DESTINATIONS,
  HEALTH_PURPOSES,
  HEALTH_SENSITIVITIES,
  WELLNESS_PATTERN_KEYS,
  WELLNESS_PATTERN_TRENDS,
} from '../src/sovereign-contracts.js';

const NOW = new Date('2026-08-24T12:00:00.000Z');

class TestPolicySnapshot implements HealthPolicySimulationRepository {
  capabilities = new Map<string, HealthCapabilityGrant>();
  consents = new Map<string, HealthConsentGrant>();
  egressPolicies = new Map<string, HealthEgressPolicy>();
  approvals = new Map<string, HealthHumanApproval>();

  resolveCapability(id: string) { return this.capabilities.get(id); }
  resolveConsent(id: string) { return this.consents.get(id); }
  resolveEgressPolicy(id: string) { return this.egressPolicies.get(id); }
  resolveHumanApproval(id: string) { return this.approvals.get(id); }

}

function policySnapshot(): TestPolicySnapshot {
  const snapshot = new TestPolicySnapshot();
  snapshot.consents.set('consent-1', {
    id: 'consent-1',
    tenantId: 'tenant-a',
    subjectId: 'subject-a',
    actorId: 'agent-a',
    actions: ['read-vault-metadata', 'create-second-brain-projection', 'prepare-clinician-export'],
    purposes: ['self-tracking', 'wellness-planning', 'clinician-handoff'],
    sensitivities: ['personal', 'clinical'],
    issuedAt: '2026-08-24T00:00:00.000Z',
    expiresAt: '2026-08-25T00:00:00.000Z',
  });
  snapshot.capabilities.set('cap-1', {
    id: 'cap-1',
    tenantId: 'tenant-a',
    subjectId: 'subject-a',
    actorId: 'agent-a',
    actions: ['read-vault-metadata', 'create-second-brain-projection', 'prepare-clinician-export'],
    purposes: ['self-tracking', 'wellness-planning', 'clinician-handoff'],
    sensitivities: ['personal', 'clinical'],
    consentId: 'consent-1',
    egressPolicyId: 'egress-1',
    issuedAt: '2026-08-24T00:00:00.000Z',
    expiresAt: '2026-08-25T00:00:00.000Z',
  });
  snapshot.egressPolicies.set('egress-1', {
    id: 'egress-1',
    tenantId: 'tenant-a',
    allowedDestinations: ['second-brain', 'clinician-handoff'],
    allowedPurposes: ['self-tracking', 'wellness-planning', 'clinician-handoff'],
    allowedSensitivities: ['personal', 'clinical'],
    requiresHumanApproval: true,
    issuedAt: '2026-08-24T00:00:00.000Z',
    expiresAt: '2026-08-25T00:00:00.000Z',
  });
  return snapshot;
}

function request(overrides: Partial<HealthAdmissionRequest> = {}): HealthAdmissionRequest {
  return {
    requestId: 'request-1',
    tenantId: 'tenant-a',
    subjectId: 'subject-a',
    actorId: 'agent-a',
    capabilityId: 'cap-1',
    action: 'read-vault-metadata',
    purpose: 'self-tracking',
    sensitivity: 'personal',
    resourceId: 'record-index',
    ...overrides,
  };
}

function projectionDraft(overrides: Partial<SecondBrainProjectionDraft> = {}): SecondBrainProjectionDraft {
  return {
    period: '2026-08',
    patterns: [
      { key: 'sleep-consistency', trend: 'improving' },
      { key: 'recovery-self-rating', trend: 'stable' },
    ],
    ...overrides,
  };
}

function record(refCharacter = 'a', overrides: Partial<HealthRecordDescriptor> = {}): HealthRecordDescriptor {
  return {
    opaqueRecordRef: `opaque:${refCharacter.repeat(64)}`,
    tenantId: 'tenant-a',
    subjectId: 'subject-a',
    sensitivity: 'clinical',
    contentSha256: sha256Hex(`synthetic:${refCharacter}`),
    byteLength: 42,
    mediaType: 'application/pdf',
    sourceReceiptIds: [`receipt-${refCharacter.repeat(16)}`],
    ...overrides,
  };
}

describe('public health policy simulation', () => {
  it('freezes all exported admission lists at runtime', () => {
    for (const values of [
      HEALTH_ACTIONS,
      HEALTH_EGRESS_DESTINATIONS,
      HEALTH_PURPOSES,
      HEALTH_SENSITIVITIES,
      WELLNESS_PATTERN_KEYS,
      WELLNESS_PATTERN_TRENDS,
    ]) {
      expect(Object.isFrozen(values)).toBe(true);
      expect(() => Object.defineProperty(values, 'includes', { value: () => true })).toThrow();
    }
  });

  it('is default-deny when no caller-supplied policy snapshot resolves the capability', () => {
    const simulator = new PublicHealthPolicySimulator(new TestPolicySnapshot(), { now: () => NOW });
    expect(simulator.evaluate(request())).toMatchObject({
      conforms: false,
      code: 'capability-not-found',
      authorityStatus: 'unverified-policy-simulation',
      executionPermitted: false,
    });
    expect('authority' in simulator).toBe(false);
    expect('clock' in simulator).toBe(false);
    expect('authorizeInternal' in simulator).toBe(false);
  });

  it('can report a matching policy without granting execution authority', () => {
    const simulator = new PublicHealthPolicySimulator(policySnapshot(), { now: () => NOW });
    const report = simulator.evaluate(request());
    expect(report).toMatchObject({
      conforms: true,
      code: 'policy-conforms',
      authorityStatus: 'unverified-policy-simulation',
      executionPermitted: false,
    });
    expect('allowed' in report).toBe(false);
  });

  it('blocks cross-tenant replay, same-time revocation, and unknown request fields', () => {
    const snapshot = policySnapshot();
    const simulator = new PublicHealthPolicySimulator(snapshot, { now: () => NOW });
    expect(simulator.evaluate(request({ tenantId: 'tenant-b' }))).toMatchObject({
      conforms: false,
      code: 'capability-binding-mismatch',
    });

    const consent = snapshot.consents.get('consent-1');
    if (!consent) throw new Error('fixture missing consent');
    snapshot.consents.set('consent-1', { ...consent, revokedAt: NOW.toISOString() });
    expect(simulator.evaluate(request())).toMatchObject({ conforms: false, code: 'consent-inactive' });

    const extended = { ...request(), rawRecord: 'forbidden' } as HealthAdmissionRequest;
    expect(simulator.evaluate(extended)).toMatchObject({ conforms: false, code: 'invalid-request' });

    const malformedId = { ...request(), requestId: 'Synthetic Patient PHI\n123' } as HealthAdmissionRequest;
    const malformedReport = simulator.evaluate(malformedId);
    expect(malformedReport.requestId).toBe('invalid-request');
    expect(JSON.stringify(malformedReport)).not.toContain('Synthetic Patient PHI');
  });

  it('requires plain own request fields and binds the exact canonical operation', () => {
    const simulator = new PublicHealthPolicySimulator(policySnapshot(), { now: () => NOW });
    const inheritedRequest = Object.create(request()) as HealthAdmissionRequest;
    expect(simulator.evaluate(inheritedRequest)).toMatchObject({
      conforms: false,
      code: 'invalid-request',
      requestId: 'invalid-request',
    });
    expect(() => healthOperationDigest(inheritedRequest)).toThrow(/plain object/i);

    const first = healthOperationDigest(request());
    const second = healthOperationDigest(request({ resourceId: 'record-index-2' }));
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toBe(second);
    expect(first).not.toBe(sha256Hex('{}'));

    let requestPropertyReads = 0;
    const proxiedRequest = new Proxy(request(), {
      get(target, property, receiver) {
        requestPropertyReads += 1;
        return Reflect.get(target, property, receiver);
      },
    });
    expect(healthOperationDigest(proxiedRequest)).toBe(first);
    expect(requestPropertyReads).toBe(0);
  });

  it('rejects unknown and inherited authority records before conformance simulation', () => {
    const unknownSnapshot = policySnapshot();
    const capability = unknownSnapshot.capabilities.get('cap-1');
    if (!capability) throw new Error('fixture missing capability');
    unknownSnapshot.capabilities.set('cap-1', {
      ...capability,
      revoked: true,
    } as HealthCapabilityGrant);
    expect(new PublicHealthPolicySimulator(unknownSnapshot, { now: () => NOW }).evaluate(request())).toMatchObject({
      conforms: false,
      code: 'invalid-request',
    });

    const inheritedCapabilitySnapshot = policySnapshot();
    inheritedCapabilitySnapshot.capabilities.set(
      'cap-1',
      Object.create(capability) as HealthCapabilityGrant,
    );
    expect(new PublicHealthPolicySimulator(
      inheritedCapabilitySnapshot,
      { now: () => NOW },
    ).evaluate(request())).toMatchObject({ conforms: false, code: 'invalid-request' });

    const inheritedConsentSnapshot = policySnapshot();
    const consent = inheritedConsentSnapshot.consents.get('consent-1');
    if (!consent) throw new Error('fixture missing consent');
    inheritedConsentSnapshot.consents.set(
      'consent-1',
      Object.create(consent) as HealthConsentGrant,
    );
    expect(new PublicHealthPolicySimulator(
      inheritedConsentSnapshot,
      { now: () => NOW },
    ).evaluate(request())).toMatchObject({ conforms: false, code: 'invalid-request' });
  });

  it('does not echo errors thrown by caller-supplied policy repositories', () => {
    const secret = 'PRIVATE_PATIENT_SECRET_FROM_REPOSITORY';
    const throwingRepository: HealthPolicySimulationRepository = {
      resolveCapability() { throw new Error(secret); },
      resolveConsent() { return undefined; },
      resolveEgressPolicy() { return undefined; },
      resolveHumanApproval() { return undefined; },
    };
    const report = new PublicHealthPolicySimulator(
      throwingRepository,
      { now: () => NOW },
    ).evaluate(request());

    expect(report).toMatchObject({ conforms: false, code: 'invalid-request' });
    expect(JSON.stringify(report)).not.toContain(secret);
  });

  it('rejects caller-overridden scope array methods instead of reporting false conformance', () => {
    const snapshot = policySnapshot();
    const capability = snapshot.capabilities.get('cap-1');
    if (!capability) throw new Error('fixture missing capability');
    const actions = Object.assign(
      ['prepare-clinician-export'] as HealthCapabilityGrant['actions'],
      { includes: () => true },
    );
    snapshot.capabilities.set('cap-1', { ...capability, actions });
    expect(new PublicHealthPolicySimulator(snapshot, { now: () => NOW }).evaluate(request())).toMatchObject({
      conforms: false,
      code: 'invalid-request',
    });

    const egressSnapshot = policySnapshot();
    const egress = egressSnapshot.egressPolicies.get('egress-1');
    if (!egress) throw new Error('fixture missing egress policy');
    const destinations = Object.assign(
      ['encrypted-local-export'] as HealthEgressPolicy['allowedDestinations'],
      { includes: () => true },
    );
    egressSnapshot.egressPolicies.set('egress-1', { ...egress, allowedDestinations: destinations });
    expect(new PublicHealthPolicySimulator(egressSnapshot, { now: () => NOW }).evaluate(request({
      action: 'create-second-brain-projection',
      destination: 'second-brain',
    }))).toMatchObject({ conforms: false, code: 'invalid-request' });
  });

  it('snapshots authority descriptors without invoking Proxy property getters', () => {
    const snapshot = policySnapshot();
    const capability = snapshot.capabilities.get('cap-1');
    if (!capability) throw new Error('fixture missing capability');
    let propertyReads = 0;
    snapshot.capabilities.set('cap-1', new Proxy(capability, {
      get(target, property, receiver) {
        propertyReads += 1;
        return Reflect.get(target, property, receiver);
      },
    }));

    expect(new PublicHealthPolicySimulator(snapshot, { now: () => NOW }).evaluate(request())).toMatchObject({
      conforms: true,
      executionPermitted: false,
    });
    expect(propertyReads).toBe(0);
  });

  it('never treats egress preview as executable admission', () => {
    const simulator = new PublicHealthPolicySimulator(policySnapshot(), { now: () => NOW });
    const egressRequest = request({
      action: 'create-second-brain-projection',
      destination: 'second-brain',
    });
    expect(simulator.evaluate(egressRequest)).toMatchObject({
      conforms: false,
      code: 'payload-digest-required',
      executionPermitted: false,
    });
  });
});

describe('report-only Second Brain draft preparation', () => {
  it('does not export the internal payload or digest factory', () => {
    expect('createSecondBrainProjectionPlan' in sovereignRuntime).toBe(false);
  });

  it('rejects free text, identifiers, caller-authored sensitivity, and genomic fields without echoing them', async () => {
    const simulator = new PublicHealthPolicySimulator(policySnapshot(), { now: () => NOW });
    const forbiddenDrafts = [
      { ...projectionDraft(), summary: 'Jane Doe takes medication at 12 Example Street' },
      { ...projectionDraft(), title: 'Patient MRN 12345' },
      { ...projectionDraft(), sensitivity: 'public' },
      { ...projectionDraft(), sourceRecordDigests: [sha256Hex('record')] },
      { ...projectionDraft(), gene: 'BRCA1', variant: 'rs123' },
    ];

    for (const draft of forbiddenDrafts) {
      const result = await simulator.prepareSecondBrainProjection(
        request({ action: 'create-second-brain-projection', destination: 'second-brain' }),
        draft as SecondBrainProjectionDraft,
      );
      expect(result).toMatchObject({ ok: false, decision: { code: 'invalid-request' } });
      expect(JSON.stringify(result)).not.toMatch(/Jane Doe|12 Example Street|BRCA1|rs123|MRN 12345/i);
    }
  });

  it('rejects duplicate or unknown wellness pattern keys through the public preparation boundary', async () => {
    const simulator = new PublicHealthPolicySimulator(policySnapshot(), { now: () => NOW });
    const duplicateResult = await simulator.prepareSecondBrainProjection(
      request({ action: 'create-second-brain-projection', destination: 'second-brain' }),
      projectionDraft({
      patterns: [
        { key: 'sleep-consistency', trend: 'stable' },
        { key: 'sleep-consistency', trend: 'improving' },
      ],
      }),
    );
    expect(duplicateResult).toMatchObject({ ok: false, decision: { code: 'invalid-request' } });

    const unknownResult = await simulator.prepareSecondBrainProjection(
      request({ action: 'create-second-brain-projection', destination: 'second-brain' }),
      projectionDraft({ patterns: [{ key: 'diagnosis' as 'sleep-consistency', trend: 'stable' }] }),
    );
    expect(unknownResult).toMatchObject({ ok: false, decision: { code: 'invalid-request' } });
  });

  it('keeps projection egress disabled even when a caller supplies self-authorizing policy data', async () => {
    const snapshot = policySnapshot();
    const simulator = new PublicHealthPolicySimulator(snapshot, { now: () => NOW });
    const result = await simulator.prepareSecondBrainProjection(
      request({ action: 'create-second-brain-projection', destination: 'second-brain' }),
      projectionDraft(),
    );

    expect(result).toMatchObject({
      ok: false,
      decision: { code: 'public-runtime-report-only', executionPermitted: false },
    });
    expect(JSON.stringify(result)).not.toMatch(/payload|payloadSha256|sleep-consistency|recovery-self-rating/i);
  });

  it('fails closed without echoing errors from hostile projection objects', async () => {
    const secret = 'PRIVATE_DRAFT_PROXY_SECRET';
    const hostileDraft = new Proxy({}, {
      getPrototypeOf() { throw new Error(secret); },
    }) as SecondBrainProjectionDraft;
    const result = await new PublicHealthPolicySimulator(
      policySnapshot(),
      { now: () => NOW },
    ).prepareSecondBrainProjection(
      request({ action: 'create-second-brain-projection', destination: 'second-brain' }),
      hostileDraft,
    );

    expect(result).toMatchObject({ ok: false, decision: { code: 'invalid-request' } });
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});

describe('report-only manifest export preparation', () => {
  const exportRequest = request({
    action: 'prepare-clinician-export',
    purpose: 'clinician-handoff',
    sensitivity: 'clinical',
    destination: 'clinician-handoff',
  });

  it('does not export the internal export payload or digest factory', () => {
    expect('createSafeExportPlan' in sovereignRuntime).toBe(false);
  });

  it('rejects caller-readable record IDs and cross-tenant descriptors without returning the records', async () => {
    const simulator = new PublicHealthPolicySimulator(policySnapshot(), { now: () => NOW });
    const callerReadable = await simulator.prepareSafeExport(exportRequest, [
      { ...record(), recordId: 'local-record-1' } as HealthRecordDescriptor,
    ]);
    expect(callerReadable).toMatchObject({ ok: false, decision: { code: 'invalid-request' } });
    expect(JSON.stringify(callerReadable)).not.toContain('local-record-1');

    const crossTenant = await simulator.prepareSafeExport(
      exportRequest,
      [record('c', { tenantId: 'tenant-b' })],
    );
    expect(crossTenant).toMatchObject({ ok: false, decision: { code: 'invalid-request' } });
    expect(JSON.stringify(crossTenant)).not.toMatch(/opaque:|tenant-b|contentSha256/i);
  });

  it('keeps export production and transport disabled in public code', async () => {
    const snapshot = policySnapshot();
    const simulator = new PublicHealthPolicySimulator(snapshot, { now: () => NOW });
    const result = await simulator.prepareSafeExport(exportRequest, [record()]);

    expect(result).toMatchObject({
      ok: false,
      decision: { code: 'public-runtime-report-only', executionPermitted: false },
    });
    expect(JSON.stringify(result)).not.toMatch(/opaque:|contentSha256|sourceReceiptIds|payloadSha256/i);
  });

  it('fails closed without echoing errors from hostile export arrays', async () => {
    const secret = 'PRIVATE_EXPORT_PROXY_SECRET';
    const hostileRecords = new Proxy([], {
      get(_target, property, receiver) {
        if (property === 'length') throw new Error(secret);
        return Reflect.get(_target, property, receiver);
      },
    }) as HealthRecordDescriptor[];
    const result = await new PublicHealthPolicySimulator(
      policySnapshot(),
      { now: () => NOW },
    ).prepareSafeExport(exportRequest, hostileRecords);

    expect(result).toMatchObject({ ok: false, decision: { code: 'invalid-request' } });
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});
