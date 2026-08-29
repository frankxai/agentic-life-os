# GSAP scene specification: reviewed action

Date: 2026-08-29
Owner: Coach Performance OS build lane

Implementation: `packages/coach-experience/src/App.tsx` and
`packages/coach-experience/src/styles.css`.
Brand: Agentic Life OS
Repo: `frankxai/agentic-life-os`
Page / route: future synthetic product proof
Scene name: Reviewed action
Pattern state: product

## Outcome contract

- Audience: coaches and members evaluating the product workflow.
- Primary user task: understand how a check-in becomes an agreed next action.
- Motion job: reveal causality and review order, not add ambient energy.
- What becomes clearer: five lenses contribute context before a decision is recorded.
- What becomes memorable: the lenses resolve into one calm, auditable action receipt.
- Why GSAP is required: the hero and scroll story share labelled, interruptible sequencing.
- Why CSS is insufficient: scroll progress must coordinate the evidence planes and receipt.

## Still-frame gate

- First frame: claim plus submitted synthetic check-in and five labelled lens summaries.
- Hero object: the readable member-review surface.
- Proof visible: evidence sources, consent state, and final next action.
- Primary action visible: inspect how review works.
- What stays still: headline, body copy, navigation, primary action, clinical boundary.
- What is removed: orbit paths, node cloud, ambient bubble field, fake scores.
- Static verdict: implemented and source-reviewed; browser inspection remains pending.

## Story beats

| Label | Trigger / progress | Primary move | Supporting move | Hold | Final state |
| --- | --- | --- | --- | --- | --- |
| `setup` | hero enter | proof plane rises 16px and resolves | copy reveals in two groups | 160ms | full still frame |
| `claim` | hero 20% | active lens moves to evidence | inactive lenses quiet | 220ms | evidence remains legible |
| `proof` | scroll 15–45% | five lens readings progress | source markers crossfade | 240ms each | all readings visible |
| `mechanism` | scroll 45–70% | decision rail advances | review states resolve | 320ms | action proposed |
| `decision` | scroll 70–90% | receipt settles into final plane | lens highlights recede | 420ms | action agreed |
| `hold` | scroll 90–100% | no new movement | focus moves to CTA naturally | 600ms | useful product state |

## Runtime contract

- GSAP version: use the consumer repo's pinned current version.
- Plugins: ScrollTrigger only.
- Registration: one client-only motion module.
- Scope: one root ref with `useGSAP()`.
- Cleanup: automatic context revert on unmount and media-query change.
- Trigger order: document order.
- Smooth scroll: native.
- Competing runtimes: do not animate the same properties with Motion or CSS.

## ScrollTrigger contract

- Trigger: the review-story section.
- Start: `clamp(top top)`.
- End: one bounded viewport-length story, tuned after capture.
- Pin: desktop only; animate children, never the pinned shell.
- Scrub: numeric scrub; no `toggleActions` on the same trigger.
- Snap: none unless usability testing proves value.
- Final state: complete decision receipt and visible CTA.
- Native reading: all copy remains in document order and the scene exits cleanly.

## Responsive router

| Condition | Composition | Motion | Pin / scrub | Final state |
| --- | --- | --- | --- | --- |
| Desktop | overlapping semantic lenses | full labelled timeline | one short pin | receipt beside proof |
| Mobile | vertical lens reader | discrete reveals | no pin | receipt below evidence |
| Coarse pointer | stable lens surfaces | no cursor response | mobile/tablet route | same content |
| Reduced motion | complete static story | none | none | all evidence and receipt visible |

Implementation must use `gsap.matchMedia()` and revert cleanly.

## Performance and accessibility

- Animate `x`, `y`, `scale`, and `autoAlpha` only.
- Maximum simultaneous animated elements: 12.
- Avoid full-page filters; constrain any backdrop blur to the semantic lens surface.
- Do not use blanket `will-change`; apply and clear it only for active elements.
- Meaning is never motion-only, hover-only, or color-only.
- Keyboard focus never follows the animation playhead.
- The mobile and reduced-motion routes preserve the full decision sequence.

## Evidence

The canonical visual consumer and motion contract are implemented. Desktop, mobile,
reduced-motion, short capture, console, performance, and preview evidence remain
blocked until the machine preflight admits browser/build work.
