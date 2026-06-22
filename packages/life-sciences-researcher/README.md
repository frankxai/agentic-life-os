# @frankx-ai/life-sciences-researcher-is

Research-only biomedical intelligence package for Agentic Life OS.

This package owns scientific database and literature gateway behavior:

- dbSNP and ClinVar-style variant evidence lookup;
- ChEMBL-style drug-target assay lookup;
- ClinicalTrials.gov-style trial search;
- AlphaFold and PDB-style structure lookup.

## Boundary

Life Sciences Researcher IS does not provide personal medical advice. It returns research envelopes with source, retrieved date, limitations, and `researchOnly: true`. Agentic Health OS may route research questions here, but patient-specific interpretation goes to clinicians.
