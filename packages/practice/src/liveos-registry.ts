import {
  type ActionMode,
  type ActionReceipt,
  type ActionRequest,
  type EvidenceRef,
  type LifeOverview,
  type LiveOSDomain,
  type LiveOSModule,
  type Practice,
  requestNeedsApproval,
} from '@frankx-ai/alos-core';

export type LiveOSCommandId =
  | '/liveos today'
  | '/liveos practice'
  | '/liveos body'
  | '/liveos fitness'
  | '/liveos health-prep'
  | '/liveos learn'
  | '/liveos palace'
  | '/liveos weekly';

export interface LiveOSCommandDefinition {
  id: LiveOSCommandId;
  label: string;
  dashboardRoute: string;
  scope: LiveOSDomain[];
  inputHint: string;
  outputLabel: string;
  requiresApproval: boolean;
  safetyBoundary: string;
}

export interface ParsedLiveOSCommand {
  definition: LiveOSCommandDefinition;
  argument: string;
}

export interface CreateLiveOSActionRequestOptions {
  id: string;
  mode?: ActionMode;
  inputs?: Record<string, unknown>;
  sourceRefs?: EvidenceRef[];
  requestedAt?: string;
}

export interface SpiritualPracticePack {
  id: string;
  label: string;
  tradition: string;
  posture: string;
  sourceRequirement: string;
  safetyBoundary: string;
  practices: Practice[];
}

const practiceSource = (tradition: string, citation: string) => ({
  title: `${tradition} source selected by the practitioner`,
  tradition,
  citation,
  usageNote: 'Use a source you have permission to use. Keep the source, translation, teacher, and context visible in your private notes.',
});

export const LIVEOS_MODULES: LiveOSModule[] = [
  {
    id: 'today',
    label: 'Today',
    domain: 'practice',
    owner: 'ALOS practice engine',
    capabilities: ['intention', 'practice queue', 'receipt'],
    riskLevel: 'low',
    privacyClass: 'private',
    sourceAdapter: 'agentic-life-os/practice',
    dashboardRoute: '/today',
    command: '/liveos today',
    proofGate: 'A visible next action and an action receipt exist.',
    requiresConsent: false,
  },
  {
    id: 'practice',
    label: 'Practice',
    domain: 'spiritual',
    owner: 'ALOS practice engine',
    capabilities: ['guided session', 'reflection', 'source context'],
    riskLevel: 'guarded',
    privacyClass: 'sensitive',
    sourceAdapter: 'agentic-life-os/practice',
    dashboardRoute: '/practice',
    command: '/liveos practice',
    proofGate: 'Practice source, tradition, and personal boundary are visible.',
    requiresConsent: true,
  },
  {
    id: 'body',
    label: 'Body',
    domain: 'body',
    owner: 'ALOS practice engine',
    capabilities: ['check-in', 'observation', 'import manifest'],
    riskLevel: 'guarded',
    privacyClass: 'sensitive',
    sourceAdapter: 'agentic-life-os/health',
    dashboardRoute: '/body',
    command: '/liveos body',
    proofGate: 'Observations remain self-reported and private.',
    requiresConsent: true,
  },
  {
    id: 'fitness',
    label: 'Fitness',
    domain: 'fitness',
    owner: 'ALOS practice engine',
    capabilities: ['session log', 'progression note', 'recovery check-in'],
    riskLevel: 'guarded',
    privacyClass: 'sensitive',
    sourceAdapter: 'agentic-life-os/health',
    dashboardRoute: '/fitness',
    command: '/liveos fitness',
    proofGate: 'No injury rehabilitation or medical prescription is generated.',
    requiresConsent: true,
  },
  {
    id: 'health',
    label: 'Health preparation',
    domain: 'health',
    owner: 'Health Intelligence System adapter',
    capabilities: ['record organization', 'clinician questions', 'private handoff'],
    riskLevel: 'high',
    privacyClass: 'regulated',
    sourceAdapter: 'health-intelligence-system',
    dashboardRoute: '/health',
    command: '/liveos health-prep',
    proofGate: 'Health requests retain clinician, privacy, and non-diagnosis boundaries.',
    requiresConsent: true,
  },
  {
    id: 'intellectual',
    label: 'Intellectual',
    domain: 'intellectual',
    owner: 'ALOS learning adapter',
    capabilities: ['learning session', 'research brief', 'next question'],
    riskLevel: 'low',
    privacyClass: 'private',
    sourceAdapter: 'starlight-memory',
    dashboardRoute: '/intellectual',
    command: '/liveos learn',
    proofGate: 'Every research claim carries a source reference or is marked as a personal reflection.',
    requiresConsent: true,
  },
  {
    id: 'palace',
    label: 'Palace',
    domain: 'palace',
    owner: 'Starlight memory adapter',
    capabilities: ['anchor', 'link', 'scoped recall'],
    riskLevel: 'guarded',
    privacyClass: 'sensitive',
    sourceAdapter: 'starlight-memory',
    dashboardRoute: '/palace',
    command: '/liveos palace',
    proofGate: 'Every anchor resolves to a private evidence reference.',
    requiresConsent: true,
  },
  {
    id: 'review',
    label: 'Review',
    domain: 'review',
    owner: 'ALOS practice engine',
    capabilities: ['weekly reflection', 'pattern summary', 'proposed commitment'],
    riskLevel: 'guarded',
    privacyClass: 'private',
    sourceAdapter: 'agentic-life-os/practice',
    dashboardRoute: '/review',
    command: '/liveos weekly',
    proofGate: 'Changes remain proposals until the user confirms them.',
    requiresConsent: true,
  },
];

