# Encrypted Projection Sync Beta Gate

## Current state

`packages/sync` is a local-only boundary. It validates opaque ciphertext envelopes and forces user review for concurrent revisions. It does not encrypt, decrypt, authenticate, pair devices, or contact a remote service.

## Required before beta

1. A reviewed threat model that names attacker assumptions, metadata exposure, offline behavior, deletion, backup, and recovery risks.
2. User-owned passphrase-derived keys plus a documented offline recovery kit.
3. Independent review of the implementation and no custom cryptography.
4. A ciphertext-only server contract, opaque identifiers, rate limits, audit logs without payloads, and a full deletion/rollback path.
5. Device-pairing consent, conflict UI, and explicit user approval before a projection leaves the local vault.
6. Cost/owner/rollback record in the cross-repo work ledger before any database, storage, or always-on service is added.

## Prohibited

- Uploading raw reflections, health records, body data, or Palace notes.
- Server-side decryption.
- Silent background sync.
- Reusing personal-health data for public demos, analytics, or agent training.
