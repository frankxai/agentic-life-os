export const claimStatuses = ['proposed', 'under_review', 'accepted', 'disputed', 'rejected'] as const;
export type ClaimStatus = (typeof claimStatuses)[number];

export const evidenceSourceClasses = [
  'official_register',
  'official_archive',
  'family_document',
  'oral_history',
  'scholarly_secondary',
  'user_contributed',
] as const;
export type EvidenceSourceClass = (typeof evidenceSourceClasses)[number];

export type PublicationClass = 'private' | 'family' | 'public';
export type LifeStatus = 'living' | 'deceased' | 'unknown';
export type ParentRelationship = 'biological_parent' | 'adoptive_parent';

export interface ResearchPerson {
  personId: string;
  displayLabel: string;
  lifeStatus: LifeStatus;
  publicationClass: PublicationClass;
}

export interface EvidenceRecord {
  evidenceId: string;
  sourceClass: EvidenceSourceClass;
  citation: string;
  sourceReference: string;
  accessedOn: string;
  rightsStatus: 'restricted' | 'metadata_only' | 'family_use' | 'cleared';
  contentDigest: string;
}

export interface RelationshipClaim {
  claimId: string;
  childPersonId: string;
  parentPersonId: string;
  relationship: ParentRelationship;
  status: ClaimStatus;
  confidence: number;
  evidenceRefs: string[];
  reviewedByHumanRef?: string;
}

export interface FamilyResearchRegistry {
  schemaVersion: 'family-research-registry.v1';
  tenantRef: string;
  people: ResearchPerson[];
  evidence: EvidenceRecord[];
  relationshipClaims: RelationshipClaim[];
}

export interface AncestorProjection {
  audience: 'private' | 'family' | 'public';
  nodes: Array<Pick<ResearchPerson, 'personId' | 'displayLabel' | 'lifeStatus' | 'publicationClass'>>;
  edges: Array<{
    claimId: string;
    parentPersonId: string;
    childPersonId: string;
    relationship: ParentRelationship;
    confidence: number;
    evidenceRefs: string[];
  }>;
}