export const LIVEOS_COMMANDS: LiveOSCommandDefinition[] = [
  {
    id: '/liveos today',
    label: 'Create today\'s focus',
    dashboardRoute: '/today',
    scope: ['practice', 'review'],
    inputHint: 'State the quality of attention you want to bring to today.',
    outputLabel: 'A bounded practice plan and evidence route.',
    requiresApproval: false,
    safetyBoundary: 'Returns a plan; it does not alter calendars, tasks, or external systems.',
  },
  {
    id: '/liveos practice',
    label: 'Begin a practice',
    dashboardRoute: '/practice',
    scope: ['spiritual', 'practice'],
    inputHint: 'Choose a private practice pack or your own rule of life.',
    outputLabel: 'A source-aware practice session and reflection prompt.',
    requiresApproval: false,
    safetyBoundary: 'Agents may suggest and summarize; they do not claim spiritual authority.',
  },
  {
    id: '/liveos body',
    label: 'Record a body check-in',
    dashboardRoute: '/body',
    scope: ['body'],
    inputHint: 'Describe self-reported energy, rest, recovery, or nourishment observations.',
    outputLabel: 'A private observation record and a non-medical next question.',
    requiresApproval: false,
    safetyBoundary: 'No diagnosis, lab interpretation, or treatment recommendation.',
  },
  {
    id: '/liveos fitness',
    label: 'Log a fitness session',
    dashboardRoute: '/fitness',
    scope: ['fitness'],
    inputHint: 'Record a completed session, perceived effort, and recovery observation.',
    outputLabel: 'A private training log and recovery-aware reflection.',
    requiresApproval: false,
    safetyBoundary: 'No injury rehabilitation or medical prescription.',
  },
  {
    id: '/liveos health-prep',
    label: 'Prepare health questions',
    dashboardRoute: '/health',
    scope: ['health'],
    inputHint: 'Name the records or questions you want to organize for qualified care.',
    outputLabel: 'A clinician-question or private record-preparation packet.',
    requiresApproval: true,
    safetyBoundary: 'No diagnosis, medication advice, treatment recommendation, or emergency triage.',
  },
  {
    id: '/liveos learn',
    label: 'Capture a learning session',
    dashboardRoute: '/intellectual',
    scope: ['intellectual'],
    inputHint: 'Name the source, insight, and next question.',
    outputLabel: 'A sourced learning note ready for the Palace.',
    requiresApproval: false,
    safetyBoundary: 'Separate cited research from personal reflection and hypothesis.',
  },
  {
    id: '/liveos palace',
    label: 'Create a memory anchor',
    dashboardRoute: '/palace',
    scope: ['palace'],
    inputHint: 'Select a practice, reflection, person, project, or source to anchor.',
    outputLabel: 'An evidence-linked memory anchor and relationship suggestion.',
    requiresApproval: false,
    safetyBoundary: 'Scoped retrieval only; the Palace does not copy raw private vaults.',
  },
  {
    id: '/liveos weekly',
    label: 'Review the week',
    dashboardRoute: '/review',
    scope: ['review', 'practice', 'intellectual'],
    inputHint: 'Review completed practices, observations, and memory anchors.',
    outputLabel: 'A proposed next commitment awaiting your confirmation.',
    requiresApproval: true,
    safetyBoundary: 'Recommendations remain proposals until confirmed by the user.',
  },
];

