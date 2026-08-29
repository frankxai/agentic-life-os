import { describe, expect, it } from 'vitest';
import { validateCoachingKnowledgeGraph } from '../src/index.js';
import { makeKnowledgeGraph } from './fixtures.js';

describe('validateCoachingKnowledgeGraph', () => {
  it('accepts a synthetic evidence-backed program graph', () => {
    const result = validateCoachingKnowledgeGraph(makeKnowledgeGraph());

    expect(result).toEqual({ valid: true, issues: [] });
  });

  it('rejects member-private fields even when injected at runtime', () => {
    const graph = makeKnowledgeGraph();
    Object.assign(graph.nodes[0]!, { memberRef: 'member_private_001' });

    const result = validateCoachingKnowledgeGraph(graph);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'private-member-field-denied', path: 'nodes.0.memberRef' }),
    );
  });

  it('rejects nodes and relations without approved evidence', () => {
    const graph = makeKnowledgeGraph();
    const invalid = {
      ...graph,
      sources: graph.sources.map((source) => ({ ...source, status: 'review-required' as const })),
    };

    const result = validateCoachingKnowledgeGraph(invalid);

    expect(result.valid).toBe(false);
    expect(result.issues.filter((issue) => issue.code === 'missing-approved-source')).toHaveLength(3);
  });

  it('rejects relations whose endpoints are absent', () => {
    const graph = makeKnowledgeGraph();
    const invalid = {
      ...graph,
      relations: graph.relations.map((relation) => ({ ...relation, toNodeId: 'missing_node' })),
    };

    const result = validateCoachingKnowledgeGraph(invalid);

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'missing-relation-endpoint' }));
  });

  it('rejects empty provenance and self-referential relations', () => {
    const graph = makeKnowledgeGraph();
    graph.sources[0]!.licenseOrRights = '';
    graph.relations[0]!.toNodeId = graph.relations[0]!.fromNodeId;

    const result = validateCoachingKnowledgeGraph(graph);

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'invalid-source' }),
        expect.objectContaining({ code: 'invalid-relation' }),
      ]),
    );
  });
});
