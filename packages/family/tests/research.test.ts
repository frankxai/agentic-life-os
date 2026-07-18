import { describe, expect, it } from 'vitest';
import {
  buildAncestorProjection,
  validateResearchRegistry,
  type FamilyResearchRegistry,
} from '../src/research.js';

function registry(): FamilyResearchRegistry {
  return {
    schemaVersion: 'family-research-registry.v1',
    tenantRef: 'tenant_private_primary',
    people: [
      { personId: 'person_a', displayLabel: 'Research Subject', lifeStatus: 'living', publicationClass: 'private' },
      { personId: 'person_b', displayLabel: 'Parent Alpha', lifeStatus: 'deceased', publicationClass: 'family' },
      { personId: 'person_c', displayLabel: 'Ancestor Beta', lifeStatus: 'deceased', publicationClass: 'public' },
      { personId: 'person_d', displayLabel: 'Unreviewed Candidate', lifeStatus: 'unknown', publicationClass: 'private' },
    ],
    evidence: [
      {
        evidenceId: 'evidence_register_1',
        sourceClass: 'official_register',
        citation: 'Synthetic civil-register citation',
        sourceReference: 'archive_synthetic_001',
        accessedOn: '2026-07-18',
        rightsStatus: 'restricted',
        contentDigest: 'a'.repeat(64),
      },
      {
        evidenceId: 'evidence_archive_2',
        sourceClass: 'official_archive',
        citation: 'Synthetic archival citation',
        sourceReference: 'archive_synthetic_002',
        accessedOn: '2026-07-18',
        rightsStatus: 'metadata_only',
        contentDigest: 'b'.repeat(64),
      },
    ],
    relationshipClaims: [
      {
        claimId: 'claim_parent_1',
        childPersonId: 'person_a',
        parentPersonId: 'person_b',
        relationship: 'biological_parent',
        status: 'accepted',
        confidence: 0.98,
        evidenceRefs: ['evidence_register_1'],
        reviewedByHumanRef: 'human_family_steward',
      },
      {
        claimId: 'claim_parent_2',
        childPersonId: 'person_b',
        parentPersonId: 'person_c',
        relationship: 'biological_parent',
        status: 'accepted',
        confidence: 0.85,
        evidenceRefs: ['evidence_archive_2'],
        reviewedByHumanRef: 'human_family_steward',
      },
      {
        claimId: 'claim_unreviewed',
        childPersonId: 'person_c',
        parentPersonId: 'person_d',
        relationship: 'biological_parent',
        status: 'proposed',
        confidence: 0.4,
        evidenceRefs: [],
      },
    ],
  };
}

describe('private family research registry', () => {
  it('projects only accepted, evidence-backed ancestry without mutating the registry', () => {
    const input = registry();
    const before = JSON.stringify(input);
    const projection = buildAncestorProjection(input, { audience: 'private' });

    expect(projection.edges.map((edge) => edge.claimId)).toEqual(['claim_parent_1', 'claim_parent_2']);
    expect(projection.nodes.map((node) => node.personId)).toEqual(['person_a', 'person_b', 'person_c']);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('fails closed when an accepted relationship lacks evidence or human review', () => {
    const input = registry();
    input.relationshipClaims[0] = {
      ...input.relationshipClaims[0],
      evidenceRefs: [],
      reviewedByHumanRef: undefined,
    };

    expect(() => validateResearchRegistry(input)).toThrow(/accepted relationship/i);
  });

  it('keeps living, unknown, and non-public people out of public projections', () => {
    const projection = buildAncestorProjection(registry(), { audience: 'public' });

    expect(projection.nodes.map((node) => node.personId)).toEqual(['person_c']);
    expect(projection.edges).toEqual([]);
  });

  it('rejects ancestry cycles instead of rendering a false tree', () => {
    const input = registry();
    input.relationshipClaims.push({
      claimId: 'claim_cycle',
      childPersonId: 'person_c',
      parentPersonId: 'person_a',
      relationship: 'biological_parent',
      status: 'accepted',
      confidence: 0.7,
      evidenceRefs: ['evidence_archive_2'],
      reviewedByHumanRef: 'human_family_steward',
    });

    expect(() => buildAncestorProjection(input, { audience: 'private' })).toThrow(/cycle/i);
  });

  it('rejects evidence references that do not resolve', () => {
    const input = registry();
    input.relationshipClaims[1] = {
      ...input.relationshipClaims[1],
      evidenceRefs: ['evidence_missing'],
    };

    expect(() => validateResearchRegistry(input)).toThrow(/evidence reference/i);
  });
});
