import { BusinessOSManager, type PrivateBusinessReviewPlan } from '@frankx-ai/agentic-business-os';
import { CreatorOSManager } from '@frankx-ai/agentic-creator-os';
import { MemoryOSManager } from '@frankx-ai/second-brain-os';
import { InvestorOSManager, type PrivateWealthReviewPlan } from '@frankx-ai/agentic-investor-os';
import { AgenticHealthOS } from '@frankx-ai/agentic-health-os';
import {
  LifeSciencesResearchGateway,
  type PrivateResearchQueryPlan,
  type ResearchQueryKind,
} from '@frankx-ai/life-sciences-researcher-is';
import { FamilyResearchBoundary, type PrivateFamilyProjectionPlan } from '@frankx-ai/agentic-family-os';
import { type LifeOSProfile } from '@frankx-ai/alos-core';

export const BLOCKED_SENSITIVE_ROUTES = Object.freeze([
  'family-to-memory',
  'family-to-creator',
  'genetic-to-memory',
  'genetic-to-creator',
] as const);
export type BlockedSensitiveRoute = (typeof BLOCKED_SENSITIVE_ROUTES)[number];
const BLOCKED_SENSITIVE_ROUTE_SET = new Set<string>(BLOCKED_SENSITIVE_ROUTES);
const SET_HAS = Set.prototype.has;

export interface SensitiveRouteDecision {
  route: BlockedSensitiveRoute;
  conforms: false;
  code: 'sensitive-cross-domain-route-disabled';
  inputIncluded: false;
  executionPermitted: false;
  authorityStatus: 'public-static-denial';
  reason: string;
}

export interface EcosystemStatusReport {
  generatedAt: string;
  totalModulesDeclared: number;
  memoryNodesCount: 0;
  creatorAssetsCount: 0;
  financialDataIncluded: false;
  personalDataIncluded: false;
  configurationStatus: 'unverified-profile-configuration';
  status: 'informational';
}

/** Composes public descriptor-only packages without exposing their managers or sensitive state. */
export class ALOSOrchestrator {
  readonly #businessManager = new BusinessOSManager();
  readonly #creatorManager = new CreatorOSManager();
  readonly #memoryManager = new MemoryOSManager();
  readonly #investorManager = new InvestorOSManager();
  readonly #healthOS = new AgenticHealthOS();
  readonly #lifeSciencesGateway = new LifeSciencesResearchGateway();
  readonly #familyBoundary = new FamilyResearchBoundary();
  readonly #clock: () => Date;

  constructor(clock: () => Date = () => new Date()) {
    this.#clock = clock;
  }

  getHealthOS(): AgenticHealthOS {
    return this.#healthOS;
  }

  getDataFlowStatus(): Readonly<{ memoryNodesCount: 0; creatorAssetsCount: 0 }> {
    return Object.freeze({
      memoryNodesCount: this.#memoryManager.getNodesCount(),
      creatorAssetsCount: this.#creatorManager.getAssetsCount(),
    });
  }

  planPrivateBusinessReview(opaqueLedgerRef: string): PrivateBusinessReviewPlan {
    return this.#businessManager.planPrivateLedgerReview(opaqueLedgerRef);
  }

  planPrivateWealthReview(opaquePortfolioRef: string): PrivateWealthReviewPlan {
    return this.#investorManager.planPrivatePortfolioReview(opaquePortfolioRef);
  }

  planPrivateResearchQuery(kind: ResearchQueryKind, opaqueQueryRef: string): PrivateResearchQueryPlan {
    return this.#lifeSciencesGateway.planResearchQuery(kind, opaqueQueryRef);
  }

  planPrivateFamilyProjection(opaqueRegistryRef: string): PrivateFamilyProjectionPlan {
    return this.#familyBoundary.planPrivateProjection(opaqueRegistryRef);
  }

  evaluateSensitiveRoute(route: BlockedSensitiveRoute): SensitiveRouteDecision {
    if (typeof route !== 'string' || !Reflect.apply(SET_HAS, BLOCKED_SENSITIVE_ROUTE_SET, [route])) {
      throw new Error('Sensitive route is not recognized.');
    }
    return Object.freeze({
      route,
      conforms: false,
      code: 'sensitive-cross-domain-route-disabled',
      inputIncluded: false,
      executionPermitted: false,
      authorityStatus: 'public-static-denial',
      reason: 'Family and genetic data cannot enter generic Memory or Creator paths.',
    });
  }

  generateStatusReport(profile: LifeOSProfile): EcosystemStatusReport {
    const observed = this.#clock();
    if (!(observed instanceof Date)) throw new Error('Orchestrator clock must return a Date.');
    const instant = Date.prototype.getTime.call(observed);
    if (!Number.isFinite(instant)) throw new Error('Orchestrator clock returned an invalid time.');
    const generatedAt = new Date(instant).toISOString();
    return Object.freeze({
      generatedAt,
      totalModulesDeclared: Object.keys(profile.modules).length,
      memoryNodesCount: this.#memoryManager.getNodesCount(),
      creatorAssetsCount: this.#creatorManager.getAssetsCount(),
      financialDataIncluded: false,
      personalDataIncluded: false,
      configurationStatus: 'unverified-profile-configuration',
      status: 'informational',
    });
  }
}
