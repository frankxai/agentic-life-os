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
data merely because this runtime can generate a sanitized projection.

## Data flow

1. Versioned public protocols enter through immutable source receipts.
2. Private vault adapters expose metadata descriptors, never raw bytes, to the
   public runtime contract.
3. Capabilities and current consent authorize a bounded purpose and sensitivity.
4. Egress requires an authority-owned policy and exact human approval.
5. Second Brain output is one-way, month-granular, and rejects direct identifiers,
   credentials, local paths, clinical data, and genomic data.
6. Export manifests contain opaque references and hashes; they do not transmit data.

See [the open-core architecture](docs/open-core-architecture.md) and the
[private-instance overlay template](templates/private-instance-overlay/README.md).
