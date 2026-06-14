import { describe, it, expect } from 'vitest';
import { CreatorOSManager } from '../src/engine.js';

describe('Creator OS Engine', () => {
  it('should draft a script with estimated durations based on outline length', () => {
    const manager = new CreatorOSManager();
    const script = manager.draftScript(
      'Getting Started with Starlight OS',
      'YouTube',
      ['Introduction', 'Deep dive into SIP', 'Conclusion']
    );

    expect(script.status).toBe('draft');
    expect(script.outline).toHaveLength(3);
    expect(script.estimatedMinutes).toBe(9);
    expect(script.rawText).toContain('1. Introduction');
  });

  it('should register and filter visual/music assets correctly', () => {
    const manager = new CreatorOSManager();
    manager.registerAsset('intro_vfx', 'HyperFrame', 'compositions/intro.html', { duration: 15 });
    manager.registerAsset('theme_song', 'SunoTrack', 'audio/suno_theme.mp3');

    const hyperframes = manager.getAssets('HyperFrame');
    expect(hyperframes).toHaveLength(1);
    expect(hyperframes[0]?.key).toBe('intro_vfx');

    const all = manager.getAssets();
    expect(all).toHaveLength(2);
  });
});
