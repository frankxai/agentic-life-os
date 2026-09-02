/**
 * Synthetic fixtures for the five domains.
 *
 * Every value here is invented. No identifier, digest, or descriptor corresponds
 * to a real person, account, record, or institution, and none ever should — the
 * repository's boundary is that raw personal data does not live in it.
 *
 * Each domain carries a `privateBodies` map holding a leak-bait token per resource.
 * Nothing in the kernel reads it. It exists so the projection leak eval has
 * something unmistakable to look for: if a bait token ever appears in a public
 * projection, a body escaped a descriptor boundary.
 */

import {
  AUTHORITY_STORE_VERSION,
  type AdmissionRequest,
  type AlosDomain,
  ALOS_DOMAINS,
  type AuthorityStore,
  type CapabilityGrant,
  type ConsentGrant,
  type DomainPackDescriptor,
  type EgressPolicy,
  type HumanApproval,
  type ResourceDescriptor,
  type RuntimeClock,
  type Sensitivity,
} from './contracts.js';
import { operationDigest } from './simulator.js';

const TENANT = 'tenant-synthetic';
const SUBJECT = 'subject-synthetic';
const ISSUED_AT = '2026-01-01T00:00:00.000Z';
const EXPIRES_AT = '2027-01-01T00:00:00.000Z';

/** Fixed instant inside every fixture validity window. */
export const FIXTURE_NOW = new Date('2026-06-01T12:00:00.000Z');
export const FIXTURE_CLOCK: RuntimeClock = Object.freeze({ now: () => FIXTURE_NOW });

export interface SyntheticDomainFixture {
  readonly pack: DomainPackDescriptor;
  readonly capability: CapabilityGrant;
  readonly consent: ConsentGrant;
  readonly egressPolicy: EgressPolicy;
  readonly humanApproval: HumanApproval;
  readonly resources: readonly ResourceDescriptor[];
  /** Stand-in for record bodies that live behind the private boundary. Never projected. */
  readonly privateBodies: Readonly<Record<string, string>>;
}

interface DomainSeed {
  readonly actions: readonly string[];
  readonly purposes: readonly string[];
  readonly destinations: readonly string[];
  readonly ceiling: Sensitivity;
  readonly resourceSensitivity: Sensitivity;
}

const SEEDS: Readonly<Record<AlosDomain, DomainSeed>> = Object.freeze({
  health: {
    actions: ['read-vault-metadata', 'prepare-clinician-export'],
    purposes: ['self-tracking', 'clinician-handoff'],
    destinations: ['clinician-handoff'],
    ceiling: 'restricted',
    resourceSensitivity: 'restricted',
  },
  family: {
    actions: ['read-relation-metadata', 'prepare-family-summary'],
    purposes: ['family-coordination', 'personal-research'],
    destinations: ['encrypted-local-export'],
    ceiling: 'sensitive',
    resourceSensitivity: 'sensitive',
  },
  finance: {
    actions: ['read-account-metadata', 'prepare-tax-packet'],
    purposes: ['budgeting', 'tax-preparation'],
    destinations: ['encrypted-local-export'],
    ceiling: 'restricted',
    resourceSensitivity: 'restricted',
  },
  relationships: {
    actions: ['read-contact-metadata', 'prepare-followup-plan'],
    purposes: ['relationship-upkeep'],
    destinations: ['second-brain'],
    ceiling: 'sensitive',
    resourceSensitivity: 'sensitive',
  },
  routines: {
    actions: ['read-routine-metadata', 'prepare-weekly-plan'],
    purposes: ['self-tracking', 'planning'],
    destinations: ['second-brain'],
    ceiling: 'personal',
    resourceSensitivity: 'personal',
  },
});

export function leakBaitFor(domain: AlosDomain): string {
  return `LEAK-BAIT-${domain.toUpperCase()}-BODY`;
}

/** The one egress request each domain's human approval is bound to. */
export function fixtureEgressRequest(domain: AlosDomain): AdmissionRequest {
  const seed = SEEDS[domain];
  return Object.freeze({
    requestId: `req-${domain}-egress`,
    domain,
    tenantId: TENANT,
    subjectId: SUBJECT,
    actorId: `actor-${domain}`,
    capabilityId: `cap-${domain}`,
    action: seed.actions[1]!,
    purpose: seed.purposes[seed.purposes.length - 1]!,
    sensitivity: seed.resourceSensitivity,
    resourceId: `res-${domain}-1`,
    destination: seed.destinations[0]!,
    humanApprovalId: `apr-${domain}`,
    payloadDigest: `payload-digest-${domain}`,
  });
}

