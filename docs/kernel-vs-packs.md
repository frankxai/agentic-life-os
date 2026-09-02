# Kernel versus domain packs

The question this document settles: when a new capability arrives, does it go in the
kernel or in a pack? Getting it wrong in one direction produces five copies of the
same admission logic drifting apart; in the other, a kernel that knows what a lab
result is.

## The rule

**Kernel** owns everything that must be identical across every part of a life, and
nothing else. A rule belongs in the kernel when weakening it in one domain would
weaken it in all of them.

**Packs** own vocabulary and workflow. A pack knows what a clinician handoff is, what
a tax packet is, what a follow-up plan is. The kernel knows only that some pack
declared an action string and a sensitivity rung.

The load-bearing consequence: **a pack cannot widen a kernel decision.** There is no
override, no escape hatch, no `allowCrossDomain` flag. A pack that needs the kernel to
say yes where it currently says no is a kernel change with a new eval, reviewed as
such.

## What is kernel

`packages/core/src/authority/`

| Concern | Why it cannot live in a pack |
|---|---|
| `AuthorityStore.v1` record shapes | Five shapes drifting apart is five different definitions of consent |
| The five-domain enum | A domain that can be added by configuration is a boundary that can be removed by configuration |
| The sensitivity ladder | Comparing rungs requires one ladder; per-pack ladders are incomparable |
| Cross-domain admission (`simulateAdmission`) | The rule exists precisely to constrain packs, so packs cannot own it |
| Validity, revocation, binding, approval-to-payload | A pack that got expiry subtly wrong would fail open and look fine |
| Public projection allowlist | An allowlist assembled from pack contributions is a redaction pass wearing a costume |

## What is a pack

`packages/health`, `packages/family`, `packages/business`, `packages/creator`,
`packages/investor`, `packages/coaching`, `packages/memory`, `packages/orchestration`,
`packages/life-sciences-researcher`

A pack declares a `DomainPackDescriptor` — its actions, purposes, destinations, and a
sensitivity ceiling — and implements the workflow behind them. It maps its own richer
vocabulary onto the kernel ladder: the health pack's `clinical` and `genomic` both sit
on `restricted`; `personal` sits on `personal`. The kernel never learns what `genomic`
means, only that it is the top rung and cannot leave the domain.

The ceiling is a pack's own upper bound and is checked *before* grants are consulted,
so a pack cannot be talked past its ceiling by a grant that was minted too widely.

## The health pack is prior art, not a fork

`packages/health/src/sovereign-contracts.ts` and `sovereign-health-runtime.ts` already
implement a deterministic, fail-closed, report-only policy simulator for one domain.
The kernel is that design generalised, with two additions a single-domain runtime had
nowhere to put:

1. `domain` on every record and request, so an authority record minted for one part of
   a life cannot be replayed against another.
2. Resources as descriptors the kernel resolves itself, rather than resource ids the
   request asserts, so the domain of the thing being touched is not caller-controlled.

**Migration rule.** The health pack is not rewritten in place. It keeps its own
vocabulary and its own tests; when it adopts the kernel it does so by mapping
`HealthAction` and `HealthSensitivity` onto the kernel types and delegating admission,
with its existing tests kept green as the compatibility evidence. Until that happens
the two coexist, and this document is the statement that they are one design at two
scopes — not two competing ones. That migration is the next kernel decision, and it is
sequenced after independent review, not before.

## Authority store

The kernel defines the interface and consumes a caller-supplied snapshot. It does not
define storage, and it never bootstraps durable authority. `AuthorityStore` in the
public runtime is a *simulation input*: a caller can construct one that says yes to
everything, which is exactly why every decision carries `executionPermitted: false`
and `authoritative: false` with no code path that sets either true.

A private adapter is what makes authority real, and it must, in one transaction:
re-resolve capability, consent, egress policy and approval from server-owned state;
claim each approval exactly once, durably, across processes; and revalidate revocation
inside the same transaction. None of that is implemented here. See `THREAT-MODEL.md`.

## Public projection

`projectDecision` and `projectDomain` are allowlists. A field reaches the public side
because it is named in the projection type, never because a scrubber failed to
recognise it. Redaction fails open on the field nobody thought of; an allowlist fails
closed on it. `findLeakedSubstrings` is the independent check, and
`packages/core/tests/public-projection-leak.test.ts` runs it over all five domains
including a case asserting that the *unprojected* object does leak — an eval that
cannot fail is not an eval.

## Plugin adapters

Not implemented, and deliberately unscoped until the kernel is reviewed. When they
arrive, the constraint is already fixed by the above: an adapter is a pack, it declares
a descriptor, and it cannot widen a kernel decision. An adapter that needs raw record
bytes is not an adapter to this runtime.

## Adding a domain

1. Add it to `ALOS_DOMAINS`. This is a kernel change.
2. Add a fixture in `authority/fixtures.ts`; the isolation matrix grows to 6x6 on its own.
3. Add the pack with its descriptor and ceiling.
4. `assertCompleteDomainCoverage` will fail until the public projection covers it.
