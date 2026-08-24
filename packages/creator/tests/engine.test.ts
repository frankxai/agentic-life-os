import { describe, expect, it } from 'vitest';
import { CreatorOSManager } from '../src/engine.js';

describe('public Creator OS boundary', () => {
  it('returns a non-executable descriptor without source content', () => {
    const manager = new CreatorOSManager();
    const plan = manager.planDraft('creator_0123456789abcdef0123456789abcdef', 'YouTube');

    expect(plan).toMatchObject({
      operation: 'draft-content',
      channel: 'YouTube',
      target: 'private-external-creator-adapter',
      contentIncluded: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
    });
    expect(manager.getAssetsCount()).toBe(0);
  });

  it('rejects raw health, family, transcript, and traversal-shaped content', () => {
    const manager = new CreatorOSManager();
    const unsafeValues = [
      'BRCA1 pathogenic family result',
      'private transcript title',
      '../source',
      'C:\\records\\source',
      'creator_0123',
    ];

    for (const unsafeValue of unsafeValues) {
      expect(() => manager.planDraft(unsafeValue, 'Substack')).toThrow(/reserved opaque reference syntax/i);
    }
    const coercionObject = {
      secret: 'private transcript',
      toString: () => 'creator_0123456789abcdef0123456789abcdef',
    };
    expect(() => manager.planDraft(
      coercionObject as unknown as string,
      'Substack',
    )).toThrow(/reserved opaque reference syntax/i);
  });
});
