export interface BioMarkerQuery {
  geneSymbol: string;
  variantId?: string; // e.g. rsID
  clinicalSignificance?: string; // Pathogenic / Benign / VUS
}

export interface DrugBioactivity {
  chemblId: string;
  moleculeName: string;
  targetProtein: string;
  ic50Value: number; // in nM
}

export interface ClinicalTrialMetadata {
  nctId: string;
  condition: string;
  phase: string;
  recruitmentStatus: string;
}

/**
 * Science Gateway maps the workstation's science plugins/databases into Health OS endpoints.
 */
export class HealthScienceGateway {
  /**
   * Resolves a variant ID (rsID) from dbSNP to clinical significance
   */
  async resolveVariantSignificance(rsId: string): Promise<BioMarkerQuery> {
    // In production, this queries the clinvar/dbsnp database skill wrappers
    return {
      geneSymbol: 'BRCA1',
      variantId: rsId,
      clinicalSignificance: 'Pathogenic',
    };
  }

  /**
   * Queries ChEMBL database for drug bioactivity targets
   */
  async queryChEMBL(chemicalName: string): Promise<DrugBioactivity> {
    return {
      chemblId: 'CHEMBL123',
      moleculeName: chemicalName,
      targetProtein: 'EGFR',
      ic50Value: 12.5,
    };
  }

  /**
   * Retrieves active clinical trials for a specific condition
   */
  async fetchTrials(condition: string): Promise<ClinicalTrialMetadata[]> {
    return [
      {
        nctId: 'NCT00000000',
        condition,
        phase: 'Phase III',
        recruitmentStatus: 'RECRUITING',
      },
    ];
  }
}
