# Health Second Brain experience

Status: implementation specification, 2026-09-06. No deployed connector, health-data storage or verified UI is claimed. Extend the existing health package and private adapter boundary; preserve the current script-free dashboard until its replacement passes visual review.

## Experience thesis

Recipient: an adult who wants food, training and recovery to fit a busy life.
Job: understand the current week and choose one manageable adjustment.
Promise: a useful review from the information already available.
Primary action: review this week.
Proof: each observation exposes source, date range, coverage, conflict state and the reason a comparison was withheld.
Desired understanding: “I know what the system knows, what it does not know, and what I chose.”

## Three design directions

| Direction | Composition | Type and color | Interaction | Motion |
|---|---|---|---|---|
| Personal journal | Editorial week narrative with evidence in the margin | Warm neutral, serif headings, clear sans body | Inline disclosure and contextual decisions | None |
| Daily navigator | One next-action panel with a compact weekly review underneath | Existing ALOS dark/mineral palette and available system fallbacks | Bottom navigation on mobile, evidence drawers | At most state confirmation |
| Training log | Dense chronological session and source table | High-contrast mono details and sans labels | Filters and drill-down to observations | None |

Provisional selection: **Daily navigator**, because it extends the existing ALOS tokens while leading with the user's next decision. This selection is not visual approval. Current preview access was blocked by the browser environment, so desktop/mobile before-and-after evidence is pending. The world-class-web-release visual gate remains open; no redesign was implemented in this increment.

## Information architecture

Five destinations: Today, Food & movement, Review, My context, Sources. Care preparation is contextual from Today or My context; it must not compete with everyday wellness as a universal alarm panel.

Today first viewport: current goal; last updated label; one current action; compact “This week's evidence” section. Use actual missing/stale states instead of sample values in live mode. Offer “Adjust”, “Skip this week”, and “Why this?” without punitive streak language.

Review order:
1. Week and source coverage.
2. Observed changes, with values and denominators adjacent.
3. What cannot be concluded.
4. One suggested adjustment, visibly separate from user adoption.
5. The next review and selected private destination.

Food & movement: familiar meals and groceries; existing training plan; time/equipment alternatives; comfortable movement opportunities. Support a useful experience without weights, calories, photos, wearables or quantified goals.

My context: goal, time, preferences, exclusions, equipment and current professional instructions. Show source/date for every retained constraint. “Correct” supersedes a fact, preserving the audit trail. Never infer current medical facts from stale conversation memory.

Sources: per-provider connection, granted scope, last successful import, data window, timezone convention, selected metric authority, import error and revoke controls. Describe credential revocation and record deletion separately.

## UI state contract

| State | Visible text/behavior | Prohibited behavior |
|---|---|---|
| No data | “Start with your routine or one export.” | Fabricated personal baseline |
| Loading | Name the source being read; preserve previous data with its date | Empty charts presented as zero |
| Partial | “Five of seven days recorded.” beside the value | Hidden interpolation |
| Source conflict | “Two sources overlap. Choose one for this comparison.” | Summing steps or averaging vendor scores |
| Conflicting daily values | Exclude that day; show correction option | Silently selecting the nicer result |
| Stale | Last observed date and current review window | “Up to date” from token validity alone |
| Insufficient coverage | “Not enough recorded days to compare.” | Green/red health verdict |
| Revoked | Stop reads; explain retained copies | Automatic reconnection or false deletion claim |
| Care concern | Prepare a concise professional question/timeline | Symptom severity score or reassurance |
| Draft action | “Suggested” and reason | Claim user adopted it |
| Export | Destination and exact fields in preview | Background sharing or public-link default |
| Error | Bounded error with retry; no raw records in logs | Sensitive telemetry |
| Demo | Persistent fictional-data marker | Connected badges or operational controls |

## Mobile and accessibility acceptance

- Support 320, 390, 768 and 1440 CSS-pixel widths with no horizontal overflow.
- Keep primary targets at least 44 by 44 CSS pixels; evidence disclosures remain keyboard accessible.
- Use semantic headings, lists/tables and descriptive controls; visible focus and logical order.
- Body text remains readable at 200% zoom; avoid color-only states and dense chart dependence.
- Provide tabular/text alternatives and visible denominators; no animation required.
- Local fonts or correctly licensed bundled fonts only; verify actual rendered family and contrast.
- Keep implementation language (MCP, scopes, schemas, policy simulator) out of ordinary user flows. Sources may explain permissions in plain language.
- Full navigation, disclosure, missing-data, revoke and export states require browser checks before a production claim.

## Private adapter and ChatGPT handoff

Implement the public HIS workflow contract in a private authenticated adapter. Keep public ALOS preparation non-executable. Derive tenant/subject from auth, resolve opaque IDs internally, check consent/revocation at execution time, and avoid accepting health payloads through generic creator/memory routes.

Proposed data tools: get_context_descriptor, list_source_status, prepare_wellness_review.
Proposed view tool: render_wellness_review.
Proposed action previews: propose_routine_change, prepare_care_brief, preview_export.

No tool is active merely because its name appears here. The renderer must reauthorize the review ID; a valid-looking ID is not access. Export/share requires current destination scope and a reviewed payload. The existing public policy simulator cannot grant that authority.

Canonical product and sources: [HIS Health Second Brain direction](https://github.com/frankxai/health-intelligence-system/blob/c4c11a4dee58ad3112673db398b1c8e57ec04dbb/docs/health-second-brain-product.md). Companion change: https://github.com/frankxai/health-intelligence-system/pull/4. The source link is pinned to the reviewed change rather than assuming it is on main.
