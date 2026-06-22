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

  it('creates wellness artifacts with explicit refusals', () => {
    const brief = health.createNutritionBrief({
      goal: 'stable energy during work blocks',
      evidenceChecked: '2026-06-22',
    });

    expect(brief.domain).toBe('nutrition');
    expect(brief.safetyLevel).toBe('wellness');
    expect(brief.refusals).toContain('No medication, supplement, dose, treatment, or delay recommendations.');
  });
});
