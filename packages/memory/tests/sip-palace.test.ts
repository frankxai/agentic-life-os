import { describe, expect, it } from 'vitest';
import { MemoryOSManager } from '../src/sip-palace.js';

describe('public Second Brain boundary', () => {
  it('returns only a non-executable descriptor for a private-adapter memory reference', () => {
    const manager = new MemoryOSManager();
    const plan = manager.planExternalIndex('mem_0123456789abcdef0123456789abcdef');

    expect(plan).toMatchObject({
      operation: 'index-descriptor',
      target: 'private-external-memory-adapter',
      contentIncluded: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
    });
    expect(manager.getNodesCount()).toBe(0);
  });

  it('plans transcript handling without accepting titles, snippets, or paths', () => {
    const manager = new MemoryOSManager();
    const plan = manager.planChatDistillation('session_0123456789abcdef0123456789abcdef');

    expect(plan.operation).toBe('distill-chat');
    expect(JSON.stringify(plan)).not.toMatch(/title|snippet|transcript|vault|[A-Za-z]:[\\/]/i);
  });

  it('rejects caller content and traversal-shaped values instead of treating them as references', () => {
    const manager = new MemoryOSManager();
    const unsafeValues = [
      'BRCA1 pathogenic family result',
      '../escape',
      '..\\escape',
      'C:\\private',
      '/private',
      'session_0123',
      'mem_0123456789abcdef0123456789abcdeg',
    ];

    for (const unsafeValue of unsafeValues) {
      expect(() => manager.planExternalIndex(unsafeValue)).toThrow(/reserved opaque reference syntax/i);
      expect(() => manager.planChatDistillation(unsafeValue)).toThrow(/reserved opaque reference syntax/i);
    }
    const coercionObject = {
      secret: 'private memory content',
      toString: () => 'mem_0123456789abcdef0123456789abcdef',
    };
    expect(() => manager.planExternalIndex(coercionObject as unknown as string)).toThrow(/reserved opaque reference syntax/i);
  });
});
