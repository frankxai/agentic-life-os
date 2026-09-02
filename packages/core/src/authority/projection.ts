/**
 * Public projection — what a clean-room build of this runtime is allowed to emit.
 *
 * The projection is an allowlist, not a redaction pass. A field reaches the public
 * side because it was named here, never because a scrubber failed to recognise it.
 * That inversion is the whole design: redaction fails open on the field nobody
 * thought of, an allowlist fails closed on it.
 *
 * Counts and enums only. No identifier, no digest, no descriptor id, no body.
 */

import {
  type AdmissionBlockCode,
  type AdmissionDecision,
  type AlosDomain,
  ALOS_DOMAINS,
  type Sensitivity,
} from './contracts.js';

export interface PublicDecisionProjection {
  readonly schema: 'PublicProjection.v1';
  readonly domain: AlosDomain;
  readonly admissible: boolean;
  readonly executionPermitted: false;
  readonly authoritative: false;
  readonly blockCount: number;
  /** Block codes are a closed enum defined in this repository, not caller data. */
  readonly blocks: readonly AdmissionBlockCode[];
}

export interface PublicDomainProjection {
  readonly schema: 'PublicProjection.v1';
  readonly domain: AlosDomain;
  readonly packVersion: string;
  readonly resourceCount: number;
  readonly sensitivityCeiling: Sensitivity;
  readonly declaredActionCount: number;
  readonly declaredPurposeCount: number;
  readonly declaredDestinationCount: number;
}

export function projectDecision(decision: AdmissionDecision): PublicDecisionProjection {
  return Object.freeze({
    schema: 'PublicProjection.v1' as const,
    domain: decision.domain,
    admissible: decision.admissible,
    executionPermitted: false as const,
    authoritative: false as const,
    blockCount: decision.blocks.length,
    blocks: Object.freeze([...decision.blocks].sort()) as readonly AdmissionBlockCode[],
  });
}

export function projectDomain(fixture: {
  readonly pack: { readonly domain: AlosDomain; readonly version: string; readonly actions: readonly string[]; readonly purposes: readonly string[]; readonly destinations: readonly string[]; readonly sensitivityCeiling: Sensitivity };
  readonly resources: readonly unknown[];
}): PublicDomainProjection {
  return Object.freeze({
    schema: 'PublicProjection.v1' as const,
    domain: fixture.pack.domain,
    packVersion: fixture.pack.version,
    resourceCount: fixture.resources.length,
    sensitivityCeiling: fixture.pack.sensitivityCeiling,
    declaredActionCount: fixture.pack.actions.length,
    declaredPurposeCount: fixture.pack.purposes.length,
    declaredDestinationCount: fixture.pack.destinations.length,
  });
}

/**
 * Independent check that a projection carries nothing it should not. Used by the
 * leak eval and usable as a gate in a release script: serialise the projection and
 * assert that no forbidden substring survives.
 *
 * @returns the forbidden substrings that were found, sorted. Empty means clean.
 */
export function findLeakedSubstrings(projection: unknown, forbidden: readonly string[]): string[] {
  const serialised = JSON.stringify(projection ?? null);
  const found = new Set<string>();
  for (const needle of forbidden) {
    if (needle.length > 0 && serialised.includes(needle)) found.add(needle);
  }
  return [...found].sort();
}

/**
 * Structural guard for a whole-estate projection: every one of the five domains
 * must appear exactly once, so a domain cannot be silently dropped from a public
 * build and cannot be smuggled in twice under different pack versions.
 */
export function assertCompleteDomainCoverage(projections: readonly PublicDomainProjection[]): void {
  const seen = projections.map((p) => p.domain).sort();
  const expected = [...ALOS_DOMAINS].sort();
  if (seen.length !== expected.length || seen.some((d, i) => d !== expected[i])) {
    throw new Error(`public projection must cover exactly [${expected.join(', ')}], got [${seen.join(', ')}]`);
  }
}
