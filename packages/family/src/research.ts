export interface PrivateFamilyProjectionPlan {
  operation: 'project-private-family-research';
  opaqueRegistryRef: string;
  target: 'private-external-family-adapter';
  audience: 'private';
  contentIncluded: false;
  executionPermitted: false;
  authorityStatus: 'unverified-public-plan';
  requiredControls: readonly [
    'private-adapter-issued-reference',
    'private-encrypted-deployment',
    'authority-owned-review-receipt',
    'evidence-resolution',
    'rights-review',
    'consent-and-revocation',
    'audience-authorization',
    'backup-and-restore',
    'succession-controls',
  ];
}

const OPAQUE_FAMILY_REGISTRY_REF = /^family_[a-f0-9]{32}$/;
const FAMILY_REQUIRED_CONTROLS = Object.freeze([
  'private-adapter-issued-reference',
  'private-encrypted-deployment',
  'authority-owned-review-receipt',
  'evidence-resolution',
  'rights-review',
  'consent-and-revocation',
  'audience-authorization',
  'backup-and-restore',
  'succession-controls',
] as const);

/**
 * Descriptor-only public boundary for private family research.
 *
 * The public package cannot validate evidence, accept a relationship, identify
 * a human reviewer, resolve a person, or render a tree. Those actions require a
 * separately deployed authority-bearing adapter and receipts bound to the
 * exact private registry revision.
 */
export class FamilyResearchBoundary {
  planPrivateProjection(opaqueRegistryRef: string): PrivateFamilyProjectionPlan {
    if (typeof opaqueRegistryRef !== 'string' || !OPAQUE_FAMILY_REGISTRY_REF.test(opaqueRegistryRef)) {
      throw new Error('Family registry reference must use the reserved opaque reference syntax.');
    }

    return Object.freeze({
      operation: 'project-private-family-research',
      opaqueRegistryRef,
      target: 'private-external-family-adapter',
      audience: 'private',
      contentIncluded: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
      requiredControls: FAMILY_REQUIRED_CONTROLS,
    });
  }

  getProjectedRelationshipsCount(): 0 {
    return 0;
  }
}
