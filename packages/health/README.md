# @frankx-ai/agentic-health-os

Sovereign health-data boundary and wellness-organization package for Agentic Life OS.

The package has two deliberately separate surfaces:

1. `AgenticHealthOS` creates conservative wellness briefs and clinician-handoff
   preparation. It does not provide medical advice.
2. `SovereignHealthRuntime` governs access to private health descriptors and
   prepares sanitized projections or manifest-only exports.

## Public Health Intelligence System bridge

`createPublicHisArtifactReceipt` accepts bytes only from the canonical public
`frankxai/health-intelligence-system` identity and binds them to:

- an immutable Git commit;
- an explicit semantic version;
- a normalized repository-relative path;
- media type and byte length;
- SHA-256;
- a deterministic receipt ID.

`verifyPublicHisArtifactBytes` detects altered bytes or receipt metadata.
Provenance and integrity do not establish evidence quality, clinical validity,
currency, or applicability to a person.

## Private vault boundary

`EncryptedLocalHealthVault` exposes `HealthRecordDescriptor` values only. The
public contract has no method for decrypted bytes and no raw-path field. A private
instance owns the encrypted vault, key management, backup, and restore process.

## Admission

Every protected operation re-resolves authority state at operation time:

- capability: tenant, subject, actor, action, purpose, and sensitivity;
- matching current consent;
- hard destination sensitivity ceiling;
- matching current egress policy;
- matching current human approval bound to both the operation digest and the
  canonical normalized payload digest;
- an atomic, durable, single-use approval claim before a projection or export
  manifest is returned.

Missing, expired, revoked, malformed, cross-tenant, or out-of-scope records deny
the operation. Prompts, serialized request fields, and agent personas do not grant
authority.

The public package defines the authority contract; it does not ship a production
authority database. A real adapter must enforce a cross-process unique claim and
revalidate capability, consent, policy, and approval revocation in the same
transaction. An in-memory adapter is suitable only for synthetic tests.

## Egress

- Second Brain projections are one-way, month-granular, public/personal only,
  hash-bound, and reject direct identifiers, credentials, and local paths.
- Clinician exports are manifest-only and capped at clinical sensitivity.
- Encrypted local exports are manifest-only and may be explicitly approved for
  genomic sensitivity.
- The runtime performs no transport and includes no raw bytes in a manifest.

## Safety stance

- No diagnosis or reassurance.
- No lab, pathology, imaging, biomarker, or genetic interpretation.
- No medication, supplement, dose, treatment, or delay recommendations.
- No replacement for licensed clinicians, emergency care, or care-team instructions.
- Biomedical gateway fixtures are synthetic research examples, not medical truth.

## Focused verification

```bash
pnpm --filter @frankx-ai/agentic-health-os typecheck
pnpm --filter @frankx-ai/agentic-health-os test
```
