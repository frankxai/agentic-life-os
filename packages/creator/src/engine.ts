export type CreatorChannel = 'YouTube' | 'Substack' | 'Workshop';

export interface PrivateCreatorPlan {
  operation: 'draft-content';
  opaqueSourceRef: string;
  channel: CreatorChannel;
  target: 'private-external-creator-adapter';
  contentIncluded: false;
  executionPermitted: false;
  authorityStatus: 'unverified-public-plan';
  requiredControls: readonly [
    'private-adapter-issued-reference',
    'data-classification',
    'rights-review',
    'sanitization-review',
    'human-clearance',
  ];
}

const OPAQUE_CREATOR_SOURCE_REF = /^creator_[a-f0-9]{32}$/;
const CHANNELS = new Set<CreatorChannel>(['YouTube', 'Substack', 'Workshop']);
const SET_HAS = Set.prototype.has;
const CREATOR_REQUIRED_CONTROLS = Object.freeze([
  'private-adapter-issued-reference',
  'data-classification',
  'rights-review',
  'sanitization-review',
  'human-clearance',
] as const);

/**
 * Public, descriptor-only creator boundary.
 *
 * Raw titles, outlines, notes, record content, paths, and metadata are never
 * accepted here. A private adapter owns resolution, rights checks, sanitization,
 * authorization, and any actual generation or publication.
 */
export class CreatorOSManager {
  planDraft(opaqueSourceRef: string, channel: CreatorChannel): PrivateCreatorPlan {
    if (typeof opaqueSourceRef !== 'string' || !OPAQUE_CREATOR_SOURCE_REF.test(opaqueSourceRef)) {
      throw new Error('Creator source reference must use the reserved opaque reference syntax.');
    }
    if (!Reflect.apply(SET_HAS, CHANNELS, [channel])) {
      throw new Error('Creator channel is not supported.');
    }

    return Object.freeze({
      operation: 'draft-content',
      opaqueSourceRef,
      channel,
      target: 'private-external-creator-adapter',
      contentIncluded: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
      requiredControls: CREATOR_REQUIRED_CONTROLS,
    });
  }

  getAssetsCount(): 0 {
    return 0;
  }
}