const christianExamen: Practice = {
  id: 'christian-contemplative-examen',
  title: 'Christian contemplative examen',
  domain: 'spiritual',
  tradition: 'Christian contemplative practice',
  durationMinutes: 12,
  intention: 'Notice gratitude, presence, and the next faithful response in your own life.',
  steps: [
    'Settle and choose a scripture, prayer, or source you personally trust.',
    'Review the day with gratitude before analysis.',
    'Name one moment of consolation, tension, or need for repair in your own words.',
    'Record one small next response without making claims for anyone else.',
  ],
  sourceRefs: [practiceSource('Christian contemplative practice', 'User-selected scripture, prayer, or trusted tradition-specific source.')],
  privacyClass: 'sensitive',
  safetyBoundary: 'This is private reflection, not pastoral authority, mental-health treatment, or a substitute for professional care.',
};

const taoistObservation: Practice = {
  id: 'taoist-observation-practice',
  title: 'Taoist observation practice',
  domain: 'spiritual',
  tradition: 'Taoist practice',
  durationMinutes: 10,
  intention: 'Observe effort, balance, and the conditions around a chosen action without forcing a conclusion.',
  steps: [
    'Choose a source or teaching context that you trust and can name.',
    'Observe breath, posture, and the immediate environment without medical interpretation.',
    'Write what felt forced, what felt natural, and what can remain unresolved.',
    'Choose one proportionate action for the next part of the day.',
  ],
  sourceRefs: [practiceSource('Taoist practice', 'User-selected translation, teacher, or source with context recorded.')],
  privacyClass: 'sensitive',
  safetyBoundary: 'This is reflective practice only; it does not provide medical, spiritual, or therapeutic direction.',
};

const tantraContextPractice: Practice = {
  id: 'tantra-context-and-intention',
  title: 'Tantra-oriented context and intention practice',
  domain: 'spiritual',
  tradition: 'Tantra-oriented practice',
  durationMinutes: 10,
  intention: 'Approach a chosen source with consent, context, and careful self-observation.',
  steps: [
    'Name the lineage, teacher, or source context you are choosing to study.',
    'Set a consent-aware, non-coercive intention for private reflection or study.',
    'Record one insight and one question without treating the system as universal doctrine.',
    'If a practice raises physical, relational, or psychological safety concerns, pause and seek qualified guidance.',
  ],
  sourceRefs: [practiceSource('Tantra-oriented practice', 'User-selected, contextualized source or qualified teacher reference.')],
  privacyClass: 'sensitive',
  safetyBoundary: 'No sexual, medical, coercive, or unsafe instruction is generated. Context, consent, and qualified guidance remain explicit.',
};

const personalRuleOfLifePractice: Practice = {
  id: 'personal-rule-of-life-practice',
  title: 'Personal rule of life',
  domain: 'spiritual',
  tradition: 'User-authored',
  durationMinutes: 10,
  intention: 'Choose a small, repeatable practice that reflects your own commitments and current context.',
  steps: [
    'Write the practice, its duration, and the context you want to protect.',
    'Name the source, teacher, tradition, or personal experience that informs it, if any.',
    'Complete the bounded session and record an observation in your own words.',
    'Decide whether it belongs in your Palace as a private, evidence-linked trace.',
  ],
  sourceRefs: [],
  privacyClass: 'sensitive',
  safetyBoundary: 'The agent may format, reflect, and propose. You remain the author and decision-maker for this practice.',
};

