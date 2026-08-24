export interface FamilyNode {
  id: string;
  name: string;
  relationship: 'parent' | 'child' | 'sibling' | 'spouse' | 'ancestor';
  birthYear: number;
  deathYear?: number;
  biography?: string;
}

export interface LifeStoryNode {
  nodeId: string;
  title: string;
  year: number;
  description: string;
  associatedFamilyIds: string[];
}

export function compileLineageChain(nodes: FamilyNode[]): string[] {
  return [...nodes]
    .sort((a, b) => a.birthYear - b.birthYear)
    .map((n) => `${n.name} (b. ${n.birthYear}) - ${n.relationship}`);
}
