# Agentic Life OS open-core architecture

Agentic Life OS is the public, reusable runtime. A private instance such as
`frankx-life-os` is configuration and operation, not a fork containing new
product logic.

| Layer | Public Agentic Life OS | Private instance |
|---|---|---|
| Runtime | Schemas, admission logic, agent contracts, safe manifests | Enabled modules and local policy selections |
| Health knowledge | Versioned references to public Health Intelligence System artifacts | Locally reviewed source selections and notes |
| Data | Synthetic fixtures and opaque descriptors | Encrypted records, wearables, journals, and private indexes |
| Authority | Interfaces and fail-closed policy engine | Authenticated grants, consent, approvals, and revocation state |
| Memory | One-way sanitized projection contract | Private Second Brain destination and retention rules |
| Secrets | None | Local secret manager or environment injection; never Git |

## Health bridge

The health bridge accepts public `frankxai/health-intelligence-system` artifacts
only when a receipt binds their repository, immutable commit, semantic version,
repository-relative path, byte length, and SHA-256. This proves provenance and
integrity; it does not prove that a claim is correct, current, applicable, or safe.

Private records stay behind `EncryptedLocalHealthVault`. Its public interface
returns descriptors only. No public runtime method accepts a raw record path or
returns decrypted bytes.

## Runtime authority

Every protected operation is admitted against current authority-owned records:

1. capability binding: tenant, subject, actor, action, purpose, sensitivity;
2. current consent with the same binding and scope;
3. hard destination sensitivity ceiling;
4. current egress policy for the exact destination;
5. current human approval bound to the operation and exact canonical payload;
6. an atomic, durable, single-use approval claim before output preparation.

Missing, malformed, expired, revoked, cross-tenant, or scope-mismatched records
deny the operation. Prompts and request payloads cannot grant authority.

The reference runtime intentionally leaves durable authority storage to the private
instance. That adapter must claim approvals uniquely across processes and revalidate
capability, consent, egress policy, and approval revocation inside one transaction.
Until such an adapter is independently reviewed, real egress remains disabled.

## Safe egress

- Second Brain: public or personal summaries only; month precision; no direct
  identifiers, credentials, local paths, raw records, clinical data, or genomic data.
- Clinician handoff: manifest-only preparation up to clinical sensitivity.
- Encrypted local export: manifest-only preparation up to genomic sensitivity.

Transport is intentionally absent. A private adapter must re-check the manifest,
human destination, encrypted bytes, and current revocation state before transport.

## Product split

- **Agentic Life OS**: public developer/runtime name.
- **Health Intelligence System**: public evidence, protocol, privacy, and clinician-prep source.
- **Training Intelligence Pack**: descriptive public movement and recovery module that
  consumes the same runtime without becoming a separate private-data silo.
- **Vitalis**: private memorial steward codename only; naked public health-product use is
  held after a collision screen found exact-name AI health and health-OS products.
- **Velora**: reserved for Arcanea's established courage/action Executor and held from
  public fitness-product use after exact-category collisions were found.
- **Private instance**: one private configuration repository, not a repo per life domain.
