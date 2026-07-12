# LiveOS Architecture

## Boundaries

| Layer | Owns | Does not own |
|---|---|---|
| ALOS core | Contract schemas, module registry, action/receipt semantics | Personal-data authority or global authentication |
| Practice package | Today, practice, body, fitness, learning, review, source-aware spiritual packs | Medical advice or religious authority |
| Memory adapter | References, provenance, scoped recall requests | A duplicated raw private vault |
| Health adapter | Private health preparation and clinician-question routing | Diagnosis, treatment, medication, or urgent triage |
| Sync package | Ciphertext envelope and conflict contract | Encryption implementation, keys, accounts, or a hosted service |
| LiveOS app | Product loop and local interaction | A second orchestration implementation |

## Action model

Every client produces an `ActionRequest`; every route returns an `ActionReceipt` and optional `EvidenceRef` values.

```text
/liveos command or dashboard interaction
  → ActionRequest
  → policy and consent check
  → module adapter
  → ActionReceipt + EvidenceRef
  → derived LifeOverview
```

`read`, `plan`, and `propose` modes are non-destructive. `apply`, health preparation, and anything that could affect an external system require explicit user confirmation.

## Data posture

- The current browser app keeps prototype inputs in session memory only; it does not persist or synchronize personal records.
- The current Body file picker captures only filename/size metadata as a local reference. It does not read, parse, retain, or upload file contents.
- A future local vault is intended to be the raw-data source of truth, but it is not implemented by this foundation.
- A future sync service accepts only validated ciphertext envelopes. It cannot become a storage authority for raw reflections, health artifacts, or Palace content.
- Public starter fixtures use synthetic, clearly labelled example data only.
