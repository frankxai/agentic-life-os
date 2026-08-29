import {
  COACHING_DOMAINS,
  KNOWLEDGE_RELATION_TYPES,
  type CoachingKnowledgeGraph,
} from './contracts.js';

export type KnowledgeGraphIssueCode =
  | 'invalid-graph-id'
  | 'invalid-source'
  | 'invalid-node'
  | 'invalid-relation'
  | 'duplicate-source-id'
  | 'duplicate-node-id'
  | 'duplicate-relation-id'
  | 'invalid-domain'
  | 'invalid-relation-type'
  | 'missing-approved-source'
  | 'missing-relation-endpoint'
  | 'private-member-field-denied'
  | 'invalid-review-date';

export interface KnowledgeGraphIssue {
  code: KnowledgeGraphIssueCode;
  path: string;
  message: string;
}

export interface KnowledgeGraphValidation {
  valid: boolean;
  issues: readonly KnowledgeGraphIssue[];
}

const PRIVATE_MEMBER_FIELDS = new Set([
  'memberId',
  'memberRef',
  'subjectId',
  'rawText',
  'journal',
  'diagnosis',
  'biometric',
  'recordPath',
  'coachNote',
  'sessionTranscript',
]);

function hasDuplicate(values: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const duplicate = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return duplicate;
}

function isIsoTimestamp(value: string): boolean {
  return value.length >= 10 && Number.isFinite(Date.parse(value));
}

export function validateCoachingKnowledgeGraph(graph: CoachingKnowledgeGraph): KnowledgeGraphValidation {
  const issues: KnowledgeGraphIssue[] = [];

  if (!graph.graphId.trim() || !graph.version.trim() || !graph.programId.trim()) {
    issues.push({
      code: 'invalid-graph-id',
      path: 'graph',
      message: 'Graph, version, and program identifiers are required.',
    });
  }

  const duplicateSourceIds = hasDuplicate(graph.sources.map((source) => source.sourceId));
  for (const sourceId of duplicateSourceIds) {
    issues.push({ code: 'duplicate-source-id', path: `sources.${sourceId}`, message: 'Source identifiers must be unique.' });
  }

  const duplicateNodeIds = hasDuplicate(graph.nodes.map((node) => node.nodeId));
  for (const nodeId of duplicateNodeIds) {
    issues.push({ code: 'duplicate-node-id', path: `nodes.${nodeId}`, message: 'Node identifiers must be unique.' });
  }

  const duplicateRelationIds = hasDuplicate(graph.relations.map((relation) => relation.relationId));
  for (const relationId of duplicateRelationIds) {
    issues.push({
      code: 'duplicate-relation-id',
      path: `relations.${relationId}`,
      message: 'Relation identifiers must be unique.',
    });
  }

  const approvedSourceIds = new Set(
    graph.sources.filter((source) => source.status === 'approved').map((source) => source.sourceId),
  );
  const nodeIds = new Set(graph.nodes.map((node) => node.nodeId));

  graph.sources.forEach((source, index) => {
    if (
      !source.sourceId.trim() ||
      !source.title.trim() ||
      !source.publisher.trim() ||
      !source.canonicalUrl.trim() ||
      !source.licenseOrRights.trim()
    ) {
      issues.push({
        code: 'invalid-source',
        path: `sources.${index}`,
        message: 'Evidence sources require identifiers, provenance, rights, and a canonical URL.',
      });
    }
    if (!isIsoTimestamp(source.reviewedAt)) {
      issues.push({
        code: 'invalid-review-date',
        path: `sources.${index}.reviewedAt`,
        message: 'Evidence sources require an ISO-compatible review timestamp.',
      });
    }
  });

  graph.nodes.forEach((node, index) => {
    if (!node.nodeId.trim() || !node.title.trim() || !node.summary.trim()) {
      issues.push({
        code: 'invalid-node',
        path: `nodes.${index}`,
        message: 'Knowledge nodes require an identifier, title, and bounded summary.',
      });
    }
    if (!COACHING_DOMAINS.includes(node.domain)) {
      issues.push({ code: 'invalid-domain', path: `nodes.${index}.domain`, message: 'Node domain is not supported.' });
    }
    if (!isIsoTimestamp(node.reviewedAt)) {
      issues.push({
        code: 'invalid-review-date',
        path: `nodes.${index}.reviewedAt`,
        message: 'Knowledge nodes require an ISO-compatible review timestamp.',
      });
    }
    const privateFields = Object.keys(node as unknown as Record<string, unknown>).filter((key) =>
      PRIVATE_MEMBER_FIELDS.has(key),
    );
    for (const field of privateFields) {
      issues.push({
        code: 'private-member-field-denied',
        path: `nodes.${index}.${field}`,
        message: 'Private member state cannot be stored in the public knowledge graph.',
      });
    }
    if (node.evidenceSourceIds.length === 0 || node.evidenceSourceIds.some((id) => !approvedSourceIds.has(id))) {
      issues.push({
        code: 'missing-approved-source',
        path: `nodes.${index}.evidenceSourceIds`,
        message: 'Every node must reference at least one approved evidence source.',
      });
    }
  });

  graph.relations.forEach((relation, index) => {
    if (!relation.relationId.trim() || !relation.rationale.trim() || relation.fromNodeId === relation.toNodeId) {
      issues.push({
        code: 'invalid-relation',
        path: `relations.${index}`,
        message: 'Relations require an identifier, rationale, and two distinct endpoints.',
      });
    }
    if (!KNOWLEDGE_RELATION_TYPES.includes(relation.type)) {
      issues.push({
        code: 'invalid-relation-type',
        path: `relations.${index}.type`,
        message: 'Relation type is not supported.',
      });
    }
    if (!nodeIds.has(relation.fromNodeId) || !nodeIds.has(relation.toNodeId)) {
      issues.push({
        code: 'missing-relation-endpoint',
        path: `relations.${index}`,
        message: 'Every relation endpoint must reference an existing node.',
      });
    }
    if (
      relation.evidenceSourceIds.length === 0 ||
      relation.evidenceSourceIds.some((id) => !approvedSourceIds.has(id))
    ) {
      issues.push({
        code: 'missing-approved-source',
        path: `relations.${index}.evidenceSourceIds`,
        message: 'Every relation must reference at least one approved evidence source.',
      });
    }
  });

  return { valid: issues.length === 0, issues };
}
