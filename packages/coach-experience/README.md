# Coach Performance OS experience

This package is the canonical visual consumer for the synthetic coaching
contracts in `@frankx-ai/agentic-coaching-os`.

It presents three connected surfaces:

- a public product story for premium coaches and performance teams;
- a member view for program context, five-lens check-ins, knowledge, consent,
  and agreed next actions;
- a coach studio for assignment-bound review, evidence provenance, bounded
  decisions, referral handoff, and non-executable audit receipts.

All visible records are synthetic. The application does not authenticate users,
store input, call a network service, make clinical claims, or execute a coaching
decision. Production identity, consent, storage, communication, and authority
must live in a separately governed private instance.

## Local verification

```bash
pnpm --filter @frankx-ai/agentic-coaching-os build
pnpm --filter @frankx-ai/coach-performance-experience typecheck
pnpm --filter @frankx-ai/coach-performance-experience test
pnpm --filter @frankx-ai/coach-performance-experience build
```

The GSAP implementation uses one entrance timeline and one desktop ScrollTrigger
review narrative. Mobile, coarse-pointer, and reduced-motion routes preserve the
complete static story.

`vercel.json` defines the intended static Vite output and a zero-network security
header baseline. Creating or attaching a Vercel project remains a separate,
registry-first release operation.
