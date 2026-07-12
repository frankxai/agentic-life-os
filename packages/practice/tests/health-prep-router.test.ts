import { describe, expect, it } from 'vitest';
import { routeHealthPreparation } from '../src/health-prep-router.js';

describe('LiveOS health preparation router', () => {
  it('keeps urgent symptom language outside the private preparation flow', () => {
    const route = routeHealthPreparation('I have chest pain and need to know what to do.');

    expect(route.intent.routeTo).toBe('emergency-care');
    expect(route.allowPrivatePreparation).toBe(false);
  });

  it('routes medical interpretation requests to a clinician-preparation boundary', () => {
    const route = routeHealthPreparation('Can you interpret my MRI and medication changes?');

    expect(route.intent.routeTo).toBe('clinician');
    expect(route.userFacingBoundary).toContain('Do not interpret results');
  });

  it('allows wellness organization while retaining a visible escalation boundary', () => {
    const route = routeHealthPreparation('Help me organize my sleep and training observations.');

    expect(route.intent.routeTo).toBe('agentic-health-os');
    expect(route.approvalRequired).toBe(true);
  });
});
