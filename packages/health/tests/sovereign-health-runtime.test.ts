import { describe, expect, it } from 'vitest';
import {
  SovereignHealthRuntime,
  createSafeExportPlan,
  createSecondBrainProjectionPlan,
  healthOperationDigest,
} from '../src/sovereign-health-runtime.js';
import { sha256Hex } from '../src/integrity.js';
import type {
  HealthAdmissionRequest,
  HealthApprovalClaimRequest,
  HealthApprovalClaimResult,
  HealthAuthorityRepository,
  HealthCapabilityGrant,
  HealthConsentGrant,
  HealthEgressPolicy,
  HealthHumanApproval,
  HealthRecordDescriptor,
  SecondBrainProjectionDraft,
} from '../src/sovereign-contracts.js';

const NOW = new Date('2026-08-24T12:00:00.000Z');

class TestAuthority implements HealthAuthorityRepository {
  capabilities = new Map<string, HealthCapabilityGrant>();
  consents = new Map<string, HealthConsentGrant>();
  egressPolicies = new Map<string, HealthEgressPolicy>();
  approvals = new Map<string, HealthHumanApproval>();
  claims = new Map<string, HealthApprovalClaimRequest>();
  beforeClaim?: (request: HealthApprovalClaimRequest) => void;

  resolveCapability(id: string) {
    return this.capabilities.get(id);
  }

  resolveConsent(id: string) {
    return this.consents.get(id);
  }

  resolveEgressPolicy(id: string) {
    return this.egressPolicies.get(id);
  }

  resolveHumanApproval(id: string) {
    return this.approvals.get(id);
  }

  async claimHumanApproval(request: HealthApprovalClaimRequest): Promise<HealthApprovalClaimResult> {
    // There is deliberately no await before this read/check/write sequence. It
    // models the single transaction a durable authority adapter must provide.
    this.beforeClaim?.(request);
    if (this.claims.has(request.approvalId)) {
      return { claimed: false, reason: 'already-claimed' };
    }
    const approval = this.approvals.get(request.approvalId);
    if (approval === undefined) return { claimed: false, reason: 'not-found' };

    const instant = NOW.getTime();
    const active =
      Number.isFinite(instant) &&
      Date.parse(approval.issuedAt) <= instant &&
      instant < Date.parse(approval.expiresAt) &&
      (approval.revokedAt === undefined || instant < Date.parse(approval.revokedAt));
    if (!active) return { claimed: false, reason: 'inactive' };

    if (
      approval.id !== request.approvalId ||
      approval.tenantId !== request.tenantId ||
      approval.subjectId !== request.subjectId ||
      approval.actorId !== request.actorId ||
      approval.destination !== request.destination ||
      approval.operationDigest !== request.operationDigest ||
      approval.payloadDigest !== request.payloadDigest
    ) {
      return { claimed: false, reason: 'binding-mismatch' };
    }

    this.claims.set(request.approvalId, Object.freeze({ ...request }));
    return {
      claimed: true,
      claimId: `claim:${sha256Hex(JSON.stringify({ ...request, claimedAt: NOW.toISOString() }))}`,
      claimedAt: NOW.toISOString(),
      ...request,
    };
  }
}