export const SPIRITUAL_PRACTICE_PACKS: SpiritualPracticePack[] = [
  {
    id: 'christian-contemplative',
    label: 'Christian contemplative practice',
    tradition: 'Christian contemplative practice',
    posture: 'Source-aware, private reflection and disciplined attention.',
    sourceRequirement: 'Record the selected scripture, prayer, translation, or teacher context before treating a session as sourced.',
    safetyBoundary: christianExamen.safetyBoundary,
    practices: [christianExamen],
  },
  {
    id: 'taoist-practice',
    label: 'Taoist practice',
    tradition: 'Taoist practice',
    posture: 'Observation, proportion, and private reflection without universalizing conclusions.',
    sourceRequirement: 'Record the translation, teacher, or textual context selected by the practitioner.',
    safetyBoundary: taoistObservation.safetyBoundary,
    practices: [taoistObservation],
  },
  {
    id: 'tantra-oriented',
    label: 'Tantra-oriented study and practice',
    tradition: 'Tantra-oriented practice',
    posture: 'Context, consent, and source-aware personal study.',
    sourceRequirement: 'Record the lineage, source, and qualified guidance context before any deeper practice.',
    safetyBoundary: tantraContextPractice.safetyBoundary,
    practices: [tantraContextPractice],
  },
  {
    id: 'personal-rule-of-life',
    label: 'Personal rule of life',
    tradition: 'User-authored',
    posture: 'A private, revisable practice rhythm designed by the user.',
    sourceRequirement: 'The user writes the source, intention, and boundary for each practice.',
    safetyBoundary: 'The agent may format, reflect, and propose. The user remains the author and decision-maker.',
    practices: [personalRuleOfLifePractice],
  },
];

export function getLiveOSCommand(id: string): LiveOSCommandDefinition | undefined {
  return LIVEOS_COMMANDS.find((command) => command.id === id);
}

export function parseLiveOSCommand(input: string): ParsedLiveOSCommand | undefined {
  const normalized = input.trim();
  const definition = [...LIVEOS_COMMANDS]
    .sort((left, right) => right.id.length - left.id.length)
    .find((candidate) => normalized === candidate.id || normalized.startsWith(`${candidate.id} `));

  if (!definition) {
    return undefined;
  }

  return {
    definition,
    argument: normalized.slice(definition.id.length).trim(),
  };
}

export function createLiveOSActionRequest(
  input: string,
  options: CreateLiveOSActionRequestOptions,
): ActionRequest {
  const parsed = parseLiveOSCommand(input);

  if (!parsed) {
    throw new Error(`Unsupported LiveOS command: ${input}`);
  }

  return {
    id: options.id,
    command: parsed.definition.id,
    mode: options.mode ?? 'plan',
    scope: parsed.definition.scope,
    requestedOutcome: parsed.argument || parsed.definition.outputLabel,
    inputs: options.inputs ?? {},
    sourceRefs: options.sourceRefs ?? [],
    requestedAt: options.requestedAt ?? new Date().toISOString(),
  };
}

export function getLiveOSModule(id: string): LiveOSModule | undefined {
  return LIVEOS_MODULES.find((module) => module.id === id);
}

export function createLiveOSReceipt(request: ActionRequest, now = new Date().toISOString()): ActionReceipt {
  const command = getLiveOSCommand(request.command);
  const approvalRequired = requestNeedsApproval(request) || command?.requiresApproval === true;
  const status = approvalRequired ? 'needs-approval' : 'completed';
  const outputLabel = command?.outputLabel ?? 'A bounded, local-only LiveOS response.';

  return {
    id: `receipt-${request.id}`,
    actionId: request.id,
    command: request.command,
    status,
    summary: approvalRequired
      ? `${outputLabel} Review it before any state change or external handoff.`
      : `${outputLabel} No external action was taken.`,
    evidenceRefs: request.sourceRefs,
    dashboardRoute: command?.dashboardRoute ?? '/today',
    approvalRequired,
    issuedAt: now,
  };
}

export function createDefaultLifeOverview(now = new Date()): LifeOverview {
  const date = now.toISOString().slice(0, 10);
  const practice = personalRuleOfLifePractice;

  return {
    date,
    intention: 'Bring honest attention to one practice and leave a useful trace.',
    nextAction: `Begin ${practice.title}.`,
    activePractice: practice,
    anchors: [],
    privacyClass: 'private',
  };
}
