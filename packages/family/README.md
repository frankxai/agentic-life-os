# @frankx-ai/agentic-family-os

Descriptor-only public boundary for private family research.

## Current capability

The package accepts one private-adapter-issued opaque registry reference and
returns a frozen, non-executable plan. It accepts and returns no names,
relationships, evidence, citations, reviewer claims, dates, genetics, media,
tree nodes, or publication payloads.

```ts
import { FamilyResearchBoundary } from '@frankx-ai/agentic-family-os';

const boundary = new FamilyResearchBoundary();
const plan = boundary.planPrivateProjection(
  'family_0123456789abcdef0123456789abcdef',
);
```

`authorityStatus: 'unverified-public-plan'` and
`executionPermitted: false` are fixed. The public package does not prove that a
reference was privately minted; it only enforces the reserved syntax.

## Private adapter responsibility

A separately deployed private adapter must own authentication, encrypted
records, evidence resolution, source rights, exact-registry digests,
authority-issued review receipts, consent and revocation, audience
authorization, audit, backup/restore, and succession. It must not accept a
caller-authored `accepted` flag or reviewer label as authority.

The research method is documented as a private-adapter design guide in the
[family research operating system](../../docs/family-research-operating-system.md).
No real family or genetic data belongs in this repository.
