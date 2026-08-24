# Contributing

Contributions are welcome when they preserve the sovereign open-core boundary.

## Requirements

- Use only synthetic fixtures. Never commit real personal, clinical, genomic,
  financial, family, client, or practitioner data.
- Keep health behavior educational, organizational, and clinician-handoff
  oriented. Do not add diagnosis, treatment, medication, supplement, dose, or
  emergency reassurance behavior.
- Treat books, podcasts, influencers, and research fixtures as discovery inputs,
  not verified truth. Public health claims need independently reviewed sources.
- New egress paths must be default-deny, purpose-bound, sensitivity-bound,
  tenant-bound, consent-bound, and covered by adversarial tests.
- Do not add a remote service that accepts raw personal records to the reference runtime.

## Focused verification

```bash
pnpm check:public
pnpm --filter @frankx-ai/agentic-health-os typecheck
pnpm --filter @frankx-ai/agentic-health-os test
```

The full workspace build is a separate release gate. Public-repository visibility,
domains, deployments, and regulated-product claims remain human-approved actions.
