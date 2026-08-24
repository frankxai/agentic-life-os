import { describe, it, expect } from 'vitest';
import { BusinessOSManager, type BusinessEntity } from '@frankx-ai/agentic-business-os';
import { ALOSOrchestrator } from '../src/system-orchestrator.js';
import { type WealthPortfolio } from '@frankx-ai/agentic-investor-os';
import { type FamilyNode } from '@frankx-ai/agentic-family-os';
import { type LifeOSProfile } from '@frankx-ai/alos-core';

describe('Agentic Life OS (ALOS) Interconnectivity', () => {
  const entity: BusinessEntity = {
    name: 'Example Cooperative',
    kvkNumber: '00000000',
    vatNumber: 'NL000000000B00',
    jurisdiction: 'NL',
    taxReservesRatio: 0.25,
  };

  it('should successfully calculate projected wealth by connecting Business cashflow and Investor portfolio', () => {
    const businessManager = new BusinessOSManager(entity);
    businessManager.addInvoice({
      id: 'INV-001',
      clientName: 'Enterprise Client A',
      amount: 10000,
      vatRate: 0.21,
      status: 'paid',
      issueDate: '2026-06-01',
      dueDate: '2026-06-15',
    });
    businessManager.addInvoice({
      id: 'INV-002',
      clientName: 'Enterprise Client B',
      amount: 5000,
      vatRate: 0.21,
      status: 'sent',
      issueDate: '2026-06-10',
      dueDate: '2026-06-24',
    });

    const orchestrator = new ALOSOrchestrator(businessManager);

    const portfolio: WealthPortfolio = {
      cash: 20000,
      equities: 50000,
      realEstate: 300000,
      sovereignAssets: 10000,
    };

    // Net worth = 20k cash + 50k equities + 300k RE + 10k sovereign = 380k
    // Business OS has: 10k paid + 5k outstanding = 15k additions
    // Total should be: 380k + 15k = 395k
    const projectedWealth = orchestrator.aggregateProjectedWealth(portfolio);
    expect(projectedWealth).toBe(395000);
  });

  it('fails closed instead of sending family and genetic data to generic memory or creator modules', async () => {
    const businessManager = new BusinessOSManager(entity);
    const orchestrator = new ALOSOrchestrator(businessManager);

    const nodes: FamilyNode[] = [
      { id: 'person_ancestor', name: 'Example ancestor label', relationship: 'ancestor', birthYear: 1920 },
      { id: 'person_parent', name: 'Example parent label', relationship: 'parent', birthYear: 1955 },
    ];

    await expect(
      orchestrator.syncBiographicResearchToCreator(
        nodes,
        'synthetic-variant-reference',
        'Private research topic'
      )
    ).rejects.toThrow(/disabled pending trusted consent and publication authorization/i);

    expect(orchestrator.getMemoryManager().getNodesCount()).toBe(0);
    expect(orchestrator.getCreatorManager().getAssets()).toEqual([]);
  });

  it('should generate a comprehensive health dashboard report', () => {
    const businessManager = new BusinessOSManager(entity);
    businessManager.addInvoice({
      id: 'INV-001',
      clientName: 'Client X',
      amount: 15000,
      vatRate: 0.21,
      status: 'sent',
      issueDate: '2026-06-01',
      dueDate: '2026-06-15',
    });

    const orchestrator = new ALOSOrchestrator(businessManager);

    const profile: LifeOSProfile = {
      systemName: 'Agentic Life OS (ALOS)',
      version: '1.0.0',
      sipVersion: '1.1.1',
      workstation: {
        machineName: 'local-instance',
        os: 'Cross-platform',
      },
      modules: {
        business: {
          repoName: 'agentic-business-os',
          path: 'packages/business',
          status: 'live',
          riskLevel: 'production',
          healthCommand: 'pnpm test',
          activeAgents: ['Claude Code'],
          purpose: 'Billing',
        },
      },
    };

    const portfolio: WealthPortfolio = {
      cash: 5000,
      equities: 0,
      realEstate: 0,
      sovereignAssets: 0,
    };

    const report = orchestrator.generateHealthReport(profile, portfolio);
    expect(report.status).toBe('healthy');
    expect(report.totalModulesChecked).toBe(1);
    expect(report.unresolvedReceivablesEUR).toBe(15000);
    expect(report.projectedNetWorthEUR).toBe(20000); // 5000 cash + 15000 receivables
  });
});
