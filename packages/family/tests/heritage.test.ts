import { describe, it, expect } from 'vitest';
import { compileLineageChain, type FamilyNode } from '../src/heritage.js';

describe('Family OS Heritage compiler', () => {
  it('should compile family genealogy lineage chains sequentially by birth year', () => {
    const nodes: FamilyNode[] = [
      { id: '1', name: 'Example Child', relationship: 'child', birthYear: 1985 },
      { id: '2', name: 'Example Ancestor', relationship: 'ancestor', birthYear: 1920 },
      { id: '3', name: 'Example Parent', relationship: 'parent', birthYear: 1955 },
    ];

    const chain = compileLineageChain(nodes);
    expect(chain).toHaveLength(3);
    expect(chain[0]).toContain('Example Ancestor');
    expect(chain[1]).toContain('Example Parent');
    expect(chain[2]).toContain('Example Child');
  });
});