function createAuthority(): TestAuthority {
  const authority = new TestAuthority();
  authority.consents.set('consent-1', {
    id: 'consent-1',
    tenantId: 'tenant-a',
    subjectId: 'subject-a',
    actorId: 'agent-a',
    actions: [
      'read-vault-metadata',
      'create-second-brain-projection',
      'prepare-clinician-export',
      'prepare-encrypted-local-export',
    ],
    purposes: ['self-tracking', 'wellness-planning', 'clinician-handoff'],
    sensitivities: ['public', 'personal', 'clinical'],
    issuedAt: '2026-08-24T00:00:00.000Z',
    expiresAt: '2026-08-25T00:00:00.000Z',
  });
  authority.capabilities.set('cap-1', {
    id: 'cap-1',
    tenantId: 'tenant-a',
    subjectId: 'subject-a',
    actorId: 'agent-a',
    actions: [
      'read-vault-metadata',
      'create-second-brain-projection',
      'prepare-clinician-export',
      'prepare-encrypted-local-export',
    ],
    purposes: ['self-tracking', 'wellness-planning', 'clinician-handoff'],
    sensitivities: ['public', 'personal', 'clinical'],
    consentId: 'consent-1',
    egressPolicyId: 'egress-1',
    issuedAt: '2026-08-24T00:00:00.000Z',
    expiresAt: '2026-08-25T00:00:00.000Z',
  });
  authority.egressPolicies.set('egress-1', {
    id: 'egress-1',
    tenantId: 'tenant-a',
    allowedDestinations: ['second-brain', 'clinician-handoff', 'encrypted-local-export'],
    allowedPurposes: ['self-tracking', 'wellness-planning', 'clinician-handoff'],
    allowedSensitivities: ['public', 'personal', 'clinical'],
    requiresHumanApproval: true,
    issuedAt: '2026-08-24T00:00:00.000Z',
    expiresAt: '2026-08-25T00:00:00.000Z',
  });
  return authority;
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

function projectionDraft(
  overrides: Partial<SecondBrainProjectionDraft> = {}
): SecondBrainProjectionDraft {
  return {
    title: 'Weekly recovery pattern',
    summary: 'Energy was steadier on days with a consistent sleep window.',
    period: '2026-08',
    tags: ['recovery', 'weekly-review'],
    sourceRecordDigests: [sha256Hex('synthetic-record-a'), sha256Hex('synthetic-record-b')],
    sensitivity: 'personal',
    ...overrides,
  };
}

function clinicianExportRequest(
  overrides: Partial<HealthAdmissionRequest> = {}
): HealthAdmissionRequest {
  return request({
    action: 'prepare-clinician-export',
    purpose: 'clinician-handoff',
    sensitivity: 'clinical',
    destination: 'clinician-handoff',
    ...overrides,
  });
}

function healthRecord(
  recordId = 'local-record-1',
  overrides: Partial<HealthRecordDescriptor> = {}
): HealthRecordDescriptor {
  return {
    recordId,
    tenantId: 'tenant-a',
    subjectId: 'subject-a',
    sensitivity: 'clinical',
    contentSha256: sha256Hex(`synthetic-fixture:${recordId}`),
    byteLength: 26,
    mediaType: 'application/pdf',
    sourceReceiptIds: [`receipt-${sha256Hex(recordId).slice(0, 16)}`],
    ...overrides,
  };
}

function addApproval(
  authority: TestAuthority,
  operation: HealthAdmissionRequest,
  payloadDigest: string,
  overrides: Partial<HealthHumanApproval> = {}
): HealthAdmissionRequest {
  if (operation.destination === undefined) throw new Error('Test operation needs a destination');
  const approvalId = overrides.id ?? 'approval-1';
  const approved = { ...operation, humanApprovalId: approvalId };
  authority.approvals.set(approvalId, {
    id: approvalId,
    tenantId: approved.tenantId,
    subjectId: approved.subjectId,
    actorId: approved.actorId,
    operationDigest: healthOperationDigest(approved),
    payloadDigest,
    destination: operation.destination,
    approvedBy: 'human-owner',
    issuedAt: '2026-08-24T11:00:00.000Z',
    expiresAt: '2026-08-24T13:00:00.000Z',
    ...overrides,
  });
  return approved;
}

function approveProjection(
  authority: TestAuthority,
  draft: SecondBrainProjectionDraft = projectionDraft(),
  approvalOverrides: Partial<HealthHumanApproval> = {}
): HealthAdmissionRequest {
  const operation = request({
    action: 'create-second-brain-projection',
    destination: 'second-brain',
  });
  return addApproval(
    authority,
    operation,
    createSecondBrainProjectionPlan(draft).payloadSha256,
    approvalOverrides
  );
}

function approveExport(
  authority: TestAuthority,
  records: readonly HealthRecordDescriptor[],
  approvalOverrides: Partial<HealthHumanApproval> = {}
): HealthAdmissionRequest {
  const operation = clinicianExportRequest();
  return addApproval(
    authority,
    operation,
    createSafeExportPlan(operation, records).payloadSha256,
    approvalOverrides
  );
}

describe('SovereignHealthRuntime admission', () => {
  it('is default-deny when no authority-owned capability exists', () => {
    const runtime = new SovereignHealthRuntime(new TestAuthority(), { now: () => NOW });
    expect(runtime.authorize(request())).toMatchObject({ allowed: false, code: 'capability-not-found' });
  });

  it('rejects unknown request fields instead of ignoring an untrusted extension', () => {
    const runtime = new SovereignHealthRuntime(createAuthority(), { now: () => NOW });
    const extended = { ...request(), rawRecord: 'synthetic-but-forbidden' } as HealthAdmissionRequest;
    expect(runtime.authorize(extended)).toMatchObject({ allowed: false, code: 'invalid-request' });
  });

  it('blocks cross-tenant capability replay', () => {
    const authority = createAuthority();
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    expect(runtime.authorize(request({ tenantId: 'tenant-b' }))).toMatchObject({
      allowed: false,
      code: 'capability-binding-mismatch',
    });
  });

  it('blocks an authority repository that substitutes a differently identified grant', () => {
    const authority = createAuthority();
    const capability = authority.capabilities.get('cap-1');
    if (capability === undefined) throw new Error('fixture missing capability');
    authority.capabilities.set('cap-1', { ...capability, id: 'cap-substituted' });
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    expect(runtime.authorize(request())).toMatchObject({
      allowed: false,
      code: 'capability-binding-mismatch',
    });
  });

  it('re-resolves consent and blocks same-timestamp revocation', () => {
    const authority = createAuthority();
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    expect(runtime.authorize(request()).allowed).toBe(true);

    const consent = authority.consents.get('consent-1');
    if (consent === undefined) throw new Error('fixture missing consent');
    authority.consents.set('consent-1', { ...consent, revokedAt: NOW.toISOString() });
    expect(runtime.authorize(request())).toMatchObject({ allowed: false, code: 'consent-inactive' });
  });

  it('blocks ungranted purpose, sensitivity, and malformed authority enums', () => {
    const authority = createAuthority();
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    expect(runtime.authorize(request({ purpose: 'personal-research' }))).toMatchObject({
      allowed: false,
      code: 'capability-scope-denied',
    });
    expect(runtime.authorize(request({ sensitivity: 'genomic' }))).toMatchObject({
      allowed: false,
      code: 'capability-scope-denied',
    });

    const capability = authority.capabilities.get('cap-1');
    if (capability === undefined) throw new Error('fixture missing capability');
    authority.capabilities.set('cap-1', {
      ...capability,
      sensitivities: ['personal', 'classified'] as HealthCapabilityGrant['sensitivities'],
    });
    expect(runtime.authorize(request())).toMatchObject({ allowed: false, code: 'invalid-request' });
  });

  it('keeps egress preview closed until a runtime-computed payload digest is available', () => {
    const authority = createAuthority();
    const operation = approveProjection(authority);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });

    expect(runtime.authorize(operation)).toMatchObject({
      allowed: false,
      code: 'payload-digest-required',
    });
    expect(authority.claims.size).toBe(0);
  });

  it('applies a hard sensitivity ceiling to Second Brain egress before any rank can fail open', () => {
    const authority = createAuthority();
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    const operation = request({
      action: 'create-second-brain-projection',
      purpose: 'clinician-handoff',
      sensitivity: 'clinical',
      destination: 'second-brain',
    });
    expect(runtime.authorize(operation)).toMatchObject({
      allowed: false,
      code: 'sensitivity-ceiling-denied',
    });
  });
});

