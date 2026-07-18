# 🏛️ Agentic Life OS (ALOS)

> The unified multi-agent operating system for Business, Creator, Memory, Orchestration, Investor, Health, and Family modules. Built on the Starlight Intelligence Protocol (SIP).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built on SIP](https://img.shields.io/badge/Built%20on-SIP%20v1.1.1-blue.svg)](https://github.com/frankxai/Starlight-Intelligence-System)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%23007ACC.svg)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Active-green.svg)](https://modelcontextprotocol.io/)

---

## 🌌 The Vision & Architecture

ALOS is a master-orchestration framework that connects all aspects of life, business, and creation into a unified cognitive architecture. It operates at the intersection of **capabilities** (what agents can do), **memories** (what agents remember), and **enforcements** (what agents are allowed to do), utilizing a single source of truth configuration.

```
                     ┌────────────────────────────────────────┐
                     │      Starlight Intelligence System     │
                     │          (SIP Memory Substrate)        │
                     └───────────────────┬────────────────────┘
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   ▼                     ▼                     ▼
┌─────────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────────┐
│       agentic-creator-os    │ │  second-brain-os  │ │     agentic-business-os     │
│   (Content, Suno, Workshop) │ │  (Obsidian Vault) │ │  (Corporate Ops, Claim Gate)│
└─────────────────────────────┘ └───────────────────┘ └─────────────────────────────┘
                   ┌─────────────────────┼─────────────────────┐
                   ▼                     ▼                     ▼
┌─────────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────────┐
│      agentic-investor-os    │ │  agentic-health-os│ │      agentic-family-os      │
│  (Sovereign Wealth Fund, DL)│ │(Biomedical, FDA)  │ │ (Genealogy, Heritage Vault) │
└─────────────────────────────┘ └───────────────────┘ └─────────────────────────────┘
                                         ▲
                                         │
                     ┌───────────────────┴────────────────────┐
                     │                  Arcanea               │
                     │         (Orchestration Subsystem)      │
                     └────────────────────────────────────────┘
```

---

## 🏛️ Interconnected Modules & Visions

| Module | Purpose | Status | Stance & Verification |
| :--- | :--- | :--- | :--- |
| **`core`** | **System Configuration:** Core schema rules, Zod models, YAML loaders. | **Active** | Core harness. Health: `vitest run` |
| **`business`** | **Corporate Ops:** Legal compliance, Dutch BV ops (Arcanea Labs BV), claims-guard checks, invoice balances. | **Active** | Billing harness. Health: `vitest run` |
| **`creator`** | **Creative Substrate:** Content compilation pipelines, YouTube drafts, workshops, and asset registries. | **Active** | Creator harness. Health: `vitest run` |
| **`memory`** | **Starlight Memory Palace:** Obsidian vault stubs, semantic vector search, and SIP compliance graph storage. | **Active** | Memory harness. Health: `vitest run` |
| **`orchestration`** | **Control Grid:** Aggregates cashflow to investor portfolio, coordinates health audits and lineage creators. | **Active** | Orchestration harness. Health: `vitest run` |
| **`investor`** | **Sovereign Wealth:** Deals pipeline, capital allocation, valuations, due diligence, and net worth calculations. | **Active** | Wealth harness. Health: `vitest run` |
| **`health`** | **Biomedical Intelligence:** Interfaces scientific databases (ChEMBL, dbSNP, UCSC TFBS, OpenFDA, and AlphaFold). | **Active** | Science gateway. Health: `vitest run` |
| **`family`** | **Private Family Intelligence:** Evidence-backed claims, governed relationship review, audience-scoped ancestor projections, and private research operations. | **Kernel active; vault gated** | Real ingestion remains blocked until encrypted persistence, authentication, durable audit, backup/restore, consent, and succession gates pass. |

---

## 📦 Monorepo Structure

* **[`packages/core`](packages/core/README.md)**: Parses and validates the unified [alos-profile.yaml](alos-profile.yaml) configuration.
* **[`packages/business`](packages/business)**: Manages invoicing status and BV compliance limits.
* **[`packages/creator`](packages/creator)**: Powers script generation and visual media templates.
* **[`packages/memory`](packages/memory)**: Implements Starlight Intelligence Protocol (SIP) semantic nodes.
* **[`packages/orchestration`](packages/orchestration)**: Cross-module pipeline triggers linking cashflow and heritage databases.
* **[`packages/investor`](packages/investor/README.md)**: Sovereign wealth calculations.
* **[`packages/health`](packages/health/README.md)**: Biomedical lookup gateways.
* **[`packages/family`](packages/family/README.md)**: Private evidence-backed family research registry and governed ancestor projections.
* **`Agentic_Ecosystem.canvas`**: Visual whiteboard connecting workspace modules, substrates, agent command wrappers, and science database plugins.
* **`scripts/generate-alos-assets.mjs`**: Compiles discovery sitemaps (`llms.txt`, `agents.json`, and `jsonld.json`).

---

## 🖥️ Local Control Center Dashboard

A premium, glassmorphic visual interface is available directly inside the repository. To access the control center:

1. Open [dashboard/index.html](dashboard/index.html) in your browser.
2. Monitor package health and run bounded synthetic demonstrations. Private family or genetic data is not routed into generic Memory OS or Creator OS; that cross-module path remains fail-closed pending deployment-owned authorization, minimization, audience controls, and audit.

---

## 🛠️ Getting Started

### Prerequisites

* Node.js >= 20
* PNPM 9.x

### Setup

```bash
# Clone the repository
git clone https://github.com/frankxai/agentic-life-os.git
cd agentic-life-os

# Install workspace dependencies
pnpm install

# Build the TS packages & compile discovery formats
pnpm build

# Run unit & integration tests across all packages
pnpm test
```

---

## 📜 License

License status: no repository license file is currently present. Do not represent this repository as open source until a human approves and adds the applicable license.
