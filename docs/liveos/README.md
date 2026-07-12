# Agentic Life OS LiveOS Foundation

This folder describes the private, privacy-first LiveOS foundation implemented inside `agentic-life-os`. The current app keeps its prototype state only in browser memory; a durable local vault is a separately gated next step.

## First useful loop

```text
intention → practice → observation → reflection → Palace anchor → review
```

The loop produces an action receipt and an evidence-linked memory anchor. It does not create calendar events, modify external systems, diagnose health concerns, or sync raw private data.

## What exists now

- `packages/core/src/liveos.ts`: portable data and action contracts.
- `packages/practice`: command registry, module registry, source-aware practice packs, and receipt generation.
- `packages/sync`: local-only ciphertext-envelope boundary and conflict semantics.
- `apps/liveos`: a Next.js cockpit with Today/Practice, Body, Fitness, Health preparation, Intellectual, Palace, and Review workspaces. All current entries are in-browser only.
- Body file intake records only a local filename/size reference in the current session; it never reads, parses, persists, or uploads file contents.

## What remains gated

- Workspace dependency installation and lockfile synchronization.
- A durable local vault, encrypted-at-rest implementation, or import pipeline.
- Build, desktop/mobile inspection, and visual score.
- A cryptographic implementation, account model, device pairing, or remote ciphertext store.
- FrankX public education and starter publishing, which requires its own route ownership and public-safety pass.

## Read next

- [`architecture.md`](architecture.md)
- [`command-contract.md`](command-contract.md)
- [`sync-beta-gate.md`](sync-beta-gate.md)
- [`scene-brief.md`](scene-brief.md)
