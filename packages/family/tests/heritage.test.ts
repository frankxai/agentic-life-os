import { describe, it, expect } from 'vitest';
import { compileLineageChain, type FamilyNode } from '../src/heritage.js';

describe('Family OS Heritage compiler', () => {
  it('should compile family genealogy lineage chains sequentially by birth year', () => {
    const nodes: FamilyNode[] = [
      { id: 'person_subject', name: 'Research Subject', relationship: 'child', birthYear: 1985 },
      { id: 'person_ancestor', name: 'Ancestor Alpha', relationship: 'ancestor', birthYear: 1920 },
      { id: 'person_parent', name: 'Parent Beta', relationship: 'parent', birthYear: 1955 },
    ];

    const chain = compileLineageChain(nodes);
    expect(chain).toHaveLength(3);
    expect(chain[0]).toContain('Ancestor Alpha');
    expect(chain[1]).toContain('Parent Beta');
    expect(chain[2]).toContain('Research Subject');
  });
});
