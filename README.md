# 🏛️ Agentic Life OS (ALOS)

> The private multi-agent operating system for Business, Creator, Memory, Orchestration, Investor, Health, Life Sciences Research, and Family modules. Built on the Starlight Intelligence Protocol (SIP).

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
│  (Sovereign Wealth Fund, DL)│ │(Personal Health)  │ │ (Genealogy, Heritage Vault) │
└─────────────────────────────┘ └───────────────────┘ └─────────────────────────────┘
                              ┌───────────────────────┐
                              │ life-sciences-        │
                              │ researcher-is         │
                              │ (Research Only)       │
                              └───────────────────────┘
                                         ▲
                                         │
                     ┌───────────────────┴────────────────────┐
                     │                  Arcanea               │
                     │         (Orchestration Subsystem)      │
                     └────────────────────────────────────────┘
```

---

## Ultimate Offering Spine

The current packaging map lives in [`docs/ultimate-offering-spine.md`](docs/ultimate-offering-spine.md). It defines the master offer, public/private boundary, intelligence-system substrate, repo lanes, operating loops, swarm lanes, validation gates, and next execution wave.

The machine-readable source is [`alos-profile.yaml`](alos-profile.yaml). `pnpm build` regenerates [`llms.txt`](llms.txt), [`agents.json`](agents.json), and [`jsonld.json`](jsonld.json) from that profile.

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
| **`health`** | **Agentic Health OS:** Private personal-health loops for nutrition, training, sleep, recovery, records, clinician handoff, and protocol packets. | **Active** | Safety-gated personal health harness. Health: `vitest run` |
| **`lifeSciencesResearcher`** | **Life Sciences Researcher IS:** Research-only gateway for biomedical databases and literature. | **Active** | Research envelope harness. Health: `vitest run` |
| **`family`** | **Heritage Vault:** Lineage charts, genealogy timelines, and family tree compilation. | **Active** | Family harness. Health: `vitest run` |

---

## 📦 Monorepo Structure

* **[`packages/core`](file:///C:/Users/frank/agentic-life-os/packages/core/README.md)**: Parses and validates the unified [alos-profile.yaml](file:///C:/Users/frank/agentic-life-os/alos-profile.yaml) configuration.
* **[`packages/business`](file:///C:/Users/frank/agentic-life-os/packages/business)**: Manages invoicing status and BV compliance limits.
* **[`packages/creator`](file:///C:/Users/frank/agentic-life-os/packages/creator)**: Powers script generation and visual media templates.
* **[`packages/memory`](file:///C:/Users/frank/agentic-life-os/packages/memory)**: Implements Starlight Intelligence Protocol (SIP) semantic nodes.
* **[`packages/orchestration`](file:///C:/Users/frank/agentic-life-os/packages/orchestration)**: Cross-module pipeline triggers linking cashflow and heritage databases.
* **[`packages/investor`](file:///C:/Users/frank/agentic-life-os/packages/investor/README.md)**: Sovereign wealth calculations.
* **[`packages/health`](file:///C:/Users/frank/starlight/repos/agentic-life-os/packages/health/README.md)**: Private Agentic Health OS for personal health workflows.
* **[`packages/life-sciences-researcher`](file:///C:/Users/frank/starlight/repos/agentic-life-os/packages/life-sciences-researcher/README.md)**: Research-only biomedical lookup gateway.
* **[`packages/family`](file:///C:/Users/frank/agentic-life-os/packages/family/README.md)**: Genealogy lineage compiler.
* **`Agentic_Ecosystem.canvas`**: Visual whiteboard connecting workspace modules, substrates, agent command wrappers, and science database plugins.
* **`scripts/generate-alos-assets.mjs`**: Compiles discovery sitemaps (`llms.txt`, `agents.json`, and `jsonld.json`).

---

## 🖥️ Local Control Center Dashboard

A premium, glassmorphic visual interface is available directly inside the repository. To access the control center:

1. Open [dashboard/index.html](file:///C:/Users/frank/agentic-life-os/dashboard/index.html) in your browser.
2. Monitor all 8 active packages, run real-time net worth calculations, query search nodes in the Starlight Memory Palace, and compile automated creator draft outlines from family nodes.

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

MIT License — see the [LICENSE](file:///C:/Users/frank/agentic-life-os/LICENSE) file for details.
