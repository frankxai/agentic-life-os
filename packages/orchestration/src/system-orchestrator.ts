import { BusinessOSManager, type Invoice } from '@frankx-ai/agentic-business-os';
import { CreatorOSManager } from '@frankx-ai/agentic-creator-os';
import { MemoryOSManager } from '@frankx-ai/second-brain-os';
import { calculateNetWorth, type WealthPortfolio } from '@frankx-ai/agentic-investor-os';
import { HealthScienceGateway } from '@frankx-ai/agentic-health-os';
import { type FamilyNode } from '@frankx-ai/agentic-family-os';
import { type LifeOSProfile } from '@frankx-ai/alos-core';

export interface EcosystemHealthReport {
  timestamp: string;
  totalModulesChecked: number;
  unresolvedReceivablesEUR: number;
  projectedNetWorthEUR: number;
  memoryNodesCount: number;
  status: 'healthy' | 'warning' | 'degraded';
}

export class ALOSOrchestrator {
  private businessManager: BusinessOSManager;
  private creatorManager: CreatorOSManager;
  private memoryManager: MemoryOSManager;
  private healthGateway: HealthScienceGateway;

  constructor(businessManager: BusinessOSManager) {
    this.businessManager = businessManager;
    this.creatorManager = new CreatorOSManager();
    this.memoryManager = new MemoryOSManager();
    this.healthGateway = new HealthScienceGateway();
  }

  getBusinessManager(): BusinessOSManager {
    return this.businessManager;
  }

  getCreatorManager(): CreatorOSManager {
    return this.creatorManager;
  }

  getMemoryManager(): MemoryOSManager {
    return this.memoryManager;
  }

  getHealthGateway(): HealthScienceGateway {
    return this.healthGateway;
  }

  /**
   * Pipeline 1: Connect Business OS cashflow projections with Investor OS wealth portfolios
   */
  aggregateProjectedWealth(portfolio: WealthPortfolio): number {
    const cash = portfolio.cash;
    const realizedIncome = this.businessManager.getRealizedIncome();
    const outstandingReceivables = this.businessManager.getOutstandingReceivables();

    // Adjust portfolio cash to incorporate real business OS flows
    const updatedPortfolio: WealthPortfolio = {
      ...portfolio,
      cash: cash + realizedIncome + outstandingReceivables,
    };

    return calculateNetWorth(updatedPortfolio);
  }

  /**
   * Disabled fail-closed boundary.
   *
   * Family records and genetic/health results must not flow into generic memory or
   * creator systems until the private deployment has server-resolved consent,
   * purpose limitation, audience authorization, minimization/redaction, audit,
   * withdrawal, and recipient controls. Keeping the legacy signature prevents a
   * silent API substitution while making every attempted transfer fail closed.
   */
  async syncBiographicResearchToCreator(
    familyNodes: FamilyNode[],
    rsId: string,
    topicTitle: string
  ): Promise<{ scriptId: string; memoryNodeId: string }> {
    void familyNodes;
    void rsId;
    void topicTitle;
    throw new Error(
      'Family-to-health, memory, and creator synchronization is disabled pending trusted consent and publication authorization.'
    );
  }

  /**
   * Generates a unified ecosystem health dashboard report
   */
  generateHealthReport(profile: LifeOSProfile, portfolio: WealthPortfolio): EcosystemHealthReport {
    const outstanding = this.businessManager.getOutstandingReceivables();
    const netWorth = this.aggregateProjectedWealth(portfolio);

    return {
      timestamp: new Date().toISOString(),
      totalModulesChecked: Object.keys(profile.modules).length,
      unresolvedReceivablesEUR: outstanding,
      projectedNetWorthEUR: netWorth,
      memoryNodesCount: this.memoryManager.getNodesCount(),
      status: 'healthy',
    };
  }
}
