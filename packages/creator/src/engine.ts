export interface ContentScript {
  id: string;
  title: string;
  channel: 'YouTube' | 'Substack' | 'Workshop';
  status: 'draft' | 'review' | 'ready' | 'published';
  outline: string[];
  rawText?: string;
  estimatedMinutes: number;
}

export interface VisualAsset {
  key: string;
  type: 'HyperFrame' | 'AnimeJS' | 'ThreeJS' | 'SunoTrack';
  path: string;
  metadata: Record<string, unknown>;
}

export interface WorkshopSyllabus {
  workshopName: string;
  modules: {
    title: string;
    durationMinutes: number;
    description: string;
  }[];
}

export class CreatorOSManager {
  private scripts: ContentScript[] = [];
  private assets: VisualAsset[] = [];

  draftScript(title: string, channel: ContentScript['channel'], outline: string[]): ContentScript {
    const newScript: ContentScript = {
      id: `script_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      channel,
      status: 'draft',
      outline,
      rawText: `Draft of "${title}" script:\n` + outline.map((item, idx) => `${idx + 1}. ${item}`).join('\n'),
      estimatedMinutes: outline.length * 3, // rough estimate
    };
    this.scripts.push(newScript);
    return newScript;
  }

  registerAsset(key: string, type: VisualAsset['type'], path: string, metadata: Record<string, unknown> = {}): VisualAsset {
    const asset: VisualAsset = { key, type, path, metadata };
    this.assets.push(asset);
    return asset;
  }

  getAssets(type?: VisualAsset['type']): VisualAsset[] {
    if (type) {
      return this.assets.filter((a) => a.type === type);
    }
    return [...this.assets];
  }

  compileWorkshopSyllabus(workshopName: string, modules: WorkshopSyllabus['modules']): WorkshopSyllabus {
    return {
      workshopName,
      modules,
    };
  }
}
