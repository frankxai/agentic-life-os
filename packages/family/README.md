# @frankx-ai/agentic-family-os

Private Family Intelligence integration for Agentic Life OS.

## Current capability

- Evidence records with provenance, rights class, archive/source reference, access date, and fixity digest.
- Relationship claims with proposal/review/acceptance/dispute/rejection states.
- Human-review and evidence requirements before a relationship can be accepted.
- Fail-closed detection of missing references, duplicate IDs, impossible self-parenting, excessive biological-parent claims, invalid confidence, and ancestry cycles.
- Deterministic private, family, and public ancestor projections.
- Public projection excludes living people, unknown life status, and non-public records.
- Every rendered relationship retains claim, confidence, and evidence references.

The legacy `compileLineageChain` helper remains for compatibility but is only a formatter. It is not historical validation and must not be used as the canonical archive.

## Usage

```ts
import {
  buildAncestorProjection,
  validateResearchRegistry,
  type FamilyResearchRegistry,
} from '@frankx-ai/agentic-family-os';

validateResearchRegistry(privateRegistry);
const privateTree = buildAncestorProjection(privateRegistry, { audience: 'private' });
```

Real tenant records do not belong in this repository. The private runtime root is:

`<private-family-data-root>/`

Research and stewardship process:

[`../../docs/family-research-operating-system.md`](../../docs/family-research-operating-system.md)

## Production gates

This package is an integration kernel, not yet a production vault. Real ingestion remains blocked pending:

- authenticated private sessions;
- encrypted database and object storage;
- malware and file-type validation;
- append-only persistent audit;
- consent/steward onboarding;
- fixity monitoring;
- encrypted backup and verified restore;
- succession and emergency access controls;
- independent privacy/security review.
