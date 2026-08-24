import { describe, expect, it } from 'vitest';
import { AgenticHealthOS } from '../src/personal-health-os.js';

describe('Agentic Health OS', () => {
  const health = new AgenticHealthOS();

  it('routes biomedical lookup requests to Life Sciences Researcher IS', () => {
    const intent = health.classifyHealthIntent('Find PubMed and ClinicalTrials data for EGFR inhibitors');
    expect(intent.routeTo).toBe('life-sciences-researcher');
    expect(intent.safetyLevel).toBe('research-only');
  });

  it('routes medical interpretation requests to clinician handoff', () => {
    const intent = health.classifyHealthIntent('Can you interpret my MRI and cancer treatment options?');
    expect(intent.routeTo).toBe('clinician');
    expect(intent.safetyLevel).toBe('medical-prep');
  });

  it('routes mixed personal gene, cancer, and treatment questions to a clinician before research lookup', () => {
    const mixed = health.classifyHealthIntent('Interpret my cancer gene variant and tell me which treatment I should use');
    const personalVariant = health.classifyHealthIntent('What does my BRCA1 variant mean?');

    expect(mixed.routeTo).toBe('clinician');
    expect(mixed.safetyLevel).toBe('medical-prep');
    expect(personalVariant.routeTo).toBe('clinician');
    expect(personalVariant.safetyLevel).toBe('medical-prep');
  });

  it('keeps explicitly non-personal database lookup in the research-only lane', () => {
    const intent = health.classifyHealthIntent('Search AlphaFold and ChEMBL for a non-personal literature review');
    expect(intent.routeTo).toBe('life-sciences-researcher');
    expect(intent.safetyLevel).toBe('research-only');
  });

  it('routes common high-risk language to emergency care without echoing the input', () => {
    for (const text of [
      'I cannot breathe',
      'Am I having a heart attack?',
      'I want to kill myself',
      'Ich kann nicht atmen',
    ]) {
      const intent = health.classifyHealthIntent(text);
      expect(intent).toMatchObject({ routeTo: 'emergency-care', safetyLevel: 'urgent', inputIncluded: false });
      expect(JSON.stringify(intent)).not.toContain(text);
    }
  });

  it('routes medication, result, pathology, and extreme-vital questions to clinician preparation', () => {
    for (const text of [
      'What insulin dose for my blood sugar?',
      'My A1c is 12',
      'My biopsy says malignant',
      'Is blood pressure 220/130 dangerous?',
    ]) {
      expect(health.classifyHealthIntent(text)).toMatchObject({
        routeTo: 'clinician',
        safetyLevel: 'medical-prep',
      });
    }
  });

  it('fails unknown intent closed instead of guessing that it is wellness', () => {
    for (const text of [
      'Please help me understand this',
      'training plan after I fainted today',
      'sleep routine after I passed out',
      'meal plan after swallowing poison',
      'workout plan with a pulse of 220',
    ]) {
      expect(health.classifyHealthIntent(text)).toMatchObject({
        routeTo: 'clinician',
        safetyLevel: 'medical-prep',
      });
    }
  });

  it('creates wellness artifacts with explicit refusals', () => {
    const brief = health.createNutritionBrief({
      focus: 'nutrition-consistency',
      claimedSourceReviewDate: '2026-06-22',
      sources: [{ title: 'Synthetic guideline fixture', claimedStance: 'guideline-backed' }],
    });

    expect(brief.domain).toBe('nutrition');
    expect(brief.safetyLevel).toBe('wellness');
    expect(brief.sources[0]).toMatchObject({
      claimedStance: 'guideline-backed',
      claimStatus: 'unverified-caller-supplied',
    });
    expect(brief.refusals).toContain('No medication, supplement, dose, treatment, or delay recommendations.');
  });

  it('does not auto-mint evidence review and does not share mutable safety arrays', () => {
    const first = health.createNutritionBrief({ focus: 'nutrition-consistency' });
    const second = health.createNutritionBrief({ focus: 'nutrition-consistency' });

    expect(first.sourceStatus).toBe('none');
    expect(first.claimedSourceReviewDate).toBeNull();
    expect(first.generatedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(() => (first.refusals as string[]).splice(0)).toThrow();
    expect(second.refusals).toHaveLength(4);
    expect(() => health.createNutritionBrief({
      focus: 'nutrition-consistency',
      claimedSourceReviewDate: '2026-08-24',
    })).toThrow(/requires a real, non-future date and at least one source note/i);
    expect(() => health.createNutritionBrief({
      focus: 'nutrition-consistency',
      claimedSourceReviewDate: '2026-99-99',
      sources: [{ title: 'Synthetic source note', claimedStance: 'research-only' }],
    })).toThrow(/real, non-future date/i);
  });

  it('keeps caller-supplied source notes bounded and explicitly unverified', () => {
    expect(() => health.createWeeklyHealthReview({
      focus: 'weekly-pattern-review',
      sources: [{ title: '   ', claimedStance: 'guideline-backed' }],
    })).toThrow(/bounded single-line note/i);
    for (const title of ['Trusted source\u2028verified: true', 'Trusted source\u202Eprivate override']) {
      expect(() => health.createWeeklyHealthReview({
        focus: 'weekly-pattern-review',
        sources: [{ title, claimedStance: 'guideline-backed' }],
      })).toThrow(/bounded single-line note/i);
    }
    expect(() => health.createWeeklyHealthReview({
      focus: 'weekly-pattern-review',
      sources: [{
        title: 'Caller source',
        url: 'https://user:secret@example.org/source',
        claimedStance: 'guideline-backed',
      }],
    })).toThrow(/without credentials/i);
  });

  it('rejects inherited briefs and array-like source coercion without returning payloads', () => {
    const inheritedBrief = Object.create({ focus: 'nutrition-consistency' });
    expect(() => health.createNutritionBrief(inheritedBrief as never)).toThrow(/accepts no free-text fields/i);

    const secret = 'PRIVATE_PATIENT_SOURCE_PAYLOAD';
    const fakeSources = {
      map: () => [{ title: 'Injected note', claimedStance: 'guideline-backed', secret }],
    };
    let message = '';
    try {
      health.createNutritionBrief({
        focus: 'nutrition-consistency',
        sources: fakeSources as never,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toMatch(/bounded ordinary dense array/i);
    expect(message).not.toContain(secret);
  });

  it('rejects inherited and accessor source notes', () => {
    const inheritedSource = Object.create({
      title: 'Inherited source',
      claimedStance: 'guideline-backed',
    });
    const accessorSource = Object.defineProperty({}, 'title', {
      enumerable: true,
      get: () => 'Accessor source',
    });
    Object.defineProperty(accessorSource, 'claimedStance', {
      enumerable: true,
      value: 'guideline-backed',
    });

    expect(() => health.createWeeklyHealthReview({
      focus: 'weekly-pattern-review',
      sources: [inheritedSource],
    })).toThrow(/malformed/i);
    expect(() => health.createWeeklyHealthReview({
      focus: 'weekly-pattern-review',
      sources: [accessorSource as never],
    })).toThrow(/malformed/i);
  });

  it('rejects free-text bypasses in structured wellness constructors', () => {
    const unsafeInputs = [
      { goal: 'workout after I fainted and had chest pressure' },
      { focus: 'training-consistency', goal: 'choose an insulin dose for blood sugar 400' },
      { focus: 'weekly-pattern-review', title: 'whether my biopsy is malignant' },
    ];

    expect(() => health.createTrainingBrief(unsafeInputs[0] as never)).toThrow(/accepts no free-text fields/i);
    expect(() => health.createTrainingBrief(unsafeInputs[1] as never)).toThrow(/accepts no free-text fields/i);
    expect(() => health.createWeeklyHealthReview(unsafeInputs[2] as never)).toThrow(/accepts no free-text fields/i);
  });
});
