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
| **`business`** | **Corporate Ops:** Legal compliance, Dutch BV ops (Arcanea Labs BV), claims-guard pre-publish checks. | **Live** | Strong harness. Health: `pnpm test` |
| **`creator`** | **Creative Substrate:** Content compilation pipelines, workshops OS, visual assets design, and Suno AI prompts. | **Live** | Product harness. Health: `pnpm test` |
| **`memory`** | **Double-Vault Ingestion:** Summarizes chats in a private Obsidian vault and outputs non-sensitive stubs to the public index. | **Live** | Private. Health: `pytest -v` |
| **`orchestration`** | **Control Grid:** Manages package dependencies, ZSH/PowerShell toolkits, and cross-agent launch aliases. | **Live** | Tooling harness. Health: `pnpm run ops:health` |
| **`investor`** | **Sovereign Wealth:** Deals pipeline, capital allocation, valuations, due diligence, and target tracking. | **WIP** | Private. Health: `vitest run` |
| **`health`** | **Biomedical Intelligence:** Interfaces scientific databases (ChEMBL, dbSNP, UCSC TFBS, OpenFDA, and AlphaFold). | **WIP** | Private. Health: `vitest run` |
| **`family`** | **Heritage Vault:** Lineage charts, life story transcripts, diary nodes, and family tree compilation. | **WIP** | Private. Health: `vitest run` |

---

## 📦 Monorepo Structure

* **[`packages/core`](file:///C:/Users/frank/agentic-life-os/packages/core/README.md)**: Parses and validates the unified [alos-profile.yaml](file:///C:/Users/frank/agentic-life-os/alos-profile.yaml) configuration.
* **[`packages/investor`](file:///C:/Users/frank/agentic-life-os/packages/investor/README.md)**: Bootstrapped sovereign capital allocator tracking valuation pipelines.
* **[`packages/health`](file:///C:/Users/frank/agentic-life-os/packages/health/README.md)**: A scientific gateway wrapper routing variant analysis, trial metadata, and chemical assays.
* **[`packages/family`](file:///C:/Users/frank/agentic-life-os/packages/family/README.md)**: Genealogy manager generating family lineage charts.
* **`scripts/generate-alos-assets.mjs`**: Compiles discovery outputs (`llms.txt`, `agents.json`, and `jsonld.json`) on builds.

---

## 🛠️ Getting Started

### Prerequisites

* Node.js >= 24
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

# Run unit tests across packages
pnpm test
```

---

## 📜 License

MIT License — see the [LICENSE](file:///C:/Users/frank/agentic-life-os/LICENSE) file for details.
