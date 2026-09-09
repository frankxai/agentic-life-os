# Follow-through review

Status: bounded reference implementation; no persistence, agent transport, authorization or live coaching service.

The first useful act is a reviewed next step after a chosen commitment. The system asks what happened, accepts completion or adaptation, and uses only a person's reported obstacle to suggest a question. An unknown outcome stays unknown.

## Method

1. Choose: name a personally meaningful commitment.
2. Prepare: specify an opportunity, resources, completion criterion and fallback.
3. Act: use the opportunity; an appropriate adaptation is legitimate.
4. Observe: record what happened separately from the story added to it.
5. Adjust: choose one change, pause or close the goal.

Optional framing can explore chosen identity, vision and a concrete future scene. It must not assign an identity, infer an unconscious motive or calculate a subconscious score.

## Current implementation

`reviewFollowThrough` in `packages/coaching/src/follow-through.ts` accepts five synthetic enum fields. It returns only a template ID and constant review boundaries. Additional fields, malformed values and contradictory obstacle provenance return `invalid-state` without reflecting input.

Priority: invalid state; caller-declared qualified-care boundary; closure; pause; unknown outcome; completion; adaptation; reported obstacle.

| Template | Human-reviewed question or response |
| --- | --- |
| ask-outcome | What happened at the opportunity? |
| record-completion | What made this action possible? |
| record-adaptation | What changed, and was that change useful? |
| ask-obstacle | What, if anything, got in the way? |
| resize-commitment | What smaller or differently timed commitment would you choose? |
| prepare-environment | What could be ready before the next opportunity? |
| clarify-action | What would count as a finished action? |
| request-skill-support | What instruction or help is needed? |
| invite-reflection | You reported a concern. Would you like to explore it? |
| review-load | Would you like to reconsider the commitment or discuss load with a qualified professional? |
| respect-pause / respect-closure | Respect the stated decision; do not restart the goal. |
| qualified-handoff | Keep care decisions with qualified support. This flag does not classify symptoms or assess urgency. |
| invalid-state | Correct the input contract before review. |

These are template meanings, not automatically delivered messages. The caller remains responsible for context and appropriate professional boundaries. No template prescribes training, nutrition, supplements or treatment.

## Integration

Keep real commitments, free text, records and identity reflections in a private instance. A future private adapter can map reviewed information into these enum fields. No real personal records belong in this repository, including during private hardening.

This utility does not bypass or replace coaching tenant, consent or assignment checks. Every result is `executionPermitted: false` and `authorityStatus: caller-supplied-simulation`. Actual persistence, authentication, export and delivery remain separate work.

The interface is deliberately independent of any marketing name. Existing Agentic Life OS, Training Intelligence Pack, and the Vitalis/Velora holds remain unchanged.

## Pilot proposal

First conduct a 14-day personal feasibility run; then consider an explicitly consented small pilot. Review one ordinary work or preparation commitment at a time.

Record planned opportunities, observed outcomes, useful adaptations and review burden. Report completion among observed eligible opportunities and observation coverage separately. Exclude explicitly paused/closed opportunities; never count missing observations as failed actions. A small pilot measures usability and feasibility, not clinical efficacy or causation.

Use synthetic examples in public materials. Do not collect hundreds of indicators without a decision each indicator supports.

## Verification

Run `pnpm --filter @frankx-ai/agentic-coaching-os test:follow-through` or, on Node 24, `node --test packages/coaching/checks/follow-through.mjs` from the repository root. The suite checks unknown outcomes, pause/closure, provenance, invalid input, accessors and the non-executable invariant across 336 enum combinations.

## Reference

[Michie et al. (2011), COM-B](https://link.springer.com/article/10.1186/1748-5908-6-42) organizes behavior around capability, opportunity and motivation. It informs practical questions; it does not establish that this implementation changes behavior.
