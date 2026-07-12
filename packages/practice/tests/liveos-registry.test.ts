import { describe, expect, it } from 'vitest';
import { ActionRequestSchema } from '@frankx-ai/alos-core';
import {
  LIVEOS_COMMANDS,
  SPIRITUAL_PRACTICE_PACKS,
  createLiveOSActionRequest,
  createDefaultLifeOverview,
  createLiveOSReceipt,
  parseLiveOSCommand,
} from '../src/liveos-registry.js';

describe('LiveOS practice registry', () => {
  it('keeps commands and dashboard routes aligned', () => {
    expect(LIVEOS_COMMANDS).toHaveLength(8);
    expect(LIVEOS_COMMANDS.every((command) => command.dashboardRoute.startsWith('/'))).toBe(true);
  });

  it('keeps plural spiritual packs source-aware and bounded', () => {
    expect(SPIRITUAL_PRACTICE_PACKS.map((pack) => pack.id)).toEqual([
      'christian-contemplative',
      'taoist-practice',
      'tantra-oriented',
      'personal-rule-of-life',
    ]);
    expect(SPIRITUAL_PRACTICE_PACKS.every((pack) => pack.sourceRequirement.length > 0)).toBe(true);
  });

  it('creates approval-gated health preparation receipts', () => {
    const request = ActionRequestSchema.parse({
      id: 'health-1',
      command: '/liveos health-prep',
      mode: 'plan',
      scope: ['health'],
      requestedOutcome: 'Organize questions for a clinician.',
      requestedAt: '2026-07-12T12:00:00.000Z',
    });

    const receipt = createLiveOSReceipt(request, '2026-07-12T12:00:00.000Z');
    expect(receipt.status).toBe('needs-approval');
    expect(receipt.approvalRequired).toBe(true);
  });

  it('parses the same slash command vocabulary used by dashboard clients', () => {
    const parsed = parseLiveOSCommand('/liveos palace link today\'s reflection');
    const request = createLiveOSActionRequest('/liveos today choose a deliberate practice', {
      id: 'today-1',
      requestedAt: '2026-07-12T12:00:00.000Z',
    });

    expect(parsed?.definition.dashboardRoute).toBe('/palace');
    expect(parsed?.argument).toBe('link today\'s reflection');
    expect(request.requestedOutcome).toBe('choose a deliberate practice');
    expect(request.scope).toEqual(['practice', 'review']);
  });

  it('starts Today with a user-authored practice and no invented Palace records', () => {
    const overview = createDefaultLifeOverview(new Date('2026-07-12T12:00:00.000Z'));
    expect(overview.activePractice?.tradition).toBe('User-authored');
    expect(overview.anchors).toEqual([]);
  });
});
