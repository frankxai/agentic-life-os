# @frankx-ai/agentic-health-os

Sovereign health-data boundary and wellness-organization package for Agentic Life OS.

The package has two deliberately separate surfaces:

1. `AgenticHealthOS` creates conservative wellness briefs and clinician-handoff
   preparation. It does not provide medical advice.
2. `PublicHealthPolicySimulator` evaluates caller-supplied policy snapshots as a
   non-authoritative conformance report. It cannot authorize or produce egress.

## Public Health Intelligence System bridge

`assessPublicHisArtifactPin` compares bytes with a complete pin for the canonical
`frankxai/health-intelligence-system` repository:

- an immutable Git commit;
- an explicit semantic version;
- a normalized repository-relative path;
- media type and byte length;
- SHA-256;
- a deterministic pin digest.

The assessment is always marked non-authoritative. It can detect altered bytes,
but public code cannot prove that a caller-authored commit/path exists or accept
the artifact. A private authenticated ingestion adapter must resolve the exact Git
tree/blob against an approved release manifest before accepting the artifact.
Integrity does not establish evidence quality, clinical validity, currency, or
applicability to a person.

## Private vault boundary

`EncryptedLocalHealthVault` exposes `HealthRecordDescriptor` values only. The
public contract has no method for decrypted bytes and no raw-path field. A private
instance owns the encrypted vault, key management, backup, and restore process.

## Policy simulation, not authority

The simulator checks whether a supplied snapshot is internally consistent across:

- capability: tenant, subject, actor, action, purpose, and sensitivity;
- matching current consent;
- hard destination sensitivity ceiling;
- matching current egress policy;
- matching current human approval bound to both the operation digest and the
  canonical normalized payload digest.

Missing, expired, revoked, malformed, cross-tenant, or out-of-scope records fail
the simulation. Every result is marked `authorityStatus:
unverified-policy-simulation` and `executionPermitted: false`.

The public package does not ship or bootstrap a production authority database.
Prompts, files, personas, and caller-authored callbacks cannot become authority.
A future private implementation needs authenticated server-owned configuration,
an authority-owned clock, durable revocation, and atomic single-use approval
claims before any execution path exists.

## Egress

- Second Brain planning accepts only fixed, structured monthly wellness-pattern
  enums. It accepts no title, summary, source-record digest, genomic field, or
  caller-authored sensitivity.
- Internal export validation accepts descriptor metadata only and checks a
  bounded opaque-reference syntax. Syntax does not prove private minting or
  authority, and the payload/digest builders are not public exports.
- Public preparation methods always return `public-runtime-report-only`; they do
  not claim approvals, create projections/manifests, or perform transport.
- Caller-supplied citation notes expose `claimedStance` plus
  `claimStatus: unverified-caller-supplied`; they never mint evidence quality.

## Safety stance

- No diagnosis or reassurance.
- No lab, pathology, imaging, biomarker, or genetic interpretation.
- No medication, supplement, dose, treatment, or delay recommendations.
- No replacement for licensed clinicians, emergency care, or care-team instructions.
- The public biomedical boundary performs no lookup and returns no scientific data.

## Focused verification

```bash
pnpm --filter @frankx-ai/agentic-health-os typecheck
pnpm --filter @frankx-ai/agentic-health-os test
```
