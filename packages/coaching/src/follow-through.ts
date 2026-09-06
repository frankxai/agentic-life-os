/**
 * Non-executable follow-through review simulation.
 * Callers supply synthetic enum states; this module grants no authority.
 */
const allowed = {
  goalStatus: ['active', 'paused', 'closed'],
  outcome: ['unknown', 'completed', 'adapted', 'not-completed'],
  obstacle: ['unknown', 'time', 'preparation', 'clarity', 'skill', 'concern', 'fatigue'],
  obstacleSource: ['none', 'user-reported'],
  scope: ['ordinary', 'qualified-care'],
} as const;

export type FollowThroughState = {
  [K in keyof typeof allowed]: (typeof allowed)[K][number];
};

export type FollowThroughTemplate =
  | 'invalid-state'
  | 'qualified-handoff'
  | 'respect-pause'
  | 'respect-closure'
  | 'ask-outcome'
  | 'record-completion'
  | 'record-adaptation'
  | 'ask-obstacle'
  | 'resize-commitment'
  | 'prepare-environment'
  | 'clarify-action'
  | 'request-skill-support'
  | 'invite-reflection'
  | 'review-load';

export interface FollowThroughReview {
  readonly schemaVersion: 'follow-through-review/v1';
  readonly authorityStatus: 'caller-supplied-simulation';
  readonly executionPermitted: false;
  readonly requiresHumanReview: true;
  readonly templateId: FollowThroughTemplate;
}

function result(templateId: FollowThroughTemplate): FollowThroughReview {
  return Object.freeze({
    schemaVersion: 'follow-through-review/v1',
    authorityStatus: 'caller-supplied-simulation',
    executionPermitted: false,
    requiresHumanReview: true,
    templateId,
  });
}

/** Reject extra fields and accessors; copy only allowlisted primitive values. */
function parseState(input: unknown): FollowThroughState | undefined {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return;
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return;
  const keys = Object.keys(allowed) as (keyof FollowThroughState)[];
  if (Reflect.ownKeys(input).length !== keys.length) return;
  const state: Record<string, string> = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !('value' in descriptor) || typeof descriptor.value !== 'string') return;
    if (!(allowed[key] as readonly string[]).includes(descriptor.value)) return;
    state[key] = descriptor.value;
  }
  if ((state.obstacle === 'unknown') !== (state.obstacleSource === 'none')) return;
  return state as FollowThroughState;
}

/**
 * Missing outcome never becomes failure. A stated obstacle is not a diagnosis.
 * Qualified-care is a caller-declared boundary, not symptom classification.
 * This selects a review template; it does not change any goal or schedule.
 */
export function reviewFollowThrough(input: unknown): FollowThroughReview {
  let state: FollowThroughState | undefined;
  try {
    state = parseState(input);
  } catch {
    return result('invalid-state');
  }
  if (!state) return result('invalid-state');
  if (state.scope === 'qualified-care') return result('qualified-handoff');
  if (state.goalStatus === 'closed') return result('respect-closure');
  if (state.goalStatus === 'paused') return result('respect-pause');
  if (state.outcome === 'unknown') return result('ask-outcome');
  if (state.outcome === 'completed') return result('record-completion');
  if (state.outcome === 'adapted') return result('record-adaptation');

  const templates: Record<FollowThroughState['obstacle'], FollowThroughTemplate> = {
    unknown: 'ask-obstacle',
    time: 'resize-commitment',
    preparation: 'prepare-environment',
    clarity: 'clarify-action',
    skill: 'request-skill-support',
    concern: 'invite-reflection',
    fatigue: 'review-load',
  };
  return result(templates[state.obstacle]);
}
