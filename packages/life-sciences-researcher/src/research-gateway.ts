export const RESEARCH_QUERY_KINDS = Object.freeze([
  'variant-literature',
  'compound-bioactivity-literature',
  'clinical-trial-literature',
  'protein-structure-literature',
] as const);

export type ResearchQueryKind = (typeof RESEARCH_QUERY_KINDS)[number];

export interface PrivateResearchQueryPlan {
  operation: 'resolve-research-query';
  kind: ResearchQueryKind;
  opaqueQueryRef: string;
  target: 'private-external-research-adapter';
  dataIncluded: false;
  networkRequestPermitted: false;
  executionPermitted: false;
  authorityStatus: 'unverified-public-plan';
  requiredControls: readonly [
    'private-adapter-issued-reference',
    'query-minimization',
    'live-provider-resolution',
    'provider-retrieval-timestamp',
    'citation-and-provenance',
    'rights-and-license-review',
    'human-scientific-review',
    'no-patient-specific-interpretation',
  ];
}

const OPAQUE_RESEARCH_QUERY_REF = /^research_[a-f0-9]{32}$/;
const RESEARCH_QUERY_KIND_SET = new Set<string>(RESEARCH_QUERY_KINDS);
const SET_HAS = Set.prototype.has;
const REQUIRED_CONTROLS = Object.freeze([
  'private-adapter-issued-reference',
  'query-minimization',
  'live-provider-resolution',
  'provider-retrieval-timestamp',
  'citation-and-provenance',
  'rights-and-license-review',
  'human-scientific-review',
  'no-patient-specific-interpretation',
] as const);

/**
 * Public descriptor-only research boundary.
 *
 * It never performs a lookup, accepts free-text biomedical input, fabricates a
 * result, or returns scientific data. A private adapter must resolve the opaque
 * query against live authoritative sources and attach provenance.
 */
export class LifeSciencesResearchGateway {
  planResearchQuery(kind: ResearchQueryKind, opaqueQueryRef: string): PrivateResearchQueryPlan {
    if (typeof kind !== 'string' || !Reflect.apply(SET_HAS, RESEARCH_QUERY_KIND_SET, [kind])) {
      throw new Error('Research query kind is not supported.');
    }
    if (typeof opaqueQueryRef !== 'string' || !OPAQUE_RESEARCH_QUERY_REF.test(opaqueQueryRef)) {
      throw new Error('Research query reference must use the reserved opaque reference syntax.');
    }

    return Object.freeze({
      operation: 'resolve-research-query',
      kind,
      opaqueQueryRef,
      target: 'private-external-research-adapter',
      dataIncluded: false,
      networkRequestPermitted: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
      requiredControls: REQUIRED_CONTROLS,
    });
  }
}
