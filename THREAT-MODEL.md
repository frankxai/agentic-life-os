# Threat model

Scope: the public Agentic Life OS runtime and the clean-history projection it exports.
Out of scope: any private instance, its vault, and its authority repository — those are
separate systems this repository deliberately cannot reach.

This document is written to be useful when it is unflattering. Every control below is
marked **implemented**, **partial**, or **not implemented**, and the not-implemented
rows are the honest reason this repository has no public domain attached.

Last reviewed 2026-09-02. Reviewer: internal only. No independent audit has been
performed, and nothing here should be read as a claim that one has.

## Assets

| Asset | Where it lives | Worst case |
|---|---|---|
| Personal records across five domains | Private encrypted vault, never this repo | Disclosure of health, financial, or relationship data |
| Authority records (capability, consent, egress policy, approval) | Private authority store, never this repo | Forged authority produces "consented" exfiltration |
| Git history of this repository | Public on projection | A record committed once ships forever in every clone |
| Domain isolation itself | Kernel code | One agent reaching across the whole of a life |

## Trust boundaries

1. Prompt/agent → runtime. **Untrusted.** A request is an assertion of intent.
2. Runtime → authority store. **Untrusted in public.** The store is caller-supplied.
3. Runtime → record bodies. **No boundary crossing exists.** The kernel handles
   descriptors; there is no public method that accepts or returns a record body.
4. Private repo → public projection. **One-way, allowlist.** See `docs/kernel-vs-packs.md`.

## STRIDE

### Spoofing

| Threat | Control | State |
|---|---|---|
| A request claims an actor it is not | Capability/consent binding on tenant, subject, actor | **implemented** (`capability-binding-mismatch`) |
| A prompt asserts consent inline | Consent is resolved from the store by id, never read from the request | **implemented** |
| A caller supplies a store that says yes to everything | `executionPermitted` is a literal `false`; no code path sets it true | **implemented** as a structural disablement, not as authentication |
| Authenticating the caller at all | — | **not implemented.** The public runtime has no identity layer. This is why it cannot execute. |

### Tampering

| Threat | Control | State |
|---|---|---|
| Approval reused for a different operation | Approval binds to a canonical `operationDigest` over fixed fields | **implemented** |
| Approval reused for a different payload | Approval binds to `payloadDigest`; mismatch blocks | **implemented** |
| Request under-declares resource sensitivity | Kernel resolves the descriptor and compares rungs | **implemented** (`resource-sensitivity-understated`) |
| Approval consumed twice concurrently | Single-use atomic claim across processes | **not implemented.** Requires a durable transactional store. A private adapter must do this; the public interface is not evidence that any adapter does. |
| Digest strength | `operationDigest` is a canonical join, not a cryptographic commitment | **partial.** Adequate for binding-shape checks, not a signature. A signed approval is a private-adapter concern. |

### Repudiation

| Threat | Control | State |
|---|---|---|
| No record of what was decided | Decisions are deterministic and reproducible from request + store + instant | **partial.** Reproducible, but nothing is persisted; there is no audit log. |
| Tamper-evident audit trail | — | **not implemented.** |

### Information disclosure

| Threat | Control | State |
|---|---|---|
| A record body reaches a public surface | Kernel handles descriptors only; projection is an allowlist | **implemented**, with a leak eval over all five domains |
| A denial message reveals what was asked for | Block codes are a closed enum; no caller data is echoed | **implemented** |
| An identifier in a projection is subject-linkable | Projection carries counts and enums only; the leak eval treats every fixture id as forbidden | **implemented** |
| A record sits in git history from an old commit | `scripts/scan-history-personal-data.mjs` over every blob on every ref | **partial.** Detection only. It cannot rewrite history, and its patterns are shape heuristics that need human review. |
| Timing or error-shape side channels | — | **not implemented.** Not analysed. |

### Denial of service

| Threat | Control | State |
|---|---|---|
| A malformed request crashes evaluation | Well-formedness check returns `invalid-request` without touching the store | **implemented** |
| Unbounded input | Core schemas bound identifier and text lengths | **partial.** The authority kernel does not itself bound field lengths. |
| Resource exhaustion under load | — | **not implemented.** No rate limiting; there is no server. |

### Elevation of privilege

| Threat | Control | State |
|---|---|---|
| **A finance agent reads a health record** | Domain on every record, resolved descriptor compared to request domain | **implemented.** Asserted across the full 5x5 matrix. |
| A grant from one domain replayed in another | `capability-cross-domain`, `consent-cross-domain`, `egress-policy-cross-domain`, `human-approval-cross-domain` | **implemented** |
| A pack widens a kernel decision | No override exists in the API surface | **implemented** by construction |
| A grant minted above a pack's ceiling | Ceiling checked before grants are consulted | **implemented** |
| Cross-tenant or cross-subject access | Tenant and subject compared on both the grant and the resolved resource | **implemented** |

## What is deliberately not built

- **Execution.** Nothing in this repository performs egress, transport, or a write to a
  personal record. Preparation methods return report-only results.
- **Authority bootstrap.** There is no code that mints a first capability.
- **Identity.** No authentication, no session, no key management.
- **Storage.** No database, no vault, no cache.

Each of these is absent because building it half-way is worse than not building it: a
runtime that executes on unauthenticated authority is a exfiltration tool with a
consent-shaped UI.

## Preconditions for any public product surface

None of these are met today. This is the gate, not a roadmap.

1. Independent security review of the kernel and any private adapter.
2. Export and deletion, demonstrated end to end on a real instance.
3. A consent record a person can read, revoke, and see the effect of revoking.
4. Succession: a documented, tested path for what happens to the data when the subject
   cannot operate the system.
5. Incident response: a named owner, a disclosure route (`SECURITY.md`), and a rehearsed
   containment step for a leaked vault or a leaked authority record.
6. `scripts/scan-history-personal-data.mjs` clean on `--all`, reviewed by a person.

## Residual risk accepted today

The repository is private, has no domain, holds no real personal data, and cannot
execute. That combination is what makes the not-implemented rows above tolerable. Any
one of those four changing re-opens this document before anything ships.
