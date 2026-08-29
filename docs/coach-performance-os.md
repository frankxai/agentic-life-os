# Coach Performance OS

## Purpose

Coach Performance OS is a bounded coaching and member-support contract for
Agentic Life OS. It helps a coach understand context, guide a program, review a
structured check-in, and agree on a next action without turning public code into
a health record, clinical system, or source of authority.

The public package owns schemas, synthetic fixtures, graph integrity checks,
capability simulation, and non-executable review plans. Identifiable member data,
current consent, assignments, approvals, audit storage, billing, and communication
delivery belong to a separately authenticated, encrypted, tenant-scoped runtime.

## Product activation

A member completes a structured check-in. An assigned coach reviews it against
curated evidence and the current program phase. The two agree on one next action,
and the private runtime records an auditable decision receipt.

A page view, login, raw score, or automated recommendation is not activation.

## Five lenses

The experience organizes coaching context through five non-clinical lenses:

- Body: movement readiness and self-reported physical context.
- Mind: attention, confidence, and self-reported wellbeing context.
- Performance: current program intent, practice, and observable progress.
- Recovery: self-reported restoration, load tolerance, and recovery practice.
- Context: schedule, environment, responsibilities, and other constraints.

The lenses are not diagnoses, medical classifications, or composite health
scores. A lens can reveal a structured signal or evidence relationship; it cannot
interpret a clinical record or make a treatment decision.

## Public knowledge graph

The graph contains coach-curated professional knowledge and program structure:

- `KnowledgeNode`: a bounded concept with domain, summary, visibility, review
  date, and evidence-source identifiers.
- `KnowledgeRelation`: a typed, explained connection between two nodes.
- `EvidenceSource`: source metadata and review provenance; never copied source
  bodies or unlicensed corpora.
- `ProgramMap`: phases and modules that reference knowledge nodes.

Member observations, session notes, therapy records, diagnoses, raw health
records, free-text journaling, and biometric streams are never graph nodes. A
private runtime may bind an opaque observation descriptor to a review operation,
but the public graph cannot receive or expose its contents.

## Roles and capabilities

| Role | Public capability description | Private-runtime responsibility |
| --- | --- | --- |
| Member | View assigned program knowledge, submit a structured check-in plan, read an agreed next action, manage consent | Authenticate identity, enforce own-record scope, store input and consent |
| Coach | Review assigned synthetic descriptors, inspect evidence provenance, propose a next action, request a referral | Enforce tenant and assignment scope, claim approval, store decision and audit event |
| Lead coach | Review program quality, evidence freshness, and escalated referrals | Enforce organization scope and separation of duties |
| Organization owner | Configure roles, programs, retention, and billing descriptors | Operate identity, tenancy, policy, billing, and retention systems |
| Evidence reviewer | Review source metadata and graph provenance | Approve source status without receiving member records |

No role receives clinical authority from a prompt, persona, graph node, or public
package result.

## Review state machine

```text
draft
  -> submitted
  -> consent-verified
  -> coach-review-ready
  -> next-action-proposed
  -> member-agreed
  -> receipt-recorded
```

Any state may become `blocked` when tenant binding, assignment, consent, evidence,
scope, or required human approval is missing. Clinical or crisis content becomes
`referral-required`; the public runtime stops and returns a non-executable handoff
descriptor.

## Safety and privacy invariants

- Default deny: public code never permits execution or egress.
- Tenant, subject, actor, purpose, action, and assignment must bind exactly.
- Consent is current, scoped, revocable, and rechecked at decision time.
- Knowledge provenance is required and review dates remain visible.
- Clinical interpretation, diagnosis, treatment, medication advice, and emergency
  reassurance are out of scope.
- Private text and raw records remain behind a separately encrypted adapter.
- Aggregate insight requires minimum-cohort and disclosure controls in the private
  runtime; the public package only describes the boundary.
- Communications remain drafts until an authorized human approves delivery.

## Product surfaces

Public site:

- Outcome-led first viewport with an inspectable synthetic review surface.
- Method, program, deliverables, coach proof, boundaries, pricing, and application.

Member experience:

- Today and next action.
- Program map and current phase.
- Coach-curated knowledge graph.
- Structured check-ins, progress context, feedback, consent, and privacy controls.

Coach studio:

- Assigned-member review inbox.
- Timeline and session preparation.
- Program and knowledge-graph authoring.
- Evidence review queue, referral handoff, roles, consent, and audit receipts.

## Release boundary

The first release is a synthetic public contract and static product proof. It has
no authentication, persistence, network submission, PII, clinical data, live
communications, or production billing. Any real member pilot requires a separate
private-runtime security review and explicit operator approval.
