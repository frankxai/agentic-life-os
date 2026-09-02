import { describe, expect, it } from 'vitest';

import {
  ALOS_DOMAINS,
  createFixtureStore,
  FIXTURE_CLOCK,
  fixtureEgressRequest,
  fixtureReadRequest,
  simulateAdmission,
  SYNTHETIC_DOMAIN_FIXTURES,
  type AlosDomain,
} from '../src/index.js';

const store = createFixtureStore();

describe('cross-domain isolation', () => {
  it("admits each domain's own agent reading its own resource", () => {
    for (const domain of ALOS_DOMAINS) {
      const decision = simulateAdmission(fixtureReadRequest(domain), store, FIXTURE_CLOCK);
      expect(decision.blocks, `${domain} should admit its own read`).toEqual([]);
      expect(decision.admissible).toBe(true);
    }
  });

  it('never permits execution, even for a fully admissible request', () => {
    for (const domain of ALOS_DOMAINS) {
      const decision = simulateAdmission(fixtureReadRequest(domain), store, FIXTURE_CLOCK);
      expect(decision.executionPermitted).toBe(false);
      expect(decision.authoritative).toBe(false);
    }
  });

  it('denies every off-diagonal pair in the 5x5 domain matrix', () => {
    const admitted: string[] = [];

    for (const actorDomain of ALOS_DOMAINS) {
      for (const resourceDomain of ALOS_DOMAINS) {
        if (actorDomain === resourceDomain) continue;

        // A real, active, correctly bound capability for the actor's own domain,
        // pointed at another domain's resource. Nothing about the grant is forged.
        const decision = simulateAdmission(
          { ...fixtureReadRequest(actorDomain), resourceId: `res-${resourceDomain}-1` },
          store,
          FIXTURE_CLOCK,
        );

        expect(
          decision.blocks,
          `${actorDomain} -> ${resourceDomain} must block on the domain edge`,
        ).toContain('resource-cross-domain');
        if (decision.admissible) admitted.push(`${actorDomain} -> ${resourceDomain}`);
      }
    }

    expect(admitted).toEqual([]);
  });

  it('a finance agent cannot read a health record', () => {
    const decision = simulateAdmission(
      { ...fixtureReadRequest('finance'), resourceId: 'res-health-1' },
      store,
      FIXTURE_CLOCK,
    );
    expect(decision.admissible).toBe(false);
    expect(decision.blocks).toContain('resource-cross-domain');
  });

  it("a health capability replayed under another domain's request is rejected as cross-domain", () => {
    const decision = simulateAdmission(
      { ...fixtureReadRequest('finance'), capabilityId: 'cap-health' },
      store,
      FIXTURE_CLOCK,
    );
    expect(decision.blocks).toContain('capability-cross-domain');
    expect(decision.admissible).toBe(false);
  });

  it("an approval issued for one domain cannot authorise another domain's egress", () => {
    const request = fixtureEgressRequest('relationships');
    const decision = simulateAdmission({ ...request, humanApprovalId: 'apr-health' }, store, FIXTURE_CLOCK);
    expect(decision.blocks).toContain('human-approval-cross-domain');
    expect(decision.admissible).toBe(false);
  });

  it('holds tenant and subject boundaries independently of the domain boundary', () => {
    const other = simulateAdmission(
      { ...fixtureReadRequest('family'), tenantId: 'tenant-other', subjectId: 'subject-other' },
      store,
      FIXTURE_CLOCK,
    );
    expect(other.blocks).toContain('resource-cross-tenant');
    expect(other.blocks).toContain('resource-subject-mismatch');
    expect(other.blocks).toContain('capability-binding-mismatch');
  });

  it('rejects a request that under-declares how sensitive the resource is', () => {
    const decision = simulateAdmission(
      { ...fixtureReadRequest('health'), sensitivity: 'personal' },
      store,
      FIXTURE_CLOCK,
    );
    expect(decision.blocks).toContain('resource-sensitivity-understated');
  });

  it('refuses a sensitivity above the domain pack ceiling even with a matching grant', () => {
    const decision = simulateAdmission(
      { ...fixtureReadRequest('routines'), sensitivity: 'restricted' },
      store,
      FIXTURE_CLOCK,
    );
    expect(decision.blocks).toContain('domain-sensitivity-ceiling-exceeded');
  });
});

