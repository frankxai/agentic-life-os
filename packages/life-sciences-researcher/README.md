# @frankx-ai/life-sciences-researcher-is

Descriptor-only public boundary for separately operated biomedical research
adapters.

The package does not query dbSNP, ClinVar, ChEMBL, ClinicalTrials.gov, AlphaFold,
PDB, or literature services. It returns no variant significance, assay value,
trial status, treatment inference, provider timestamp, or fabricated fixture
that could be mistaken for current evidence.

```ts
import { LifeSciencesResearchGateway } from '@frankx-ai/life-sciences-researcher-is';

const gateway = new LifeSciencesResearchGateway();
const plan = gateway.planResearchQuery(
  'clinical-trial-literature',
  'research_0123456789abcdef0123456789abcdef',
);
```

The plan is non-executable, contains no query text or scientific data, and is
always marked `unverified-public-plan`. A private adapter must minimize the
query, resolve live authoritative providers, preserve provider timestamps and
citations, enforce rights, and require human scientific review. Patient-specific
interpretation remains outside this package and belongs with qualified care.
