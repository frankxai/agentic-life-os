import { describe, expect, it } from 'vitest';
import { FamilyResearchBoundary } from '../src/research.js';

describe('public family research boundary', () => {
  it('returns only a non-executable descriptor for a private registry reference', () => {
    const boundary = new FamilyResearchBoundary();
    const plan = boundary.planPrivateProjection('family_0123456789abcdef0123456789abcdef');

    expect(plan).toMatchObject({
      operation: 'project-private-family-research',
      target: 'private-external-family-adapter',
      audience: 'private',
      contentIncluded: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
    });
    expect(plan.requiredControls).toContain('authority-owned-review-receipt');
    expect(boundary.getProjectedRelationshipsCount()).toBe(0);
  });

  it('does not expose relationship, evidence, reviewer, or publication APIs', () => {
    const boundary = new FamilyResearchBoundary();
    expect('validateResearchRegistry' in boundary).toBe(false);
    expect('buildAncestorProjection' in boundary).toBe(false);
    expect('acceptRelationship' in boundary).toBe(false);
    expect('publish' in boundary).toBe(false);
  });

  it('rejects names, genetic claims, citations, paths, and self-authored review assertions', () => {
    const boundary = new FamilyResearchBoundary();
    const unsafeValues = [
      'Parent Alpha',
      'BRCA1 pathogenic family result',
      'human_self_asserted',
      'https://archive.example/record',
      '../family-tree',
      'C:\\private\\family',
      'family_0123',
    ];

    for (const unsafeValue of unsafeValues) {
      expect(() => boundary.planPrivateProjection(unsafeValue)).toThrow(/reserved opaque reference syntax/i);
    }
    const coercionObject = {
      secret: 'BRCA1 private family record',
      toString: () => 'family_0123456789abcdef0123456789abcdef',
    };
    expect(() => boundary.planPrivateProjection(coercionObject as unknown as string)).toThrow(/reserved opaque reference syntax/i);
  });
});
