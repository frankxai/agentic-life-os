# Security policy

Agentic Life OS is a local-first reference runtime. It does not make a prompt,
agent, serialized consent record, or caller-authored approval authoritative.
Deployments must keep authority repositories and decrypted data behind a local,
authenticated boundary.

## Supported surface

Security fixes target the latest release and the default branch. Before a
public release, run:

```bash
pnpm check:public
pnpm --filter @frankx-ai/agentic-health-os typecheck
pnpm --filter @frankx-ai/agentic-health-os test
```

## Report a vulnerability

Use GitHub's private vulnerability reporting for this repository. Do not open
a public issue containing a secret, a health record, identifying information,
or an exploit payload that exposes local data.

## Non-negotiable boundaries

- Raw health, clinical, genomic, financial, family, and identity data never
  belongs in this repository.
- A public deployment must not accept or persist personal records.
- Raw health bytes stay in a separately encrypted local vault. The public
  health package handles descriptors, hashes, manifests, and decisions only.
- Consent, capability, egress policy, and human approval are re-resolved from
  an authority-owned repository at operation time. Request JSON is not authority.
- Every egress approval is bound to the exact canonical payload and consumed once
  through an atomic, durable claim. Production adapters must revalidate all
  revocable authority records in that same transaction; the public interface is
  not evidence that a third-party adapter does this correctly.
- Export preparation never performs transport. A private adapter must bind an
  approved manifest to encrypted bytes and a human-selected destination.
- Public Health Intelligence System artifacts are integrity-checked against an
  immutable commit, semantic version, repository-relative path, byte length,
  and SHA-256. Integrity is not evidence quality or medical validity.
