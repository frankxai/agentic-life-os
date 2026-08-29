# Coach Performance OS page specification

Canonical consumer: `packages/coach-experience`.

## Outcome contract

- Audience: independent premium coaches, performance teams, and their members.
- Surface: public product story connected to synthetic member and coach frames.
- First read: one place to understand the person, guide the program, and prove progress.
- Primary task: understand the review workflow and inspect the agreed next action.
- Evidence: a readable synthetic member-review surface with source provenance and
  a non-executable decision receipt.
- Asset tier: Tier C exact product UI; a later owned product capture becomes Tier A.
- Failure modes: decorative node graph, fake biometric score, health-authority
  theater, generic glass-card field, tiny UI, motion-dependent meaning, or private data.

## Information architecture

1. Public overview: offer, proof object, method, deliverables, boundaries, pricing.
2. Member today: phase, check-in, five-lens reader, next agreed action, knowledge.
3. Coach review: queue, consent state, evidence provenance, decision, audit receipt.
4. Trust: role capabilities, data separation, coaching-versus-clinical boundary.

## First viewport

Use an asymmetric editorial composition. The claim and primary action occupy the
quiet left plane. The right plane is the actual review surface: a synthetic
check-in beneath five overlapping semantic lenses. Each lens reveals one readable
piece of evidence or constraint. A decision rail ends in a concrete next action.

The visual must work with JavaScript disabled. No orbit, node cloud, decorative
bubble field, fake terminal, or unreadable dashboard is allowed.

## Responsive contract

- Desktop: layered lens reader and decision rail; fine-pointer cursor response is optional.
- Tablet: reduced lens overlap and a horizontal decision rail.
- Mobile: vertical sequence of five lens readings followed by the decision receipt.
- Coarse pointer: no cursor follower or magnetic movement.
- Reduced motion: static product proof with all evidence and the final action visible.

## Interaction states

- Default: synthetic check-in submitted; review not yet recorded.
- Focus: keyboard focus moves through lens summaries and the decision rail logically.
- Review: coach selects one allowed action and sees the non-executable receipt preview.
- Empty: no assigned check-ins, with the next operational action.
- Error: missing or stale synthetic descriptor; no retry loop or data exposure.
- Consent blocked: decision controls disabled and the exact missing boundary explained.
- Referral required: coaching action stops and a qualified-care handoff is described.

## Motion contract

- Hero timeline job: establish claim, reveal the review surface, and land on the next action.
- Scroll narrative job: explain submitted check-in -> evidence review -> agreed action -> receipt.
- Runtime: GSAP timeline and one ScrollTrigger scene only after the static gate passes.
- Animated properties: transforms and `autoAlpha` only.
- Cleanup: scoped `useGSAP()` context and `gsap.matchMedia()`.
- No competing smooth-scroll system.

## Performance and accessibility

- Server-render the first viewport and proof copy.
- Client islands only for the synthetic review transition and pointer-capable lens behavior.
- Keep product meaning available without hover, cursor, motion, or color alone.
- Visible focus, semantic headings, labels, status announcements, and 44px touch targets.
- Reserve dimensions for any poster or video; no autoplay sound.
- Mobile keeps the complete workflow while reducing layers and simultaneous motion.

## Acceptance gate

- Static first viewport passes before GSAP is added.
- Desktop, mobile, coarse-pointer, keyboard, and reduced-motion states are inspected.
- Typecheck, tests, build, anti-slop scanner, accessibility, and visual QA pass.
- No ignored TypeScript errors, globally unoptimized images, fake claims, or unknown assets.
- A preview may be created only after local gates, deploy-race check, and draft PR review.

## Deployment routing

- `agentic-life-os` is the dedicated Vercel project for this canonical consumer.
- Deployment `dpl_5uKyNyfqueHFPmKBFrjzY2VBHGEo` is a READY, protected preview;
  it is not a public release and has no production target or custom-domain alias.
- The current project protection mode is `all_except_custom_domains`, with Git fork
  protection enabled and no automation-bypass entry configured.
- Before automated rendered QA, choose a least-privilege preview-access method and
  store any bypass value only as a secret. Production promotion, a custom domain,
  and public access remain separate release decisions after the 26/30 visual gate.
- Do not route this consumer through the unrelated `agentic-gym-os` project.