const identifierPattern = /^[a-z][a-z0-9_]{2,127}$/;
const digestPattern = /^[a-f0-9]{64}$/i;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} identifier.`);
}

function isValidIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function assertNoAcceptedAncestryCycle(claims: RelationshipClaim[]): void {
  const parentsByChild = new Map<string, string[]>();
  for (const claim of claims.filter((candidate) => candidate.status === 'accepted')) {
    parentsByChild.set(claim.childPersonId, [...(parentsByChild.get(claim.childPersonId) ?? []), claim.parentPersonId]);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(personId: string): void {
    if (visiting.has(personId)) throw new Error('Accepted ancestry contains a cycle.');
    if (visited.has(personId)) return;
    visiting.add(personId);
    for (const parentId of parentsByChild.get(personId) ?? []) visit(parentId);
    visiting.delete(personId);
    visited.add(personId);
  }

  for (const personId of parentsByChild.keys()) visit(personId);
}

export function validateResearchRegistry(input: FamilyResearchRegistry): FamilyResearchRegistry {
  if (input.schemaVersion !== 'family-research-registry.v1') throw new Error('Unsupported family research schema.');
  if (!identifierPattern.test(input.tenantRef)) throw new Error('Invalid tenant reference.');

  assertUnique(input.people.map((person) => person.personId), 'person');
  assertUnique(input.evidence.map((evidence) => evidence.evidenceId), 'evidence');
  assertUnique(input.relationshipClaims.map((claim) => claim.claimId), 'relationship claim');

  const personIds = new Set(input.people.map((person) => person.personId));
  const evidenceIds = new Set(input.evidence.map((evidence) => evidence.evidenceId));

  for (const person of input.people) {
    if (!identifierPattern.test(person.personId) || person.displayLabel.trim().length === 0 || person.displayLabel.length > 160) {
      throw new Error('Invalid research person record.');
    }
  }

  for (const evidence of input.evidence) {
    if (
      !identifierPattern.test(evidence.evidenceId) ||
      evidence.citation.trim().length < 3 ||
      evidence.citation.length > 1000 ||
      evidence.sourceReference.trim().length < 3 ||
      evidence.sourceReference.length > 500 ||
      !isValidIsoDate(evidence.accessedOn) ||
      !digestPattern.test(evidence.contentDigest)
    ) {
      throw new Error('Invalid evidence record.');
    }
  }

  const acceptedBiologicalParents = new Map<string, number>();
  for (const claim of input.relationshipClaims) {
    if (
      !identifierPattern.test(claim.claimId) ||
      !personIds.has(claim.childPersonId) ||
      !personIds.has(claim.parentPersonId) ||
      claim.childPersonId === claim.parentPersonId ||
      !Number.isFinite(claim.confidence) ||
      claim.confidence < 0 ||
      claim.confidence > 1
    ) {
      throw new Error('Invalid relationship claim.');
    }
    if (claim.evidenceRefs.some((reference) => !evidenceIds.has(reference))) {
      throw new Error(`Relationship claim has an unresolved evidence reference: ${claim.claimId}.`);
    }
    if (
      claim.status === 'accepted' &&
      (claim.evidenceRefs.length === 0 || !claim.reviewedByHumanRef || !/^human_[a-z0-9_]+$/i.test(claim.reviewedByHumanRef))
    ) {
      throw new Error(`Accepted relationship requires evidence and human review: ${claim.claimId}.`);
    }
    if (claim.status === 'accepted' && claim.relationship === 'biological_parent') {
      const count = (acceptedBiologicalParents.get(claim.childPersonId) ?? 0) + 1;
      acceptedBiologicalParents.set(claim.childPersonId, count);
      if (count > 2) throw new Error(`More than two accepted biological parents require dispute review: ${claim.childPersonId}.`);
    }
  }

  assertNoAcceptedAncestryCycle(input.relationshipClaims);
  return input;
}

function visibleToAudience(person: ResearchPerson, audience: AncestorProjection['audience']): boolean {
  if (audience === 'private') return true;
  if (audience === 'family') return person.publicationClass !== 'private';
  return person.publicationClass === 'public' && person.lifeStatus === 'deceased';
}

export function buildAncestorProjection(
  input: FamilyResearchRegistry,
  options: { audience: AncestorProjection['audience'] },
): AncestorProjection {
  validateResearchRegistry(input);
  const peopleById = new Map(input.people.map((person) => [person.personId, person]));
  const acceptedClaims = input.relationshipClaims.filter((claim) => claim.status === 'accepted');

  const edges = acceptedClaims
    .filter((claim) => {
      const child = peopleById.get(claim.childPersonId)!;
      const parent = peopleById.get(claim.parentPersonId)!;
      return visibleToAudience(child, options.audience) && visibleToAudience(parent, options.audience);
    })
    .map((claim) => ({
      claimId: claim.claimId,
      parentPersonId: claim.parentPersonId,
      childPersonId: claim.childPersonId,
      relationship: claim.relationship,
      confidence: claim.confidence,
      evidenceRefs: [...claim.evidenceRefs].sort(),
    }))
    .sort((left, right) => left.claimId.localeCompare(right.claimId));

  const visiblePersonIds = new Set(edges.flatMap((edge) => [edge.parentPersonId, edge.childPersonId]));
  if (options.audience === 'public') {
    for (const person of input.people) {
      if (visibleToAudience(person, options.audience) && acceptedClaims.some(
        (claim) => claim.childPersonId === person.personId || claim.parentPersonId === person.personId,
      )) visiblePersonIds.add(person.personId);
    }
  }

  const nodes = input.people
    .filter((person) => visiblePersonIds.has(person.personId) && visibleToAudience(person, options.audience))
    .map((person) => ({
      personId: person.personId,
      displayLabel: person.displayLabel,
      lifeStatus: person.lifeStatus,
      publicationClass: person.publicationClass,
    }))
    .sort((left, right) => left.personId.localeCompare(right.personId));

  return { audience: options.audience, nodes, edges };
}
