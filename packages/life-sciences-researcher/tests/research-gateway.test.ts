import { describe, expect, it } from 'vitest';
import { LifeSciencesResearchGateway, RESEARCH_QUERY_KINDS } from '../src/research-gateway.js';

describe('public life-sciences research boundary', () => {
  const gateway = new LifeSciencesResearchGateway();

  it('returns a non-executable query descriptor without biomedical data', () => {
    const plan = gateway.planResearchQuery(
      'clinical-trial-literature',
      'research_0123456789abcdef0123456789abcdef',
    );

    expect(plan).toMatchObject({
      operation: 'resolve-research-query',
      target: 'private-external-research-adapter',
      dataIncluded: false,
      networkRequestPermitted: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
    });
    expect(JSON.stringify(plan)).not.toMatch(/NCT|CHEMBL|RECRUITING|IC50|retrievedAt/i);
  });

  it('rejects free text, variant identifiers, condition names, chemicals, and paths', () => {
    const unsafeValues = [
      'BRCA1',
      'rs12345',
      'Aspirin',
      'private-personal-context',
      '../query',
      'C:\\records\\query',
      'research_0123',
    ];

    for (const unsafeValue of unsafeValues) {
      expect(() => gateway.planResearchQuery('variant-literature', unsafeValue)).toThrow(/reserved opaque reference syntax/i);
    }
    const coercionObject = {
      secret: 'private condition',
      toString: () => 'research_0123456789abcdef0123456789abcdef',
    };
    expect(() => gateway.planResearchQuery(
      'variant-literature',
      coercionObject as unknown as string,
    )).toThrow(/reserved opaque reference syntax/i);
  });

  it('rejects caller-invented query kinds', () => {
    expect(Object.isFrozen(RESEARCH_QUERY_KINDS)).toBe(true);
    expect(() => Object.defineProperty(RESEARCH_QUERY_KINDS, 'includes', {
      value: () => true,
    })).toThrow();
    expect(() => gateway.planResearchQuery(
      'patient-diagnosis' as 'variant-literature',
      'research_0123456789abcdef0123456789abcdef',
    )).toThrow(/not supported/i);
    expect(() => gateway.planResearchQuery(
      'PRIVATE_FREE_TEXT' as 'variant-literature',
      'research_0123456789abcdef0123456789abcdef',
    )).toThrow(/not supported/i);
  });
});
