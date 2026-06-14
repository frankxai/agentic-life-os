export interface MemoryNode {
  id: string;
  label: string;
  category: 'entity' | 'agent' | 'concept' | 'metric' | 'workspace';
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface MemoryEdge {
  sourceId: string;
  targetId: string;
  relationType: 'interconnects' | 'belongs_to' | 'created_by' | 'depends_on' | 'references';
  weight: number; // 0.0 to 1.0 strength
}

export interface ObsidianNote {
  filePath: string;
  title: string;
  tags: string[];
  body: string;
  frontmatter: Record<string, unknown>;
}

export class MemoryOSManager {
  private nodes: Map<string, MemoryNode> = new Map();
  private edges: MemoryEdge[] = [];

  /**
   * Indexes a node in the Starlight Memory Palace (SIP schema)
   */
  indexNode(node: MemoryNode): void {
    this.nodes.set(node.id, {
      ...node,
      createdAt: node.createdAt || new Date().toISOString(),
    });
  }

  /**
   * Connects two nodes with a semantic relationship edge
   */
  connectNodes(edge: MemoryEdge): void {
    if (!this.nodes.has(edge.sourceId) || !this.nodes.has(edge.targetId)) {
      throw new Error(`Cannot connect nodes: source (${edge.sourceId}) or target (${edge.targetId}) does not exist.`);
    }
    this.edges.push(edge);
  }

  /**
   * Simulated vector/semantic search matching node labels, categories, or tags
   */
  semanticSearch(query: string, limit = 5): MemoryNode[] {
    const queryLower = query.toLowerCase();
    const matches: { node: MemoryNode; score: number }[] = [];

    for (const node of this.nodes.values()) {
      let score = 0;
      if (node.label.toLowerCase().includes(queryLower)) score += 5;
      if (node.category.toLowerCase().includes(queryLower)) score += 2;
      if (node.content.toLowerCase().includes(queryLower)) score += 1;

      if (score > 0) {
        matches.push({ node, score });
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((m) => m.node);
  }

  /**
   * Distill transcripts or chat history into a structured Obsidian note
   */
  distillChatHistory(sessionName: string, transcriptSnippets: string[]): ObsidianNote {
    const summary = transcriptSnippets.join('\n\n');
    const tags = ['life-os', 'agent-distillation', sessionName.toLowerCase().replace(/\s+/g, '-')];
    
    return {
      filePath: `vaults/second-brain/Archive/Distillations/${sessionName.replace(/\s+/g, '_')}.md`,
      title: sessionName,
      tags,
      frontmatter: {
        type: 'agent-distillation',
        date: new Date().toISOString().split('T')[0],
        sipCompliant: true,
      },
      body: `# ${sessionName}\n\n## Summary\n${summary}\n\n---\n*Generated via @frankx-ai/second-brain-os*`,
    };
  }

  getNodesCount(): number {
    return this.nodes.size;
  }

  getEdges(): MemoryEdge[] {
    return [...this.edges];
  }
}
