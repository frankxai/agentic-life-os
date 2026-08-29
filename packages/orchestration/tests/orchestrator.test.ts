import { describe, expect, it } from 'vitest';
import { ALOSOrchestrator, BLOCKED_SENSITIVE_ROUTES } from '../src/system-orchestrator.js';
import { type LifeOSProfile } from '@frankx-ai/alos-core';

describe('Agentic Life OS public orchestration', () => {
  it('composes only non-executable private-adapter descriptors', () => {
    const orchestrator = new ALOSOrchestrator();

    expect(orchestrator.planPrivateBusinessReview('business_0123456789abcdef0123456789abcdef')).toMatchObject({
      financialDataIncluded: false,
      executionPermitted: false,
    });
    expect(orchestrator.planPrivateWealthReview('wealth_0123456789abcdef0123456789abcdef')).toMatchObject({
      financialDataIncluded: false,
      adviceProvided: false,
    });
    expect(orchestrator.planPrivateResearchQuery(
      'variant-literature',
      'research_0123456789abcdef0123456789abcdef',
    )).toMatchObject({ dataIncluded: false, networkRequestPermitted: false });
    expect(orchestrator.planPrivateFamilyProjection('family_0123456789abcdef0123456789abcdef')).toMatchObject({
      contentIncluded: false,
      authorityStatus: 'unverified-public-plan',
    });
  });

  it('fails closed without accepting family or genetic payloads', () => {
    const orchestrator = new ALOSOrchestrator();
    const decision = orchestrator.evaluateSensitiveRoute('genetic-to-creator');

    expect(decision).toMatchObject({
      conforms: false,
      inputIncluded: false,
      executionPermitted: false,
      authorityStatus: 'public-static-denial',
    });
    expect(orchestrator.getDataFlowStatus()).toEqual({ memoryNodesCount: 0, creatorAssetsCount: 0 });
    expect('getMemoryManager' in orchestrator).toBe(false);
    expect('getCreatorManager' in orchestrator).toBe(false);
    expect('getBusinessManager' in orchestrator).toBe(false);
    expect('getLifeSciencesGateway' in orchestrator).toBe(false);
    expect('aggregateProjectedWealth' in orchestrator).toBe(false);
    expect('clock' in orchestrator).toBe(false);
    expect(Object.isFrozen(BLOCKED_SENSITIVE_ROUTES)).toBe(true);
    expect(() => Object.defineProperty(BLOCKED_SENSITIVE_ROUTES, 'includes', {
      value: () => true,
    })).toThrow();
    expect(() => orchestrator.evaluateSensitiveRoute(
      'PRIVATE_PAYLOAD' as 'family-to-memory',
    )).toThrow(/not recognized/i);
  });

  it('reports only declarative public configuration and zero sensitive payloads', () => {
    const orchestrator = new ALOSOrchestrator(() => new Date('2026-08-24T12:00:00.000Z'));
    const profile = {
      modules: { business: {}, health: {} },
    } as LifeOSProfile;

    expect(orchestrator.generateStatusReport(profile)).toEqual({
      generatedAt: '2026-08-24T12:00:00.000Z',
      totalModulesDeclared: 2,
      memoryNodesCount: 0,
      creatorAssetsCount: 0,
      financialDataIncluded: false,
      personalDataIncluded: false,
      configurationStatus: 'unverified-profile-configuration',
      status: 'informational',
    });
  });

  it('rejects forged clock objects without emitting their payload', () => {
    const secret = 'PRIVATE_PAYLOAD_FROM_FORGED_CLOCK';
    const orchestrator = new ALOSOrchestrator(() => ({
      getTime: () => 0,
      toISOString: () => secret,
    }) as never);
    const profile = { modules: { health: {} } } as LifeOSProfile;

    let message = '';
    try {
      orchestrator.generateStatusReport(profile);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toMatch(/must return a Date/i);
    expect(message).not.toContain(secret);
  });
});
