# Work Item Extension: ALOS LiveOS Foundation

Parent work item: `alos-ultimate-offering-spine`

## Why now

ALOS has modular packages and a legacy static dashboard, but no shared action contract or private product loop that connects everyday practice, memory, health preparation, learning, and agent help without duplicating ownership across the estate.

## Expected impact

- A private operator can complete Today → Practice → Palace in one interface.
- Body, Fitness, Health preparation, Intellectual, Palace, and Review interfaces share the same local receipt boundary; Body file intake references only filename/size metadata in the active browser session.
- Agents, dashboard clients, and future starter adapters share one command and receipt vocabulary.
- Health, spiritual-practice, privacy, and source boundaries are explicit in code rather than only prose.

## Cost and approval posture

- **Cost risk:** low for this foundation; it adds no service, worker, database, deploy, credential, or paid dependency.
- **Future gated cost:** encrypted multi-device sync may require a storage/account service only after the sync-beta gate, security review, cost record, rollback plan, and named approval.
- **Approval:** no external action is authorized by the current command layer. Health preparation and any `apply` action require explicit user review.

## Evidence and next action

- Evidence: `packages/core/src/liveos.ts`, `packages/practice/`, `packages/sync/`, `apps/liveos/`, and `docs/liveos/`.
- Next action: when PP admission allows, synchronize the workspace lockfile, install dependencies, run focused tests/typechecks, inspect desktop/mobile/reduced-motion output, then request independent cross-model review before a preview or public-starter change.

## Verification note

The scoped security scan found no secret leak. Its dependency audit reports pre-existing vulnerable `vitest`, `vite`, and `esbuild` versions already present in the root lockfile; this LiveOS foundation did not modify those resolved versions. Dependency upgrades are a separate, PP-gated maintenance change.
