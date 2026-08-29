# Agentic Coaching OS

`@frankx-ai/agentic-coaching-os` is the public, synthetic contract layer for a
future Coach Performance OS. It validates coach-curated knowledge graphs and
simulates whether a structured check-in review plan conforms to tenant,
assignment, consent, evidence, and coaching-scope rules.

Every result is non-authoritative and sets `executionPermitted: false`. The
package has no authentication, persistence, communication delivery, billing,
raw member records, clinical interpretation, or durable authority store.

## Public inputs

- Synthetic or opaque tenant, member, actor, assignment, and check-in references.
- Five banded lens signals: body, mind, performance, recovery, and context.
- Coach-curated knowledge nodes and typed relations with approved source metadata.
- A next-action draft that requires coach and member agreement.
- A caller-supplied consent snapshot used only for deterministic simulation.

## Excluded inputs

- PII, raw health records, biometrics, diagnoses, treatment details, therapy notes,
  free-text journaling, or session transcripts.
- Free-text next actions; public plans reference curated action-template identifiers.
- Prompt-authored authority, implicit consent, or unscoped cross-tenant access.
- Copied source bodies or evidence without provenance.

See [`docs/coach-performance-os.md`](../../docs/coach-performance-os.md) for the
product and private-runtime boundary.
