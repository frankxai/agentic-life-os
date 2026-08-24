# Agentic Life OS

Agentic Life OS (ALOS) is an intended open-source, local-first runtime for bounded
AI agents across life domains. The reusable code is being hardened for an audited
public projection; each person's data, authority state, and operating configuration
stay in a separate private instance.

> Release state: this repository is a private hardening source. Its existing Git
> history is not approved for publication. The intended public runtime must be
> emitted as an independently audited clean-history projection.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org/)

## The boundary

```text
Public Health Intelligence System artifacts
                  |
                  | immutable commit + version + SHA-256 receipt
                  v
Intended public ALOS projection <---- private instance config overlay
                  |
                  | non-executable plan + authenticated policy query
                  v
Private runtime authority store
                  |
                  | descriptor-only private adapter
                  v
Separately encrypted local vault
                  |
                  +---- structured Second Brain preparation (report-only)
                  +---- manifest export preparation (report-only)
```

The intended public projection contains contracts, policy-conformance logic, synthetic fixtures, and
generic workflows. It contains no raw health records, secrets, live consent,
personal metrics, family data, financial data, or private memory.

## Health runtime

[`@frankx-ai/agentic-health-os`](packages/health/README.md) now provides:

- non-authoritative exact-byte assessments for complete artifact pins from
  `frankxai/health-intelligence-system`; private adapters must verify Git provenance;
- a separately encrypted local-vault boundary that exposes descriptors, not bytes;
- default-deny capability, consent, purpose, sensitivity, and egress policy simulation;
- narrow structured inputs for report-only Second Brain and export validation;
- public preparation methods that return no projection, manifest, approval claim, egress, or transport;
- adversarial cross-tenant, revocation, path, sensitivity, and egress tests.

This is organizational and developer infrastructure. It does not diagnose,
interpret results, recommend treatment or medication changes, or replace a
licensed clinician. Artifact integrity does not establish clinical validity.

## Family research boundary

[`@frankx-ai/agentic-family-os`](packages/family/README.md) accepts only a bounded
opaque reference and returns a non-executable private-adapter plan. It does not
accept or emit people, relationships, evidence, reviewer assertions, genetics,
or tree projections. ALOS orchestration statically denies family/genetic routes
to generic Memory or Creator modules. The
[family research operating system](docs/family-research-operating-system.md) is a
private-adapter design guide, not evidence that those authority controls are
implemented in this public package.

## Public and private products

- **Agentic Life OS** is the public developer/runtime name.
- **Health Intelligence System** is the public evidence, protocol, privacy, and
  clinician-preparation source.
- **Training Intelligence Pack** is a reserved name for a planned bounded movement and
  recovery module; the current code provides only a static training-consistency brief.
- **Vitalis** is held from public health-product use because exact-name AI health and
  health-OS products already operate in the category. It may remain a private memorial
  steward codename inside a private instance.
- **Velora** is held from public fitness-product use and remains reserved for Arcanea's
  established courage/action Executor persona.
- A private instance such as `frankx-life-os` configures the public runtime and
  owns local data. It should not duplicate reusable product code.

Neither held name may appear as a released app, product, marketplace agent, package, or
service without a new qualified legal clearance decision. An agent persona never
becomes an authority boundary: a future reviewed private runtime would grant tools
through authenticated capabilities, current consent, and human approval. The public
runtime only simulates conformance and always denies execution.

## Packages

| Package | Purpose | Maturity |
|---|---|---|
| [`core`](packages/core/README.md) | Strict profile schema and loader | Experimental |
| `business` | Descriptor-only private business-adapter planning | Experimental; no financial payloads |
| `creator` | Descriptor-only private creator-adapter planning | Experimental |
| `memory` | Descriptor-only private memory-adapter planning | Experimental |
| `orchestration` | Composition of non-executable plans and static denials | Experimental |
| `investor` | Descriptor-only private wealth-adapter planning | Experimental; no advice or values |
| [`health`](packages/health/README.md) | Sovereign health boundary and wellness organization | Experimental, safety-gated |
| [`life-sciences-researcher`](packages/life-sciences-researcher/README.md) | Descriptor-only private research-adapter planning | Experimental; no lookup or scientific data |
| [`family`](packages/family/README.md) | Descriptor-only private family-adapter planning | Experimental; no records or projection payloads |

The static [`dashboard`](dashboard/index.html) is a development demonstration,
not a live medical, financial, or operational console. It is read-only, synthetic,
script-free, storage-free, and network-free.

## Version axes

- Workspace runtime version: `package.json` (`0.3.0`).
- Public profile-contract version: `alos-profile.yaml` (`1.4.0`).
- SIP compatibility version: `1.1.1`.
- Generated discovery-asset schema: `1.3.0`.

These identifiers describe different contracts and do not imply a production
health release. Generated assets are checked byte-for-byte against the profile.

## Get started

Requirements: Node.js 24 or newer and pnpm 9.

```bash
# Available only after the approved clean-history public release.
git clone https://github.com/frankxai/agentic-life-os.git
cd agentic-life-os
pnpm install --frozen-lockfile
pnpm check:public
pnpm --filter @frankx-ai/agentic-health-os typecheck
pnpm --filter @frankx-ai/agentic-health-os test
```

TypeScript/Vitest source aliases are development-only. Normal Node package imports
resolve built `dist/index.js` entries; the release build creates those entries,
checks declaration files and package export maps, and smoke-imports every package.

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
- [Family research operating system](docs/family-research-operating-system.md)

The repository is licensed under the [MIT License](LICENSE). Health sources,
books, papers, media, datasets, and imported artifacts retain their own licenses;
the MIT license does not relicense third-party content.
