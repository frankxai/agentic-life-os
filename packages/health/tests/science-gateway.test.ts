import { describe, it, expect } from 'vitest';
import { HealthScienceGateway } from '../src/science-gateway.js';

describe('Health OS Science Gateway', () => {
  const gateway = new HealthScienceGateway();

  it('should resolve variant pathogenicity from dbSNP', async () => {
    const result = await gateway.resolveVariantSignificance('rs12345');
    expect(result.geneSymbol).toBe('BRCA1');
    expect(result.clinicalSignificance).toBe('Pathogenic');
  });

  it('should query chemical assays from ChEMBL', async () => {
    const result = await gateway.queryChEMBL('Aspirin');
    expect(result.chemblId).toBe('CHEMBL123');
    expect(result.moleculeName).toBe('Aspirin');
  });
});
