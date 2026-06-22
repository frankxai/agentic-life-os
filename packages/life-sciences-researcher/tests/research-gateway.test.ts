import { describe, it, expect } from 'vitest';
import { LifeSciencesResearchGateway } from '../src/research-gateway.js';

describe('Life Sciences Researcher IS', () => {
  const gateway = new LifeSciencesResearchGateway();

  it('wraps variant lookups in a research-only envelope', async () => {
    const result = await gateway.resolveVariantSignificance('rs12345');
    expect(result.researchOnly).toBe(true);
    expect(result.data.geneSymbol).toBe('TEST1');
    expect(result.data.clinicalSignificance).toBe('synthetic-fixture-only');
  });

  it('wraps chemical assays with limitations', async () => {
    const result = await gateway.queryChEMBL('Aspirin');
    expect(result.researchOnly).toBe(true);
    expect(result.data.moleculeName).toBe('Aspirin');
    expect(result.limitations.join(' ')).toContain('does not imply safety');
  });
});