/** A read request a domain's own agent is expected to be admitted for. */
export function fixtureReadRequest(domain: AlosDomain): AdmissionRequest {
  const seed = SEEDS[domain];
  return Object.freeze({
    requestId: `req-${domain}-read`,
    domain,
    tenantId: TENANT,
    subjectId: SUBJECT,
    actorId: `actor-${domain}`,
    capabilityId: `cap-${domain}`,
    action: seed.actions[0]!,
    purpose: seed.purposes[0]!,
    sensitivity: seed.resourceSensitivity,
    resourceId: `res-${domain}-1`,
  });
}

function buildFixture(domain: AlosDomain): SyntheticDomainFixture {
  const seed = SEEDS[domain];
  const base = {
    version: AUTHORITY_STORE_VERSION,
    domain,
    tenantId: TENANT,
    subjectId: SUBJECT,
    issuedAt: ISSUED_AT,
    expiresAt: EXPIRES_AT,
  } as const;

  const resources: ResourceDescriptor[] = [1, 2].map((n) => ({
    id: `res-${domain}-${n}`,
    domain,
    tenantId: TENANT,
    subjectId: SUBJECT,
    sensitivity: seed.resourceSensitivity,
  }));

  return Object.freeze({
    pack: Object.freeze({
      domain,
      version: '1.0.0',
      actions: Object.freeze([...seed.actions]),
      purposes: Object.freeze([...seed.purposes]),
      destinations: Object.freeze([...seed.destinations]),
      sensitivityCeiling: seed.ceiling,
    }),
    capability: Object.freeze({
      ...base,
      id: `cap-${domain}`,
      actorId: `actor-${domain}`,
      actions: Object.freeze([...seed.actions]),
      purposes: Object.freeze([...seed.purposes]),
      sensitivities: Object.freeze([seed.resourceSensitivity]),
      consentId: `con-${domain}`,
      egressPolicyId: `egp-${domain}`,
    }),
    consent: Object.freeze({
      ...base,
      id: `con-${domain}`,
      actorId: `actor-${domain}`,
      actions: Object.freeze([...seed.actions]),
      purposes: Object.freeze([...seed.purposes]),
      sensitivities: Object.freeze([seed.resourceSensitivity]),
    }),
    egressPolicy: Object.freeze({
      ...base,
      id: `egp-${domain}`,
      allowedDestinations: Object.freeze([...seed.destinations]),
      allowedPurposes: Object.freeze([...seed.purposes]),
      allowedSensitivities: Object.freeze([seed.resourceSensitivity]),
      requiresHumanApproval: true as const,
    }),
    humanApproval: Object.freeze({
      ...base,
      id: `apr-${domain}`,
      actorId: `actor-${domain}`,
      operationDigest: operationDigest(fixtureEgressRequest(domain)),
      payloadDigest: `payload-digest-${domain}`,
      destination: seed.destinations[0]!,
      approvedBy: `human-${domain}`,
    }),
    resources: Object.freeze(resources),
    privateBodies: Object.freeze(
      Object.fromEntries(resources.map((r) => [r.id, `${leakBaitFor(domain)} for ${r.id}`])),
    ),
  });
}

export const SYNTHETIC_DOMAIN_FIXTURES: Readonly<Record<AlosDomain, SyntheticDomainFixture>> = Object.freeze(
  Object.fromEntries(ALOS_DOMAINS.map((d) => [d, buildFixture(d)])) as Record<AlosDomain, SyntheticDomainFixture>,
);

/**
 * A store holding all five domains at once. This is the shape that makes isolation
 * testable: every record for every part of a life is reachable by id from one
 * snapshot, so nothing but the domain checks keeps them apart.
 */
export function createFixtureStore(
  fixtures: Readonly<Record<AlosDomain, SyntheticDomainFixture>> = SYNTHETIC_DOMAIN_FIXTURES,
): AuthorityStore {
  const all = Object.values(fixtures);
  const capabilities = new Map(all.map((f) => [f.capability.id, f.capability]));
  const consents = new Map(all.map((f) => [f.consent.id, f.consent]));
  const policies = new Map(all.map((f) => [f.egressPolicy.id, f.egressPolicy]));
  const approvals = new Map(all.map((f) => [f.humanApproval.id, f.humanApproval]));
  const packs = new Map(all.map((f) => [f.pack.domain, f.pack]));
  const resources = new Map(all.flatMap((f) => f.resources.map((r) => [r.id, r] as const)));

  const store: AuthorityStore = {
    resolveCapability: (id: string) => capabilities.get(id),
    resolveConsent: (id: string) => consents.get(id),
    resolveEgressPolicy: (id: string) => policies.get(id),
    resolveHumanApproval: (id: string) => approvals.get(id),
    resolveResource: (id: string) => resources.get(id),
    resolveDomainPack: (domain: AlosDomain) => packs.get(domain),
  };
  return Object.freeze(store);
}