describe('egress admission', () => {
  it('admits a correctly bound egress with a human approval on the exact payload', () => {
    for (const domain of ALOS_DOMAINS) {
      const decision = simulateAdmission(fixtureEgressRequest(domain), store, FIXTURE_CLOCK);
      expect(decision.blocks, `${domain} egress`).toEqual([]);
      expect(decision.executionPermitted).toBe(false);
    }
  });

  it('blocks egress with no human approval', () => {
    const { humanApprovalId, payloadDigest, ...request } = fixtureEgressRequest('finance');
    const decision = simulateAdmission(request, store, FIXTURE_CLOCK);
    expect(decision.blocks).toContain('human-approval-required');
  });

  it('blocks an approval bound to a different payload', () => {
    const decision = simulateAdmission(
      { ...fixtureEgressRequest('finance'), payloadDigest: 'payload-digest-substituted' },
      store,
      FIXTURE_CLOCK,
    );
    expect(decision.blocks).toContain('human-approval-payload-mismatch');
  });

  it("blocks an approval reused for a different operation shape", () => {
    const decision = simulateAdmission(
      { ...fixtureEgressRequest('health'), resourceId: 'res-health-2' },
      store,
      FIXTURE_CLOCK,
    );
    expect(decision.blocks).toContain('human-approval-binding-mismatch');
  });

  it('blocks a destination the domain pack never declared', () => {
    const decision = simulateAdmission(
      { ...fixtureEgressRequest('routines'), destination: 'clinician-handoff' },
      store,
      FIXTURE_CLOCK,
    );
    expect(decision.blocks).toContain('domain-destination-not-declared');
    expect(decision.blocks).toContain('egress-destination-denied');
  });
});

describe('determinism', () => {
  it('produces byte-identical decisions for identical inputs', () => {
    const request = fixtureReadRequest('health');
    const a = simulateAdmission(request, store, FIXTURE_CLOCK);
    const b = simulateAdmission(request, store, FIXTURE_CLOCK);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('sorts and de-duplicates block codes so ordering cannot vary', () => {
    const decision = simulateAdmission(
      { ...fixtureReadRequest('finance'), resourceId: 'res-health-1', capabilityId: 'cap-health' },
      store,
      FIXTURE_CLOCK,
    );
    expect([...decision.blocks]).toEqual([...decision.blocks].sort());
    expect(new Set(decision.blocks).size).toBe(decision.blocks.length);
  });

  it('collects every applicable block rather than stopping at the first', () => {
    const decision = simulateAdmission(
      { ...fixtureReadRequest('finance'), resourceId: 'res-health-1', capabilityId: 'cap-health' },
      store,
      FIXTURE_CLOCK,
    );
    expect(decision.blocks).toContain('capability-cross-domain');
    expect(decision.blocks).toContain('resource-cross-domain');
  });

  it('treats a malformed request as invalid without inspecting the store', () => {
    const decision = simulateAdmission(
      { ...fixtureReadRequest('health'), actorId: '' },
      store,
      FIXTURE_CLOCK,
    );
    expect(decision.blocks).toEqual(['invalid-request']);
  });

  it('fails closed outside the validity window', () => {
    const expired = { now: () => new Date('2030-01-01T00:00:00.000Z') };
    const decision = simulateAdmission(fixtureReadRequest('health'), store, expired);
    expect(decision.blocks).toContain('capability-inactive');
    expect(decision.blocks).toContain('consent-inactive');
  });

  it('fails closed on a revoked capability', () => {
    const fixtures = structuredClone(SYNTHETIC_DOMAIN_FIXTURES) as Record<AlosDomain, typeof SYNTHETIC_DOMAIN_FIXTURES.health>;
    (fixtures.health.capability as { revokedAt?: string }).revokedAt = '2026-05-01T00:00:00.000Z';
    const decision = simulateAdmission(fixtureReadRequest('health'), createFixtureStore(fixtures), FIXTURE_CLOCK);
    expect(decision.blocks).toContain('capability-inactive');
  });
});
