/**
 * Deterministic cross-domain policy simulation.
 *
 * Determinism is a hard property here, not a nicety: the same request against the
 * same store and the same instant must produce a byte-identical decision, or the
 * isolation evals below cannot be trusted as evidence. So the clock is injected,
 * every block is collected rather than short-circuited, block codes are sorted and
 * de-duplicated, and the result is frozen.
 *
 * The rule this exists to prove: an agent working in one part of a life cannot
 * reach a record in another, even holding a valid grant. A finance agent asking
 * for a health record is denied on the domain edge, before consent, before scope,
 * before anything a caller could have forged in the request.
 */

import {
  AUTHORITY_STORE_VERSION,
  type AdmissionBlockCode,
  type AdmissionDecision,
  type AdmissionRequest,
  type AuthorityStore,
  type AlosDomain,
  ALOS_DOMAINS,
  SENSITIVITY_LADDER,
  type RuntimeClock,
  type Sensitivity,
  sensitivityRank,
} from './contracts.js';

interface Validity {
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly revokedAt?: string;
  readonly version: string;
}

function isActive(record: Validity, now: Date): boolean {
  if (record.version !== AUTHORITY_STORE_VERSION) return false;
  const issued = Date.parse(record.issuedAt);
  const expires = Date.parse(record.expiresAt);
  if (!Number.isFinite(issued) || !Number.isFinite(expires)) return false;
  if (record.revokedAt !== undefined) return false;
  const at = now.getTime();
  return issued <= at && at < expires;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function isDomain(value: unknown): value is AlosDomain {
  return ALOS_DOMAINS.includes(value as AlosDomain);
}

function isSensitivity(value: unknown): value is Sensitivity {
  return SENSITIVITY_LADDER.includes(value as Sensitivity);
}

function isWellFormed(request: AdmissionRequest): boolean {
  return (
    isNonEmptyString(request?.requestId) &&
    isDomain(request?.domain) &&
    isNonEmptyString(request?.tenantId) &&
    isNonEmptyString(request?.subjectId) &&
    isNonEmptyString(request?.actorId) &&
    isNonEmptyString(request?.capabilityId) &&
    isNonEmptyString(request?.action) &&
    isNonEmptyString(request?.purpose) &&
    isSensitivity(request?.sensitivity) &&
    isNonEmptyString(request?.resourceId) &&
    (request.destination === undefined || isNonEmptyString(request.destination)) &&
    (request.humanApprovalId === undefined || isNonEmptyString(request.humanApprovalId)) &&
    (request.payloadDigest === undefined || isNonEmptyString(request.payloadDigest))
  );
}

function decide(
  request: AdmissionRequest,
  evaluatedAt: string,
  blocks: Set<AdmissionBlockCode>,
  domain: AlosDomain,
): AdmissionDecision {
  return Object.freeze({
    requestId: isNonEmptyString(request?.requestId) ? request.requestId : 'invalid-request',
    domain,
    evaluatedAt,
    admissible: blocks.size === 0,
    executionPermitted: false as const,
    authoritative: false as const,
    blocks: Object.freeze([...blocks].sort()) as readonly AdmissionBlockCode[],
  });
}

/**
 * @param request  Caller-authored. Treated as an assertion of intent, never as authority.
 * @param store    Caller-supplied snapshot. See AuthorityStore.
 * @param clock    Required. There is no wall-clock default, so a decision is reproducible.
 */
export function simulateAdmission(
  request: AdmissionRequest,
  store: AuthorityStore,
  clock: RuntimeClock,
): AdmissionDecision {
  const now = clock.now();
  const evaluatedAt = now.toISOString();
  const blocks = new Set<AdmissionBlockCode>();

  if (!isWellFormed(request)) {
    blocks.add('invalid-request');
    return decide(request, evaluatedAt, blocks, isDomain(request?.domain) ? request.domain : 'routines');
  }
  const domain = request.domain;

  // --- Domain pack admission -------------------------------------------------
  const pack = store.resolveDomainPack(domain);
  if (!pack || pack.domain !== domain) {
    blocks.add('domain-not-registered');
  } else {
    if (!pack.actions.includes(request.action)) blocks.add('domain-action-not-declared');
    if (!pack.purposes.includes(request.purpose)) blocks.add('domain-purpose-not-declared');
    if (request.destination !== undefined && !pack.destinations.includes(request.destination)) {
      blocks.add('domain-destination-not-declared');
    }
    if (sensitivityRank(request.sensitivity) > sensitivityRank(pack.sensitivityCeiling)) {
      blocks.add('domain-sensitivity-ceiling-exceeded');
    }
  }

  // --- Capability ------------------------------------------------------------
  const capability = store.resolveCapability(request.capabilityId);
  if (!capability) {
    blocks.add('capability-not-found');
  } else {
    if (capability.domain !== domain) blocks.add('capability-cross-domain');
    if (!isActive(capability, now)) blocks.add('capability-inactive');
    if (
      capability.tenantId !== request.tenantId ||
      capability.subjectId !== request.subjectId ||
      capability.actorId !== request.actorId
    ) {
      blocks.add('capability-binding-mismatch');
    }
    if (
      !capability.actions.includes(request.action) ||
      !capability.purposes.includes(request.purpose) ||
      !capability.sensitivities.includes(request.sensitivity)
    ) {
      blocks.add('capability-scope-denied');
    }

    // --- Consent -------------------------------------------------------------
    const consent = store.resolveConsent(capability.consentId);
    if (!consent) {
      blocks.add('consent-not-found');
    } else {
      if (consent.domain !== domain) blocks.add('consent-cross-domain');
      if (!isActive(consent, now)) blocks.add('consent-inactive');
      if (
        consent.tenantId !== request.tenantId ||
        consent.subjectId !== request.subjectId ||
        consent.actorId !== request.actorId
      ) {
        blocks.add('consent-binding-mismatch');
      }
      if (
        !consent.actions.includes(request.action) ||
        !consent.purposes.includes(request.purpose) ||
        !consent.sensitivities.includes(request.sensitivity)
      ) {
        blocks.add('consent-scope-denied');
      }
    }
  }

  // --- Resource: the isolation edge -----------------------------------------
  const resource = store.resolveResource(request.resourceId);
  if (!resource) {
    blocks.add('resource-not-found');
  } else {
    if (resource.domain !== domain) blocks.add('resource-cross-domain');
    if (resource.tenantId !== request.tenantId) blocks.add('resource-cross-tenant');
    if (resource.subjectId !== request.subjectId) blocks.add('resource-subject-mismatch');
    // A request may not under-declare how sensitive the thing it is touching is.
    if (sensitivityRank(resource.sensitivity) > sensitivityRank(request.sensitivity)) {
      blocks.add('resource-sensitivity-understated');
    }
  }

  // --- Egress ----------------------------------------------------------------
  if (request.destination !== undefined) {
    const policyId = capability?.egressPolicyId;
    if (!policyId) {
      blocks.add('egress-policy-required');
    } else {
      const policy = store.resolveEgressPolicy(policyId);
      if (!policy) {
        blocks.add('egress-policy-not-found');
      } else {
        if (policy.domain !== domain) blocks.add('egress-policy-cross-domain');
        if (!isActive(policy, now)) blocks.add('egress-policy-inactive');
        if (!policy.allowedDestinations.includes(request.destination)) blocks.add('egress-destination-denied');
        if (!policy.allowedPurposes.includes(request.purpose)) blocks.add('egress-purpose-denied');
        if (!policy.allowedSensitivities.includes(request.sensitivity)) blocks.add('egress-sensitivity-denied');
      }
    }

    if (!request.humanApprovalId || !request.payloadDigest) {
      blocks.add('human-approval-required');
    } else {
      const approval = store.resolveHumanApproval(request.humanApprovalId);
      if (!approval) {
        blocks.add('human-approval-not-found');
      } else {
        if (approval.domain !== domain) blocks.add('human-approval-cross-domain');
        if (!isActive(approval, now)) blocks.add('human-approval-inactive');
        if (
          approval.tenantId !== request.tenantId ||
          approval.subjectId !== request.subjectId ||
          approval.actorId !== request.actorId ||
          approval.destination !== request.destination ||
          approval.operationDigest !== operationDigest(request)
        ) {
          blocks.add('human-approval-binding-mismatch');
        }
        if (approval.payloadDigest !== request.payloadDigest) {
          blocks.add('human-approval-payload-mismatch');
        }
      }
    }
  }

  return decide(request, evaluatedAt, blocks, domain);
}

/**
 * Canonical operation identity. Field order is fixed and no free text enters, so
 * an approval binds to one operation shape and cannot be re-used for another.
 */
export function operationDigest(request: AdmissionRequest): string {
  return [
    AUTHORITY_STORE_VERSION,
    request.domain,
    request.tenantId,
    request.subjectId,
    request.actorId,
    request.action,
    request.purpose,
    request.sensitivity,
    request.resourceId,
    request.destination ?? '',
  ].join('|');
}
