import { describe, it, expect } from 'vitest';
import { MemoryOSManager, type MemoryNode } from '../src/sip-palace.js';

describe('Memory OS Starlight Memory Palace (SIP)', () => {
  it('should index semantic nodes and retrieve them via semantic search matching', () => {
    const manager = new MemoryOSManager();

    const node1: MemoryNode = {
      id: 'entity_001',
      label: 'Starlight Intelligence System',
      category: 'entity',
      content: 'Core substrate containing memory palace databases and visual operators.',
      metadata: { repo: 'Starlight-Intelligence-System' },
      createdAt: '2026-06-14T03:00:00Z',
    };

    const node2: MemoryNode = {
      id: 'agent_002',
      label: 'Antigravity Code Agent',
      category: 'agent',
      content: 'Autonomous code engineering agent designed by Google DeepMind.',
      metadata: { model: 'Gemini' },
      createdAt: '2026-06-14T03:05:00Z',
    };

    manager.indexNode(node1);
    manager.indexNode(node2);

    expect(manager.getNodesCount()).toBe(2);

    const searchResult = manager.semanticSearch('Starlight');
    expect(searchResult).toHaveLength(1);
    expect(searchResult[0]?.id).toBe('entity_001');

    const searchAgent = manager.semanticSearch('agent');
    expect(searchAgent).toHaveLength(1);
    expect(searchAgent[0]?.id).toBe('agent_002');
  });

  it('should distill chat history into a structured Obsidian note', () => {
    const manager = new MemoryOSManager();
    const note = manager.distillChatHistory('Workshop Session 1', [
      'Discussed workspace structures.',
      'Completed installation of the orchestration module.',
    ]);

    expect(note.filePath).toContain('vaults/second-brain/Archive/Distillations/Workshop_Session_1.md');
    expect(note.title).toBe('Workshop Session 1');
    expect(note.tags).toContain('life-os');
    expect(note.body).toContain('Discussed workspace structures.');
  });
});
