# LiveOS Command Contract

The command registry and parser live in `packages/practice/src/liveos-registry.ts`. It is the one source for dashboard route, scope, safety boundary, input hint, output, and approval requirement. `parseLiveOSCommand()` and `createLiveOSActionRequest()` let coding-agent adapters use the exact same command vocabulary as the dashboard.

| Command | Product result | Boundary |
|---|---|---|
| `/liveos today` | One focus and a bounded practice plan | No calendar or task mutation |
| `/liveos practice` | A source-aware private session and reflection prompt | No spiritual authority claim |
| `/liveos body` | Self-reported observation record | No diagnosis or treatment advice |
| `/liveos fitness` | Session log and recovery reflection | No rehabilitation or medical prescription |
| `/liveos health-prep` | Clinician-question or record-preparation packet | Explicit review; no diagnosis, medication, treatment, or triage |
| `/liveos learn` | Sourced learning trace and next question | Separate source-backed claims from reflection |
| `/liveos palace` | Evidence-linked memory anchor | No raw-vault duplication |
| `/liveos weekly` | Proposed next commitment | Requires user confirmation before applying changes |

Runner-specific adapters for Codex, Claude-compatible commands, HTML documentation, and a public starter must be generated from this registry rather than copy-pasted.
