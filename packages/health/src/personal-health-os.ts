import { snapshotExactOwnData } from './integrity.js';

export type HealthDomain =
  | 'nutrition'
  | 'training'
  | 'sleep'
  | 'recovery'
  | 'stress'
  | 'medical-records'
  | 'screening-prep'
  | 'clinician-handoff'
  | 'integrative-wisdom'
  | 'research-routing';

export type ClaimedEvidenceStance =
  | 'clinician-directed'
  | 'guideline-backed'
  | 'traditional-practice'
  | 'personal-experiment'
  | 'research-only'
  | 'unsupported';

const EVIDENCE_STANCES = new Set<ClaimedEvidenceStance>([
  'clinician-directed',
  'guideline-backed',
  'traditional-practice',
  'personal-experiment',
  'research-only',
  'unsupported',
]);
const SET_HAS = Set.prototype.has;

export type SafetyLevel = 'wellness' | 'medical-prep' | 'research-only' | 'urgent';

export interface HealthSourceInput {
  readonly title: string;
  readonly url?: string;
  readonly claimedStance: ClaimedEvidenceStance;
}

export interface UnverifiedHealthSourceNote extends HealthSourceInput {
  readonly claimStatus: 'unverified-caller-supplied';
}

export interface HealthArtifact {
  readonly id: string;
  readonly title: string;
  readonly domain: HealthDomain;
  readonly safetyLevel: SafetyLevel;
  readonly summary: string;
  readonly generatedOn: string;
  readonly sourceStatus: 'none' | 'unverified-caller-supplied';
  readonly claimedSourceReviewDate: string | null;
  readonly sources: readonly UnverifiedHealthSourceNote[];
  readonly nextActions: readonly string[];
  readonly clinicianQuestions: readonly string[];
  readonly refusals: readonly string[];
}

export interface HealthIntent {
  inputIncluded: false;
  domain: HealthDomain;
  safetyLevel: SafetyLevel;
  routeTo: 'agentic-health-os' | 'clinician' | 'emergency-care' | 'life-sciences-researcher';
  reason: string;
  limitation: 'keyword-routing-is-not-an-emergency-or-clinical-safety-boundary';
}

export type HealthBriefFocus =
  | 'weekly-pattern-review'
  | 'nutrition-consistency'
  | 'training-consistency'
  | 'clinician-visit-preparation'
  | 'record-organization';

export interface HealthBriefInput {
  focus: HealthBriefFocus;
  claimedSourceReviewDate?: string;
  sources?: readonly HealthSourceInput[];
}

const DEFAULT_REFUSALS = Object.freeze([
  'No diagnosis or reassurance.',
  'No lab, pathology, imaging, biomarker, or genetic interpretation.',
  'No medication, supplement, dose, treatment, or delay recommendations.',
  'No replacement for licensed clinicians, emergency care, or care-team instructions.',
]);

const today = () => new Date().toISOString().slice(0, 10);

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function routedIntent(
  domain: HealthDomain,
  safetyLevel: SafetyLevel,
  routeTo: HealthIntent['routeTo'],
  reason: string,
): HealthIntent {
  return {
    inputIncluded: false,
    domain,
    safetyLevel,
    routeTo,
    reason,
    limitation: 'keyword-routing-is-not-an-emergency-or-clinical-safety-boundary',
  };
}

function normalizeOrdinaryDenseArray(value: unknown, label: string, maximum: number): readonly unknown[] {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
      throw new Error('invalid array');
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
    if (
      lengthDescriptor === undefined ||
      !('value' in lengthDescriptor) ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0 ||
      lengthDescriptor.value > maximum
    ) {
      throw new Error('invalid array length');
    }
    const length = lengthDescriptor.value as number;
    const expectedKeys = new Set(['length']);
    for (let index = 0; index < length; index += 1) expectedKeys.add(String(index));
    const ownKeys = Reflect.ownKeys(value);
    if (
      ownKeys.length !== expectedKeys.size ||
      ownKeys.some((key) => typeof key !== 'string' || !expectedKeys.has(key))
    ) {
      throw new Error('invalid array keys');
    }
    const snapshot: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || !descriptor.enumerable || !('value' in descriptor)) {
        throw new Error('invalid array element');
      }
      snapshot.push(descriptor.value);
    }
    return Object.freeze(snapshot);
  } catch {
    throw new Error(`${label} must be a bounded ordinary dense array.`);
  }
}

