# Agentic Life OS

Agentic Life OS (ALOS) is an open-source, local-first runtime for bounded AI
agents across life domains. The reusable runtime is public; each person's data,
authority state, and operating configuration stay in a separate private instance.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org/)

## The boundary

```text
Public Health Intelligence System artifacts
                  |
                  | immutable commit + version + SHA-256 receipt
                  v
Public Agentic Life OS runtime  <----  private instance policy overlay
                  |
                  | descriptor-only local adapter
                  v
Separately encrypted local vault
                  |
                  +---- one-way sanitized Second Brain projection
                  +---- manifest-only clinician or encrypted-local export
```

The public runtime contains contracts, admission logic, synthetic fixtures, and
generic workflows. It contains no raw health records, secrets, live consent,
personal metrics, family data, financial data, or private memory.

## Health runtime

[`@frankx-ai/agentic-health-os`](packages/health/README.md) now provides:

- immutable receipts for versioned artifacts from
  `frankxai/health-intelligence-system`;
- a separately encrypted local-vault boundary that exposes descriptors, not bytes;
- default-deny capability, consent, purpose, sensitivity, and egress admission;
- exact-payload-bound, single-use human approval claimed atomically from trusted
  local authority state;
- one-way, sanitized Second Brain projection contracts;
- manifest-only clinician and encrypted-local export contracts;
- adversarial cross-tenant, revocation, path, sensitivity, and egress tests.

This is organizational and developer infrastructure. It does not diagnose,
interpret results, recommend treatment or medication changes, or replace a
licensed clinician. Artifact integrity does not establish clinical validity.

## Public and private products

- **Agentic Life OS** is the public developer/runtime name.
- **Health Intelligence System** is the public evidence, protocol, privacy, and
  clinician-preparation source.
- **Training Intelligence Pack** is the descriptive public movement and recovery module.
- **Vitalis** is held from public health-product use because exact-name AI health and
  health-OS products already operate in the category. It may remain a private memorial
  steward codename inside a private instance.
- **Velora** is held from public fitness-product use and remains reserved for Arcanea's
  established courage/action Executor persona.
- A private instance such as `frankx-life-os` configures the public runtime and
  owns local data. It should not duplicate reusable product code.

Neither held name may appear as a released app, product, marketplace agent, package, or
service without a new qualified legal clearance decision. An agent persona never becomes an authority boundary: the runtime
grants tools through capabilities, current consent, and human approval.

## Packages

| Package | Purpose | Maturity |
|---|---|---|
| [`core`](packages/core/README.md) | Strict profile schema and loader | Experimental |
| `business` | Synthetic business workflow primitives | Experimental |
| `creator` | Synthetic creator workflow primitives | Experimental |
| `memory` | Local memory-node primitives | Experimental |
| `orchestration` | Cross-package composition | Experimental |
| `investor` | Synthetic wealth-calculation primitives | Experimental |
| [`health`](packages/health/README.md) | Sovereign health boundary and wellness organization | Experimental, safety-gated |
| [`life-sciences-researcher`](packages/life-sciences-researcher/README.md) | Research-only synthetic gateway fixtures | Experimental; not a truth source |
| [`family`](packages/family/README.md) | Synthetic heritage primitives | Experimental |

The static [`dashboard`](dashboard/index.html) is a development demonstration,
not a live medical, financial, or operational console.

## Get started

Requirements: Node.js 24 or newer and pnpm 9.

```bash
git clone https://github.com/frankxai/agentic-life-os.git
cd agentic-life-os
pnpm install --frozen-lockfile
pnpm check:public
pnpm --filter @frankx-ai/agentic-health-os typecheck
pnpm --filter @frankx-ai/agentic-health-os test
```

For a private deployment, start with the
[`private-instance-overlay`](templates/private-instance-overlay/README.md). Never
copy raw records or secrets into this repository.

## Trust, privacy, and contributions

- [Open-core architecture](docs/open-core-architecture.md)
- [Privacy boundary](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Offering and release spine](docs/ultimate-offering-spine.md)
- [Public release checklist](docs/public-release-checklist.md)

The repository is licensed under the [MIT License](LICENSE). Health sources,
books, papers, media, datasets, and imported artifacts retain their own licenses;
the MIT license does not relicense third-party content.
