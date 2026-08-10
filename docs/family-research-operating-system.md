# Private Family Research Operating System

Status: private production-instance contract
Data policy: no real family records, names, dates, media, or source scans belong in public repositories.

## What this system treats as truth

The canonical archive is **not** a family tree. It is a reversible registry of:

1. people represented by opaque private identifiers;
2. claims about names, dates, places, occupations, events, and relationships;
3. evidence with provenance, custody, rights, fixity, and access restrictions;
4. human review decisions, uncertainty, and contradictions;
5. audience-specific tree and narrative projections.

A tree is generated only from accepted, evidence-backed relationship claims. Proposed, disputed, and rejected claims remain searchable but cannot silently enter the tree.

## Repository and runtime boundary

| Plane | Location | Permitted content |
|---|---|---|
| Public doctrine | `family-intelligence-systems` | protocols, schemas, source methodology, synthetic fixtures |
| Reusable runtime | `family-intelligence-os` | policy engine, authorization, audit, connectors, export contracts |
| Private product integration | this private repository | private operator code and research workflow, but no credentials |
| Private tenant state | `<private-family-data-root>/` | real claims, private citations, manifests, review logs, encrypted-object references |
| Public projection | separate human-approved export | deceased-person material with rights, cultural, and publication review |

The private tenant remains locked until authentication, encrypted storage, persistent audit, malware scanning, backup, restore, and succession controls are operational.

## Evidence hierarchy

| Tier | Evidence class | Normal use |
|---|---|---|
| A | original civil/church register, notarial record, census/population register, probate, court, land, military, immigration, or cemetery record from the responsible archive | supports an event or relationship directly, subject to interpretation |
| B | certified extract, archive-created index, official register metadata, institutional catalogue | strong locator or derivative evidence; compare with the original image when available |
| C | contemporary family document, dated photograph, correspondence, funeral card, family bible, oral history from an identified witness | valuable private evidence; record custody and possible memory/bias limits |
| D | scholarly local history, newspaper archive, address book, occupational or community history | context or corroboration |
| E | user-contributed online tree, unsourced profile, search snippet, generated narrative | discovery lead only; never sufficient for acceptance |

A source may support one proposition while not proving another. A birth record can support recorded parent names, but it does not by itself prove every later identity match.

## Claim record

Every material assertion receives:

```text
claim_id
subject_person_ref
predicate
value or related_person_ref
status: proposed | under_review | accepted | disputed | rejected
confidence: 0.00–1.00
evidence_refs[]
negative_search_refs[]
researcher_note_ref
reviewed_by_human_ref
reviewed_at
supersedes_claim_ref (optional)
```

### Acceptance standard

A claim may be accepted only when:

- every referenced evidence item resolves;
- the source actually supports the exact proposition;
- identity collisions and same-name alternatives were considered;
- date/place conflicts are explained rather than overwritten;
- a human steward records the decision;
- living-person, child, health/genetic, cultural, and publication restrictions remain separate.

## Research case contract

Open one bounded case per question, for example:

> Identify the parents recorded for `person_0042` at the time of a specific marriage, distinguishing them from same-name residents in the same region.

Each case records:

1. exact question and branch;
2. known facts with claim IDs—not prose memory;
3. plausible jurisdictions and repositories;
4. spelling, language, calendar, and place-name variants;
5. search plan in source-priority order;
6. search log, including negative searches;
7. acquired evidence and rights;
8. competing hypotheses;
9. conclusion status and remaining uncertainty;
10. next bounded question.

## Branch structure

Use four branch workstreams around the initial research subject:

```text
subject
├── paternal / paternal
├── paternal / maternal
├── maternal / paternal
└── maternal / maternal
```

Do not force every record into one patrilineal surname story. Maintain maiden names, aliases, spelling variants, adoption/guardianship, non-parental households, migration, religion/community context, and location history as first-class research dimensions.

## Tree projection rules

- Accepted biological/adoptive parent claims only.
- No cycle is renderable; a cycle blocks the projection.
- More than two accepted biological parents for one person blocks pending dispute review.
- Private view may include all authorized records.
- Family view excludes private-only people and evidence.
- Public view excludes every living or unknown-status person and every non-public record.
- Every edge carries claim ID, confidence, and evidence references.
- Narrative generation must cite the same claim/evidence graph and label inference.

## Research cadence

### Intake

- Collect a minimal starting packet from Frank or a designated steward.
- Assign opaque person IDs before entering records.
- Keep original files unchanged and calculate fixity.
- Create access derivatives separately.

### Weekly research loop

1. choose one branch and one question;
2. search the highest-priority responsible archive;
3. log positive and negative searches;
4. capture source metadata before interpretation;
5. propose claims;
6. compare collisions and contradictions;
7. conduct human review;
8. regenerate private projections;
9. back up and verify one restore sample;
10. publish nothing by default.

### Quarterly stewardship review

- consent and living-person status;
- child and sensitive-data restrictions;
- evidence without fixity or rights metadata;
- unresolved contradictions;
- stale access grants;
- backup/restore evidence;
- succession guardians and release scopes;
- any public projection due for withdrawal or re-review.

## Minimum seed packet needed for real research

For each starting person, provide privately:

- full name as known, including maiden/previous names;
- approximate birth date and place;
- death date/place if applicable;
- spouse/partner and parent names already known;
- migration locations and languages/religious communities where relevant;
- copies or references for civil certificates, family books, funeral cards, photos, letters, or existing GEDCOM;
- which people are living;
- who may view the research;
- what must never be searched, digitized, AI-processed, or published.

Do not send this packet into a public GitHub issue or public repository. DNA/genetic sources require a separate explicit consent and retention decision.

## Source-quality rule

A web index or existing online tree may locate a record. It does not validate the relationship. The accepted conclusion should cite the responsible archive or original record where available, preserve the exact archival reference, and record any interpretation uncertainty.

## Current production state

The private software now has a tested claim/evidence relationship registry and audience-scoped ancestor projection. It is **not yet a production vault**: persistent encrypted storage, authentication, object scanning, durable audit, backup/restore, consent onboarding, and trusted deployment composition remain mandatory gates before real documents are ingested.