function normalizeStructuredBriefInput(
  input: HealthBriefInput,
  expectedFocus: HealthBriefFocus,
): Readonly<HealthBriefInput> {
  try {
    const snapshot = snapshotExactOwnData(
      input,
      ['focus'],
      ['claimedSourceReviewDate', 'sources'],
      'Structured health brief',
    );
    const focus = snapshot.focus;
    const claimedSourceReviewDate = snapshot.claimedSourceReviewDate;
    const sources = snapshot.sources;
    if (
      focus !== expectedFocus ||
      (claimedSourceReviewDate !== undefined && typeof claimedSourceReviewDate !== 'string')
    ) {
      throw new Error('invalid structured health brief');
    }
    return Object.freeze({
      focus: expectedFocus,
      ...(claimedSourceReviewDate === undefined ? {} : { claimedSourceReviewDate }),
      ...(sources === undefined ? {} : { sources: sources as readonly HealthSourceInput[] }),
    });
  } catch {
    throw new Error(`Structured health brief requires focus=${expectedFocus} and accepts no free-text fields.`);
  }
}

function normalizeSourceNotes(value: unknown): readonly UnverifiedHealthSourceNote[] {
  if (value === undefined) return Object.freeze([]);
  const sourceEntries = normalizeOrdinaryDenseArray(value, 'Sources', 32);
  const normalizedSources = sourceEntries.map((rawSource) => {
    let snapshot: Readonly<Record<string, unknown>>;
    try {
      snapshot = snapshotExactOwnData(rawSource, ['title', 'claimedStance'], ['url'], 'Source note');
    } catch {
      throw new Error('Source note is malformed or uses an unknown evidence stance.');
    }
    const title = snapshot.title;
    const claimedStance = snapshot.claimedStance;
    const url = snapshot.url;
    if (
      typeof title !== 'string' ||
      !Reflect.apply(SET_HAS, EVIDENCE_STANCES, [claimedStance as ClaimedEvidenceStance])
    ) {
      throw new Error('Source note is malformed or uses an unknown evidence stance.');
    }
    const normalizedTitle = title.normalize('NFC').trim();
    if (
      normalizedTitle.length < 3 ||
      normalizedTitle.length > 300 ||
      /[\p{Cc}\p{Cf}\u2028\u2029]/u.test(normalizedTitle)
    ) {
      throw new Error('Source title must be a bounded single-line note.');
    }
    let normalizedUrl: string | undefined;
    if (url !== undefined) {
      if (typeof url !== 'string' || url.length > 2_048) {
        throw new Error('Source URL must be a bounded HTTPS URL without credentials.');
      }
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        throw new Error('Source URL must be a valid HTTPS URL.');
      }
      if (parsedUrl.protocol !== 'https:' || parsedUrl.username !== '' || parsedUrl.password !== '') {
        throw new Error('Source URL must be a bounded HTTPS URL without credentials.');
      }
      normalizedUrl = parsedUrl.toString();
    }
    return Object.freeze({
      title: normalizedTitle,
      ...(normalizedUrl === undefined ? {} : { url: normalizedUrl }),
      claimedStance: claimedStance as ClaimedEvidenceStance,
      claimStatus: 'unverified-caller-supplied' as const,
    });
  });
  return Object.freeze(normalizedSources);
}

