import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { simulateCoachReview, validateCoachingKnowledgeGraph } from '@frankx-ai/agentic-coaching-os';
import { knowledgeGraph, lensPresentations, reviewRequest } from '../src/demo-data';

const packageRoot = resolve(import.meta.dirname, '..');

describe('Coach Performance OS experience', () => {
  it('renders exactly one signal for every coaching lens', () => {
    expect(lensPresentations.map((lens) => lens.domain)).toEqual([
      'body',
      'mind',
      'performance',
      'recovery',
      'context',
    ]);
    expect(reviewRequest.checkIn.lensSignals).toHaveLength(5);
  });

  it('uses the validated graph and bounded review workflow as its proof', () => {
    expect(validateCoachingKnowledgeGraph(knowledgeGraph)).toEqual({ valid: true, issues: [] });
    expect(simulateCoachReview(reviewRequest)).toMatchObject({
      conforms: true,
      code: 'review-plan-conforms',
      executionPermitted: false,
      agreementRequired: ['coach', 'member'],
    });
  });

  it('keeps the GSAP scene responsive, scoped, and reduced-motion safe', () => {
    const app = readFileSync(resolve(packageRoot, 'src/App.tsx'), 'utf8');
    const styles = readFileSync(resolve(packageRoot, 'src/styles.css'), 'utf8');

    expect(app).toContain('useGSAP');
    expect(app).toContain('gsap.matchMedia()');
    expect(app).toContain("'(prefers-reduced-motion: reduce)'");
    expect(app).toContain('ScrollTrigger');
    expect(app).toContain("pin: '.review-stage'");
    expect(app).toContain("event.key !== 'ArrowLeft'");
    expect(app).toContain("tabIndex={activeView === 'member' ? 0 : -1}");
    expect(app).toContain('role="progressbar"');
    expect(app).toContain('aria-expanded={receiptOpen}');
    expect(app).toContain('aria-pressed={selectedDecision === key}');
    expect(app).not.toContain('className="queue-item" aria-pressed');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).not.toContain('text-transform: uppercase');
  });

  it('states the synthetic and non-clinical boundary in the rendered experience', () => {
    const app = readFileSync(resolve(packageRoot, 'src/App.tsx'), 'utf8');
    expect(app).toContain('Synthetic product experience · No member data');
    expect(app).toContain('Not medical advice, diagnosis, treatment');
    expect(app).toContain('public runtime executes nothing');
  });

  it('ships a zero-network security header baseline', () => {
    const vercel = JSON.parse(readFileSync(resolve(packageRoot, 'vercel.json'), 'utf8')) as {
      headers: Array<{ headers: Array<{ key: string; value: string }> }>;
    };
    const headers = Object.fromEntries(vercel.headers[0]!.headers.map(({ key, value }) => [key, value]));
    expect(headers['Content-Security-Policy']).toContain("connect-src 'none'");
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
  });
});