describe('payload-bound, single-use Second Brain projection', () => {
  it('normalizes unordered arrays and Unicode before calculating a deterministic digest', () => {
    const first = projectionDraft({
      title: 'Caf\u00e9 recovery',
      tags: ['weekly-review', 'recovery'],
    });
    const second = projectionDraft({
      title: 'Cafe\u0301 recovery',
      tags: ['recovery', 'weekly-review'],
      sourceRecordDigests: [...first.sourceRecordDigests].reverse(),
    });
    expect(createSecondBrainProjectionPlan(first).payloadSha256).toBe(
      createSecondBrainProjectionPlan(second).payloadSha256
    );
  });

  it('creates a sanitized one-way projection only after consuming its exact approval', async () => {
    const authority = createAuthority();
    const draft = projectionDraft();
    const operation = approveProjection(authority, draft);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    const result = await runtime.prepareSecondBrainProjection(operation, draft);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.projection).toMatchObject({
      direction: 'health-vault-to-second-brain-only',
      containsRawRecords: false,
      containsVaultLocation: false,
      payloadSha256: createSecondBrainProjectionPlan(draft).payloadSha256,
    });
    expect(result.decision.approvalClaimId).toMatch(/^claim:/);
    expect(authority.claims.size).toBe(1);
    expect(JSON.stringify(result.projection)).not.toContain('tenant-a');
    expect(JSON.stringify(result.projection)).not.toContain('subject-a');
  });

  it('rejects direct identifiers before consuming an approval', async () => {
    const authority = createAuthority();
    const operation = addApproval(
      authority,
      request({ action: 'create-second-brain-projection', destination: 'second-brain' }),
      sha256Hex('untrusted-invalid-draft')
    );
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    const result = await runtime.prepareSecondBrainProjection(operation, projectionDraft({
      summary: 'Send details to patient@example.test',
    }));

    expect(result).toMatchObject({ ok: false, decision: { code: 'invalid-request' } });
    expect(authority.claims.size).toBe(0);
  });

  it('rejects a changed projection payload under an otherwise valid approval', async () => {
    const authority = createAuthority();
    const approvedDraft = projectionDraft();
    const operation = approveProjection(authority, approvedDraft);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    const changedDraft = projectionDraft({ summary: 'A materially different projection.' });

    await expect(runtime.prepareSecondBrainProjection(operation, changedDraft)).resolves.toMatchObject({
      ok: false,
      decision: { code: 'payload-binding-mismatch' },
    });
    expect(authority.claims.size).toBe(0);
  });

  it('rejects mismatched, expired, and revoked approvals without claiming them', async () => {
    const draft = projectionDraft();

    for (const [overrides, code] of [
      [{ operationDigest: sha256Hex('other-operation') }, 'human-approval-binding-mismatch'],
      [{ expiresAt: '2026-08-24T11:59:59.000Z' }, 'human-approval-inactive'],
      [{ revokedAt: NOW.toISOString() }, 'human-approval-inactive'],
    ] as const) {
      const authority = createAuthority();
      const operation = approveProjection(authority, draft, overrides);
      const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
      const result = await runtime.prepareSecondBrainProjection(operation, draft);
      expect(result).toMatchObject({ ok: false, decision: { code } });
      expect(authority.claims.size).toBe(0);
    }
  });

  it('makes a claimed approval unusable on replay', async () => {
    const authority = createAuthority();
    const draft = projectionDraft();
    const operation = approveProjection(authority, draft);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });

    expect((await runtime.prepareSecondBrainProjection(operation, draft)).ok).toBe(true);
    await expect(runtime.prepareSecondBrainProjection(operation, draft)).resolves.toMatchObject({
      ok: false,
      decision: { code: 'human-approval-already-claimed' },
    });
    expect(authority.claims.size).toBe(1);
  });

  it('honors revocation observed atomically at claim time after admission preview', async () => {
    const authority = createAuthority();
    const draft = projectionDraft();
    const operation = approveProjection(authority, draft);
    authority.beforeClaim = ({ approvalId }) => {
      const approval = authority.approvals.get(approvalId);
      if (approval === undefined) throw new Error('fixture missing approval');
      authority.approvals.set(approvalId, { ...approval, revokedAt: NOW.toISOString() });
    };
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });

    await expect(runtime.prepareSecondBrainProjection(operation, draft)).resolves.toMatchObject({
      ok: false,
      decision: { code: 'human-approval-inactive' },
    });
    expect(authority.claims.size).toBe(0);
  });

  it('allows exactly one winner when the same approval is claimed concurrently', async () => {
    const authority = createAuthority();
    const draft = projectionDraft();
    const operation = approveProjection(authority, draft);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });

    const results = await Promise.all([
      runtime.prepareSecondBrainProjection(operation, draft),
      runtime.prepareSecondBrainProjection(operation, draft),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)[0]).toMatchObject({
      decision: { code: 'human-approval-already-claimed' },
    });
    expect(authority.claims.size).toBe(1);
  });
});

