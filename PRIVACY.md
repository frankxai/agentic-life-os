# Privacy boundary

The public Agentic Life OS repository contains reusable code, schemas, generic
templates, and synthetic tests. It is not a health-record store and it does not
collect telemetry by default.

## Keep outside Git

- medical records, scans, labs, prescriptions, genomic files, and wearable exports;
- names, dates of birth, addresses, patient identifiers, contact details, and account IDs;
- API keys, OAuth tokens, recovery keys, encryption keys, and `.env` files;
- private Second Brain vaults, exports, backups, and practitioner case notes.

Use a separately encrypted local vault for raw records. Keep its key outside the
vault and outside Git. Backups should be encrypted client-side and restore-tested.
Cloud sync, Notion, or a hosted dashboard does not become suitable for sensitive
data merely because a future reviewed private adapter may generate a sanitized projection.

## Required future private-adapter flow

The current public methods simulate policy and validate narrow structured inputs.
They produce no Second Brain projection, export manifest, approval claim, or
transport. A future private adapter may implement the following flow only after
independent privacy and security review:

1. Versioned public protocols enter through immutable source receipts.
2. Private vault adapters expose metadata descriptors, never raw bytes, to the
   public runtime contract.
3. Capabilities and current consent would authorize a bounded purpose and sensitivity.
4. Egress would require an authority-owned policy and exact human approval.
5. Second Brain output would be one-way, month-granular, and reject direct identifiers,
   credentials, local paths, clinical data, and genomic data.
6. Export manifests would contain opaque references and hashes and would not themselves transmit data.

See [the open-core architecture](docs/open-core-architecture.md) and the
[private-instance overlay template](templates/private-instance-overlay/README.md).
