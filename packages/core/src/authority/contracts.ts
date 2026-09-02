/**
 * AuthorityStore.v1 — the domain-agnostic authority contract.
 *
 * This is kernel, not a domain pack. It generalises the health-specific contracts
 * in `@frankx-ai/agentic-health-os` (`sovereign-contracts.ts`), which remain the
 * prior art and the reference implementation for one domain; see
 * `docs/kernel-vs-packs.md` for the boundary and the migration rule. Nothing here
 * is a fork of those concepts — the health pack's vocabulary maps onto this ladder,
 * it does not restate it.
 *
 * Two properties the health contracts could not express, because a single-domain
 * runtime has nowhere to put them:
 *
 * 1. `domain` is a field on every record and every request, so an authority record
 *    minted for one part of a life cannot be replayed against another.
 * 2. A resource is a descriptor, never content. The kernel never sees a record body,
 *    so no evaluation path can leak one.
 *
 * Nothing in this file is authoritative. A caller supplies the store; a caller can
 * lie. Every decision this kernel produces sets `executionPermitted: false`.
 */

export const AUTHORITY_STORE_VERSION = 'AuthorityStore.v1' as const;
export type AuthorityStoreVersion = typeof AUTHORITY_STORE_VERSION;

/**
 * The five parts of a life this runtime keeps apart. Adding one is a kernel change
 * and a new isolation matrix row, deliberately — domains are not configuration.
 */
export const ALOS_DOMAINS = Object.freeze([
  'health',
  'family',
  'finance',
  'relationships',
  'routines',
] as const);
export type AlosDomain = (typeof ALOS_DOMAINS)[number];

/**
 * The kernel sensitivity ladder. Domain packs keep their own richer vocabularies
 * (the health pack's `clinical` and `genomic`, for instance) and map them onto
 * these four rungs. The kernel compares rungs; it never interprets pack labels.
 */
export const SENSITIVITY_LADDER = Object.freeze(['public', 'personal', 'sensitive', 'restricted'] as const);
export type Sensitivity = (typeof SENSITIVITY_LADDER)[number];

export function sensitivityRank(sensitivity: Sensitivity): number {
  return SENSITIVITY_LADDER.indexOf(sensitivity);
}

/** A domain pack's declaration of what it is allowed to ask the kernel for. */
export interface DomainPackDescriptor {
  readonly domain: AlosDomain;
  readonly version: string;
  /** Pack-defined action names. The kernel treats them as opaque strings. */
  readonly actions: readonly string[];
  readonly purposes: readonly string[];
  /** Egress destinations this pack may name. An unlisted destination is a block. */
  readonly destinations: readonly string[];
  /** Nothing in this pack may be requested above this rung, whatever a grant says. */
  readonly sensitivityCeiling: Sensitivity;
}

interface AuthorityRecordBase {
  readonly id: string;
  readonly version: AuthorityStoreVersion;
  readonly domain: AlosDomain;
  readonly tenantId: string;
  readonly subjectId: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly revokedAt?: string;
}

export interface CapabilityGrant extends AuthorityRecordBase {
  readonly actorId: string;
  readonly actions: readonly string[];
  readonly purposes: readonly string[];
  readonly sensitivities: readonly Sensitivity[];
  readonly consentId: string;
  readonly egressPolicyId?: string;
}

export interface ConsentGrant extends AuthorityRecordBase {
  readonly actorId: string;
  readonly actions: readonly string[];
  readonly purposes: readonly string[];
  readonly sensitivities: readonly Sensitivity[];
}

export interface EgressPolicy extends AuthorityRecordBase {
  readonly allowedDestinations: readonly string[];
  readonly allowedPurposes: readonly string[];
  readonly allowedSensitivities: readonly Sensitivity[];
  /** Structurally true. There is no egress path in this runtime without a human. */
  readonly requiresHumanApproval: true;
}

export interface HumanApproval extends AuthorityRecordBase {
  readonly actorId: string;
  readonly operationDigest: string;
  readonly payloadDigest: string;
  readonly destination: string;
  readonly approvedBy: string;
}

/**
 * What the kernel is allowed to know about a record: where it lives and how
 * sensitive it is. No title, no body, no free text. If a field could carry a
 * sentence a person wrote, it does not belong here.
 */
export interface ResourceDescriptor {
  readonly id: string;
  readonly domain: AlosDomain;
  readonly tenantId: string;
  readonly subjectId: string;
  readonly sensitivity: Sensitivity;
}

/**
 * Caller-supplied snapshot. Not an authenticated repository; it cannot grant
 * execution. A private adapter must re-resolve every record inside one
 * transaction at operation time.
 */
export interface AuthorityStore {
  resolveCapability(id: string): CapabilityGrant | undefined;
  resolveConsent(id: string): ConsentGrant | undefined;
  resolveEgressPolicy(id: string): EgressPolicy | undefined;
  resolveHumanApproval(id: string): HumanApproval | undefined;
  resolveResource(id: string): ResourceDescriptor | undefined;
  resolveDomainPack(domain: AlosDomain): DomainPackDescriptor | undefined;
}

export interface RuntimeClock {
  now(): Date;
}

export interface AdmissionRequest {
  readonly requestId: string;
  readonly domain: AlosDomain;
  readonly tenantId: string;
  readonly subjectId: string;
  readonly actorId: string;
  readonly capabilityId: string;
  readonly action: string;
  readonly purpose: string;
  readonly sensitivity: Sensitivity;
  readonly resourceId: string;
  readonly destination?: string;
  readonly humanApprovalId?: string;
  /** Canonical digest of the exact payload an approval was bound to. */
  readonly payloadDigest?: string;
}

export type AdmissionBlockCode =
  | 'invalid-request'
  | 'domain-not-registered'
  | 'domain-action-not-declared'
  | 'domain-purpose-not-declared'
  | 'domain-destination-not-declared'
  | 'domain-sensitivity-ceiling-exceeded'
  | 'capability-not-found'
  | 'capability-inactive'
  | 'capability-cross-domain'
  | 'capability-binding-mismatch'
  | 'capability-scope-denied'
  | 'consent-not-found'
  | 'consent-inactive'
  | 'consent-cross-domain'
  | 'consent-binding-mismatch'
  | 'consent-scope-denied'
  | 'resource-not-found'
  | 'resource-cross-domain'
  | 'resource-cross-tenant'
  | 'resource-subject-mismatch'
  | 'resource-sensitivity-understated'
  | 'egress-policy-required'
  | 'egress-policy-not-found'
  | 'egress-policy-inactive'
  | 'egress-policy-cross-domain'
  | 'egress-destination-denied'
  | 'egress-purpose-denied'
  | 'egress-sensitivity-denied'
  | 'human-approval-required'
  | 'human-approval-not-found'
  | 'human-approval-inactive'
  | 'human-approval-cross-domain'
  | 'human-approval-binding-mismatch'
  | 'human-approval-payload-mismatch';

export interface AdmissionDecision {
  readonly requestId: string;
  readonly domain: AlosDomain;
  readonly evaluatedAt: string;
  /** True when no block fired. It still does not permit execution. */
  readonly admissible: boolean;
  /** Always false in the public runtime. There is no code path that sets it true. */
  readonly executionPermitted: false;
  /** Always false. A simulation is a report, not an authority. */
  readonly authoritative: false;
  /** Sorted and de-duplicated, so identical inputs give byte-identical output. */
  readonly blocks: readonly AdmissionBlockCode[];
}
