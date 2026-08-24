# Private instance overlay template

Copy this directory into a new **private** configuration repository only after
the repository and name have been approved. `frankx-life-os` is the suggested
instance name; it should contain configuration and sanitized operational notes,
not reusable product code.

## Recommended layout

```text
frankx-life-os/
  overlay.json
  policies/               # identifiers and scopes; no secrets
  agents/                 # enabled public agent IDs and local preferences
  projections/            # sanitized summaries only, if intentionally tracked
  .local/                 # ignored runtime state
  vault/                  # ignored encrypted vault mount or pointer
  exports/                # ignored generated handoffs
  backups/                # ignored local backup receipts
```

Start from `overlay.example.json` and rename it to `overlay.json`. Inject the
vault root, credentials, and encryption material at runtime. Do not put them in
the JSON file.

The overlay is not authority. A private runtime must store current capabilities,
consent, egress policies, human approvals, and revocation state in an authenticated
local authority repository.