function createArtifact(input: {
  title: string;
  domain: HealthDomain;
  safetyLevel: SafetyLevel;
  summary: string;
  claimedSourceReviewDate?: string;
  sources?: readonly HealthSourceInput[];
  nextActions: readonly string[];
  clinicianQuestions?: readonly string[];
}): HealthArtifact {
  const sources = normalizeSourceNotes(input.sources);
  if (input.claimedSourceReviewDate !== undefined) {
    const parsed = new Date(`${input.claimedSourceReviewDate}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(input.claimedSourceReviewDate) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== input.claimedSourceReviewDate ||
      input.claimedSourceReviewDate > today() ||
      sources.length === 0
    ) {
      throw new Error('Claimed source review date requires a real, non-future date and at least one source note.');
    }
  }
  return Object.freeze({
    id: input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    title: input.title,
    domain: input.domain,
    safetyLevel: input.safetyLevel,
    summary: input.summary,
    generatedOn: today(),
    sourceStatus: sources.length === 0 ? 'none' : 'unverified-caller-supplied',
    claimedSourceReviewDate: input.claimedSourceReviewDate ?? null,
    sources,
    nextActions: Object.freeze([...input.nextActions]),
    clinicianQuestions: Object.freeze([...(input.clinicianQuestions ?? [])]),
    refusals: Object.freeze([...DEFAULT_REFUSALS]),
  });
}

export class AgenticHealthOS {
  classifyHealthIntent(rawText: string): HealthIntent {
    if (typeof rawText !== 'string' || rawText.length > 4_000) {
      return routedIntent(
        'clinician-handoff',
        'medical-prep',
        'clinician',
        'The input cannot be safely classified by the bounded keyword router.',
      );
    }
    const text = rawText.toLowerCase();
    const hasPersonalContext = /\b(my|mine|me|i|we|our|patient)\b/i.test(text);
    const hasResearchSignal = includesAny(text, [
      'pubmed',
      'clinical trial',
      'clinicaltrials',
      'gene',
      'variant',
      'chembl',
      'alphafold',
    ]);
    const hasInterpretiveSignal = includesAny(text, [
      'interpret',
      'what does',
      'meaning of',
      'risk for',
      'pathogenic',
      'positive result',
      'negative result',
      'should i',
    ]);

    if (
      includesAny(text, [
        'emergency',
        'chest pain',
        'cannot breathe',
        'can’t breathe',
        "can't breathe",
        'difficulty breathing',
        'not breathing',
        'shortness of breath',
        'heart attack',
        'stroke',
        'suicidal',
        'suicide',
        'kill myself',
        'hurt myself',
        'self harm',
        'severe bleeding',
        'unconscious',
        'seizure',
        'overdose',
        'anaphylaxis',
        'choking',
        'ich kann nicht atmen',
        'atemnot',
        'brustschmerz',
        'herzinfarkt',
        'schlaganfall',
        'suizid',
        'mich umbringen',
        'starke blutung',
      ])
    ) {
      return routedIntent(
        'clinician-handoff',
        'urgent',
        'emergency-care',
        'The request includes urgent English or German safety language; keyword routing can still miss emergencies.',
      );
    }

    if (
      includesAny(text, [
        'diagnosis',
        'symptom',
        'pathology',
        'biopsy',
        'malignant',
        'lab result',
        'test result',
        'imaging',
        'mri',
        'ct scan',
        'medication',
        'medicine',
        'drug',
        'dose',
        'dosage',
        'insulin',
        'supplement',
        'cancer',
        'treatment',
        'blood sugar',
        'a1c',
        'blood pressure',
        'diabetes',
        'pregnant',
        'pregnancy',
        'injury',
        'pain',
        'biomarker',
      ]) ||
      hasInterpretiveSignal ||
      (hasPersonalContext && hasResearchSignal)
    ) {
      return routedIntent(
        'clinician-handoff',
        'medical-prep',
        'clinician',
        'The request may need clinician-directed interpretation or a care decision.',
      );
    }

    if (hasResearchSignal) {
      return routedIntent(
        'research-routing',
        'research-only',
        'life-sciences-researcher',
        'The request appears to be a non-personal biomedical literature or database lookup.',
      );
    }

    return routedIntent(
      'clinician-handoff',
      'medical-prep',
      'clinician',
      'Conservative fallback: free text cannot establish a wellness-safe action. Use an explicit structured wellness method instead.',
    );
  }

  createWeeklyHealthReview(input: HealthBriefInput): HealthArtifact {
    const brief = normalizeStructuredBriefInput(input, 'weekly-pattern-review');
    return createArtifact({
      title: 'Weekly Health Review',
      domain: 'recovery',
      safetyLevel: 'wellness',
      summary: 'Organize a bounded weekly review of non-clinical wellness patterns.',
      claimedSourceReviewDate: brief.claimedSourceReviewDate,
      sources: brief.sources,
      nextActions: [
        'Review energy, sleep, training load, nutrition consistency, stress, and recovery signals.',
        'Name one adjustment for the next seven days that does not conflict with clinician guidance.',
        'Escalate symptoms, abnormal results, or medication questions to a licensed clinician.',
      ],
      clinicianQuestions: ['Do any current symptoms, conditions, results, or care instructions change what is safe to track or adjust?'],
    });
  }

  createNutritionBrief(input: HealthBriefInput): HealthArtifact {
    const brief = normalizeStructuredBriefInput(input, 'nutrition-consistency');
    return createArtifact({
      title: 'Nutrition Brief',
      domain: 'nutrition',
      safetyLevel: 'wellness',
      summary: 'Prepare a non-clinical nutrition-consistency tracking and conversation template.',
      claimedSourceReviewDate: brief.claimedSourceReviewDate,
      sources: brief.sources,
      nextActions: [
        'List current eating pattern, constraints, preferences, schedule, and adherence blockers.',
        'Track repeatable meals and satiety/energy observations before changing many variables at once.',
        'Ask a clinician or registered dietitian before using diet to manage a condition.',
      ],
      clinicianQuestions: [
        'Are there medical conditions, labs, medications, allergies, or eating-disorder risks that change nutrition guidance?',
      ],
    });
  }

  createTrainingBrief(input: HealthBriefInput): HealthArtifact {
    const brief = normalizeStructuredBriefInput(input, 'training-consistency');
    return createArtifact({
      title: 'Training Brief',
      domain: 'training',
      safetyLevel: 'wellness',
      summary: 'Prepare a non-clinical training-consistency and recovery template.',
      claimedSourceReviewDate: brief.claimedSourceReviewDate,
      sources: brief.sources,
      nextActions: [
        'Inventory current capacity, injuries, equipment, schedule, and recovery constraints.',
        'Separate strength, aerobic base, mobility, and recovery goals before adding intensity.',
        'Route pain, dizziness, chest symptoms, post-surgical limits, or medical restrictions to qualified care.',
      ],
      clinicianQuestions: ['Do any symptoms, injuries, conditions, medications, or care instructions change training safety?'],
    });
  }

  createClinicianHandoff(input: HealthBriefInput): HealthArtifact {
    const brief = normalizeStructuredBriefInput(input, 'clinician-visit-preparation');
    return createArtifact({
      title: 'Clinician Handoff',
      domain: 'clinician-handoff',
      safetyLevel: 'medical-prep',
      summary: 'Prepare a private, concise clinician-visit information template without interpreting records.',
      claimedSourceReviewDate: brief.claimedSourceReviewDate,
      sources: brief.sources,
      nextActions: [
        'Collect symptoms, timeline, medications, supplements, prior results, and current questions.',
        'Do not interpret results; include raw result names, dates, and source locations.',
        'Ask the care team what decisions are needed, what is urgent, and what follow-up is expected.',
      ],
      clinicianQuestions: [
        'What does this information mean in my case?',
        'What follow-up, if any, do you recommend?',
        'What symptoms or changes should trigger urgent care?',
      ],
    });
  }

  createHealthProtocolPacket(input: HealthBriefInput): HealthArtifact {
    const brief = normalizeStructuredBriefInput(input, 'record-organization');
    return createArtifact({
      title: 'Health Protocol Packet',
      domain: 'medical-records',
      safetyLevel: 'medical-prep',
      summary: 'Create a private record-organization packet from separately verified public Health Intelligence System templates.',
      claimedSourceReviewDate: brief.claimedSourceReviewDate,
      sources: brief.sources,
      nextActions: [
        'Copy public templates into a private workspace before adding personal details.',
        'Keep evidence date, source list, and safety boundary visible in the packet.',
        'Run clinician handoff before making any care decision.',
      ],
      clinicianQuestions: [
        'Which part of this packet is clinically relevant?',
        'What should be corrected before this becomes part of my record?',
      ],
    });
  }
}
