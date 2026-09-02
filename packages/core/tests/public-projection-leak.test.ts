import { describe, expect, it } from 'vitest';

import {
  ALOS_DOMAINS,
  assertCompleteDomainCoverage,
  createFixtureStore,
  FIXTURE_CLOCK,
  findLeakedSubstrings,
  fixtureEgressRequest,
  fixtureReadRequest,
  leakBaitFor,
  projectDecision,
  projectDomain,
  simulateAdmission,
  SYNTHETIC_DOMAIN_FIXTURES,
} from '../src/index.js';

const store = createFixtureStore();

/**
 * Everything a public projection must never carry: the record bodies, and also
 * every identifier in the fixture set. Ids are not secrets in a synthetic fixture,
 * but a real deployment's ids are subject-linkable, so the eval treats them as
 * forbidden here and the projection is built to hold none of them.
 */
const FORBIDDEN = ALOS_DOMAINS.flatMap((domain) => {
  const fixture = SYNTHETIC_DOMAIN_FIXTURES[domain];
  return [
    leakBaitFor(domain),
    ...Object.values(fixture.privateBodies),
    fixture.capability.id,
    fixture.capability.actorId,
    fixture.consent.id,
    fixture.egressPolicy.id,
    fixture.humanApproval.id,
    fixture.humanApproval.approvedBy,
    fixture.humanApproval.operationDigest,
    fixture.humanApproval.payloadDigest,
    fixture.capability.tenantId,
    fixture.capability.subjectId,
    ...fixture.resources.map((r) => r.id),
  ];
});

describe('public projection leak eval', () => {
  it('covers exactly the five domains', () => {
    const projections = ALOS_DOMAINS.map((d) => projectDomain(SYNTHETIC_DOMAIN_FIXTURES[d]));
    expect(() => assertCompleteDomainCoverage(projections)).not.toThrow();
  });

  it('rejects a projection that drops a domain', () => {
    const projections = ALOS_DOMAINS.filter((d) => d !== 'finance').map((d) =>
      projectDomain(SYNTHETIC_DOMAIN_FIXTURES[d]),
    );
    expect(() => assertCompleteDomainCoverage(projections)).toThrow(/must cover exactly/);
  });

  it('leaks nothing from any domain projection', () => {
    for (const domain of ALOS_DOMAINS) {
      const projection = projectDomain(SYNTHETIC_DOMAIN_FIXTURES[domain]);
      expect(findLeakedSubstrings(projection, FORBIDDEN), `${domain} domain projection`).toEqual([]);
    }
  });

  it('leaks nothing from an admitted decision in any domain', () => {
    for (const domain of ALOS_DOMAINS) {
      const decision = simulateAdmission(fixtureReadRequest(domain), store, FIXTURE_CLOCK);
      expect(findLeakedSubstrings(projectDecision(decision), FORBIDDEN), `${domain} read`).toEqual([]);
    }
  });

  it('leaks nothing from a denied cross-domain decision, where the resource id is the tell', () => {
    for (const actor of ALOS_DOMAINS) {
      for (const target of ALOS_DOMAINS) {
        if (actor === target) continue;
        const decision = simulateAdmission(
          { ...fixtureReadRequest(actor), resourceId: `res-${target}-1` },
          store,
          FIXTURE_CLOCK,
        );
        expect(
          findLeakedSubstrings(projectDecision(decision), FORBIDDEN),
          `${actor} -> ${target} denial`,
        ).toEqual([]);
      }
    }
  });

  it('leaks nothing from an egress decision, where an approval digest is in scope', () => {
    for (const domain of ALOS_DOMAINS) {
      const decision = simulateAdmission(fixtureEgressRequest(domain), store, FIXTURE_CLOCK);
      expect(findLeakedSubstrings(projectDecision(decision), FORBIDDEN), `${domain} egress`).toEqual([]);
    }
  });

  it('the eval itself can fail — the unprojected decision does leak', () => {
    const decision = simulateAdmission(fixtureReadRequest('health'), store, FIXTURE_CLOCK);
    // Raw internals are exactly what must not cross the boundary; if this ever
    // comes back clean, the eval has stopped testing anything.
    const raw = { decision, request: fixtureReadRequest('health'), store: SYNTHETIC_DOMAIN_FIXTURES.health };
    expect(findLeakedSubstrings(raw, FORBIDDEN).length).toBeGreaterThan(0);
  });

  it('the projection carries only the allowlisted keys', () => {
    expect(Object.keys(projectDomain(SYNTHETIC_DOMAIN_FIXTURES.health)).sort()).toEqual([
      'declaredActionCount',
      'declaredDestinationCount',
      'declaredPurposeCount',
      'domain',
      'packVersion',
      'resourceCount',
      'schema',
      'sensitivityCeiling',
    ]);
    const decision = simulateAdmission(fixtureReadRequest('health'), store, FIXTURE_CLOCK);
    expect(Object.keys(projectDecision(decision)).sort()).toEqual([
      'admissible',
      'authoritative',
      'blockCount',
      'blocks',
      'domain',
      'executionPermitted',
      'schema',
    ]);
  });
});
