# Agentic Life OS open-core architecture

Agentic Life OS is the public, reusable runtime. A private instance such as
`frankx-life-os` is configuration and operation, not a fork containing new
product logic.

| Layer | Public Agentic Life OS | Private configuration overlay | External private runtime/store |
|---|---|---|---|
| Runtime | Schemas, policy simulation, agent contracts, non-executable plans | Enabled public roles and local policy identifiers | Authenticated adapter composition |
| Health knowledge | Versioned references to public Health Intelligence System artifacts | Locally reviewed source identifiers and notes | Provenance-verified artifact cache |
| Data | Synthetic examples and opaque descriptors only | Pointers and sanitized configuration only | Encrypted records, wearables, journals, and private indexes |
| Authority | Non-authoritative snapshot interfaces and fail-closed simulation | None; the overlay is not authority | Authenticated grants, consent, approvals, revocation, and bootstrap trust |
| Memory | Fixed-enum wellness preparation; no free text or transport | Destination and retention policy identifiers | Private Second Brain adapter and sanitizer |
| Secrets | None | References only | Local secret manager or environment injection; never Git |

## Health bridge

The health bridge can compare bytes with a complete pin for the public
`frankxai/health-intelligence-system` repository. The result is explicitly
non-authoritative: public code cannot prove that a caller-authored commit/path
exists. A private authenticated adapter must resolve the exact Git tree/blob
against an approved release manifest. Byte integrity does not prove that a claim
is correct, current, applicable, or safe.

Private records stay behind `EncryptedLocalHealthVault`. Its public interface
returns descriptors only. No public runtime method accepts a raw record path or
returns decrypted bytes.

## Report-only policy simulation

The public simulator checks a caller-supplied snapshot for:

1. capability binding: tenant, subject, actor, action, purpose, sensitivity;
2. current consent with the same binding and scope;
3. hard destination sensitivity ceiling;
4. current egress policy for the exact destination;
5. current human approval bound to the operation and exact canonical payload;
6. exact payload binding where an egress simulation requires approval.

Missing, malformed, expired, revoked, cross-tenant, or scope-mismatched records
fail the simulation. Every result is non-authoritative and sets
`executionPermitted: false`. Prompts and request payloads cannot grant authority.

The public package does not bootstrap durable authority. A future private adapter
must use authenticated server-owned configuration, claim approvals uniquely across
processes, and revalidate capability, consent, egress policy, and revocation inside
one transaction. Until that implementation is independently reviewed, real egress
remains structurally disabled.

## Safe egress

- Second Brain: fixed-enum monthly wellness-pattern draft only; no free text,
  source-record hashes, identifiers, clinical data, or genomic fields.
- Clinician handoff: descriptor-only internal manifest validation with
  syntax-checked opaque record references; syntax is not authority.
- Encrypted local export: the same report-only draft boundary; no bytes or transport.

Public preparation methods always return `public-runtime-report-only`. A future
private adapter must re-check the manifest, human destination, encrypted bytes,
and current revocation state before transport.

## Product split

- **Agentic Life OS**: public developer/runtime name.
- **Health Intelligence System**: public evidence, protocol, privacy, and clinician-prep source.
- **Training Intelligence Pack**: reserved name for a planned bounded movement and
  recovery module. Current code implements only a static training-consistency brief.
- **Vitalis**: private memorial steward codename only; naked public health-product use is
  held after a collision screen found exact-name AI health and health-OS products.
- **Velora**: reserved for Arcanea's established courage/action Executor and held from
  public fitness-product use after exact-category collisions were found.
- **Private instance**: one private configuration repository, not a repo per life domain.
