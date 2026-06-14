import { BusinessOSManager, type Invoice } from '@frankx-ai/agentic-business-os';
import { CreatorOSManager } from '@frankx-ai/agentic-creator-os';
import { MemoryOSManager, type MemoryNode } from '@frankx-ai/second-brain-os';
import { calculateNetWorth, type WealthPortfolio } from '@frankx-ai/agentic-investor-os';
import { HealthScienceGateway } from '@frankx-ai/agentic-health-os';
import { compileLineageChain, type FamilyNode } from '@frankx-ai/agentic-family-os';
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
   * Pipeline 2: Sync Family heritage transcripts and Health gateway results to Memory OS (Obsidian)
   * and Creator OS (YouTube script outline drafting).
   */
  async syncBiographicResearchToCreator(
    familyNodes: FamilyNode[],
    rsId: string,
    topicTitle: string
  ): Promise<{ scriptId: string; memoryNodeId: string }> {
    // 1. Compile family chain
    const lineage = compileLineageChain(familyNodes);
    
    // 2. Query biomarker significance
    const biomarker = await this.healthGateway.resolveVariantSignificance(rsId);

    // 3. Construct unified narrative content
    const narrativeText = `Lineage Chain:\n${lineage.join('\n')}\n\nGenetic Health Marker (${rsId}): ${biomarker.geneSymbol} status: ${biomarker.clinicalSignificance}`;

    // 4. Index as a SIP node in Memory OS
    const nodeId = `heritage_node_${Date.now()}`;
    const memoryNode: MemoryNode = {
      id: nodeId,
      label: `Heritage & Health Study: ${topicTitle}`,
      category: 'concept',
      content: narrativeText,
      metadata: { rsId, familyCount: familyNodes.length },
      createdAt: new Date().toISOString(),
    };
    this.memoryManager.indexNode(memoryNode);

    // 5. Draft content script in Creator OS
    const script = this.creatorManager.draftScript(
      `Exploring My Heritage: ${topicTitle}`,
      'YouTube',
      [
        'Introduction to the Family Lineage',
        'How genetic traits trace back generations',
        `Analyzing biomarker ${biomarker.geneSymbol} (${rsId})`,
        'Future outlook & health conservation',
      ]
    );

    return {
      scriptId: script.id,
      memoryNodeId: nodeId,
    };
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
