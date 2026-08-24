# Public release checklist

Changing repository visibility is a human-gated release action. The current tip
must pass every item below immediately before that action.

## Required before visibility changes

- [ ] Review the complete Git history, not only the current tree. Legacy WIP patch
  snapshots and machine-specific paths existed in earlier commits; deleting them
  from the tip does not remove them from history.
- [ ] Decide whether to rewrite history or publish from a clean, provenance-bound
  root commit. Re-run secret and personal-data scans after that decision.
- [ ] Run the full workspace test, typecheck, and build gates when machine capacity
  allows. Focused package tests are not a substitute for the release build.
- [ ] Regenerate `llms.txt`, `agents.json`, and `jsonld.json` from the exact release
  profile, then run `pnpm check:public` again.
- [ ] Run an independent security review of authority adapters, revocation,
  encrypted-vault integration, projection sinks, and any export implementation.
- [ ] Inventory dependency and third-party-content licenses. Do not publish book
  text, paywalled papers, copyrighted figures, or datasets without permission.
- [ ] Confirm all tests and examples are synthetic and no raw personal, clinical,
  genomic, financial, family, client, or practitioner data is present.
- [ ] Confirm public metadata contains no released Vitalis or Velora health/fitness
  product identity. Both naked names are held; a future exception requires a new
  qualified legal clearance decision.
- [ ] Review health, privacy, security, and regulatory copy with qualified humans.
  The repository must remain educational infrastructure, not a medical device claim.
- [ ] Make visibility, release, website, domain, and deployment changes through one
  approved release lane; none are performed by the source-preparation task.

## Tip checks

```bash
pnpm check:public
pnpm --filter @frankx-ai/agentic-health-os typecheck
pnpm --filter @frankx-ai/agentic-health-os test
pnpm --filter @frankx-ai/alos-core typecheck
pnpm --filter @frankx-ai/alos-core test
git diff --check
```