describe('payload-bound, manifest-only safe export', () => {
  it('normalizes record order before calculating the export payload digest', () => {
    const operation = clinicianExportRequest();
    const first = healthRecord('local-record-1');
    const second = healthRecord('local-record-2');
    expect(createSafeExportPlan(operation, [first, second]).payloadSha256).toBe(
      createSafeExportPlan(operation, [second, first]).payloadSha256
    );
  });

  it('prepares a manifest-only clinician export with opaque record references', async () => {
    const authority = createAuthority();
    const records = [healthRecord()];
    const operation = approveExport(authority, records);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    const result = await runtime.prepareSafeExport(operation, records);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.manifest.rawBytesIncluded).toBe(false);
    expect(result.manifest.transportPerformed).toBe(false);
    expect(result.manifest.payloadSha256).toBe(createSafeExportPlan(operation, records).payloadSha256);
    expect(result.manifest.approvalClaimId).toMatch(/^claim:/);
    expect(result.manifest.records[0]?.opaqueRecordRef).toMatch(/^record:[a-f0-9]{64}$/);
    expect(JSON.stringify(result.manifest)).not.toContain('local-record-1');
  });

  it('blocks a changed export record set under an approval for another set', async () => {
    const authority = createAuthority();
    const approvedRecords = [healthRecord('local-record-1')];
    const operation = approveExport(authority, approvedRecords);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    const changedRecords = [...approvedRecords, healthRecord('local-record-2')];

    await expect(runtime.prepareSafeExport(operation, changedRecords)).resolves.toMatchObject({
      ok: false,
      decision: { code: 'payload-binding-mismatch' },
    });
    expect(authority.claims.size).toBe(0);
  });

  it('does not prepare the same approved export twice', async () => {
    const authority = createAuthority();
    const records = [healthRecord()];
    const operation = approveExport(authority, records);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });

    expect((await runtime.prepareSafeExport(operation, records)).ok).toBe(true);
    await expect(runtime.prepareSafeExport(operation, records)).resolves.toMatchObject({
      ok: false,
      decision: { code: 'human-approval-already-claimed' },
    });
    expect(authority.claims.size).toBe(1);
  });

  it('blocks a cross-tenant record before operation claim', async () => {
    const authority = createAuthority();
    const validRecords = [healthRecord()];
    const operation = approveExport(authority, validRecords);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    const result = await runtime.prepareSafeExport(operation, [
      healthRecord('foreign-record', { tenantId: 'tenant-b' }),
    ]);

    expect(result).toMatchObject({ ok: false, decision: { code: 'invalid-request' } });
    expect(authority.claims.size).toBe(0);
  });

  it('fails closed on an unknown runtime record sensitivity and preserves the approval', async () => {
    const authority = createAuthority();
    const validRecords = [healthRecord()];
    const operation = approveExport(authority, validRecords);
    const runtime = new SovereignHealthRuntime(authority, { now: () => NOW });
    const invalidRecord = healthRecord('local-record-1', {
      sensitivity: 'classified' as HealthRecordDescriptor['sensitivity'],
    });

    await expect(runtime.prepareSafeExport(operation, [invalidRecord])).resolves.toMatchObject({
      ok: false,
      decision: { code: 'invalid-request' },
    });
    expect(authority.claims.size).toBe(0);
    expect((await runtime.prepareSafeExport(operation, validRecords)).ok).toBe(true);
  });
});
