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

export type EvidenceStance =
  | 'clinician-directed'
  | 'guideline-backed'
  | 'traditional-practice'
  | 'personal-experiment'
  | 'research-only'
  | 'unsupported';

export type SafetyLevel = 'wellness' | 'medical-prep' | 'research-only' | 'urgent';

export interface HealthSource {
  title: string;
  url?: string;
  stance: EvidenceStance;
}

export interface HealthArtifact {
  id: string;
  title: string;
  domain: HealthDomain;
  safetyLevel: SafetyLevel;
  summary: string;
  evidenceChecked: string;
  sources: HealthSource[];
  nextActions: string[];
  clinicianQuestions: string[];
  refusals: string[];
}

export interface HealthIntent {
  rawText: string;
  domain: HealthDomain;
  safetyLevel: SafetyLevel;
  routeTo: 'agentic-health-os' | 'clinician' | 'emergency-care' | 'life-sciences-researcher';
  reason: string;
}

export interface HealthBriefInput {
  title?: string;
  goal: string;
  context?: string[];
  constraints?: string[];
  evidenceChecked?: string;
  sources?: HealthSource[];
}

const DEFAULT_REFUSALS = [
  'No diagnosis or reassurance.',
  'No lab, pathology, imaging, biomarker, or genetic interpretation.',
  'No medication, supplement, dose, treatment, or delay recommendations.',
  'No replacement for licensed clinicians, emergency care, or care-team instructions.',
];

const today = () => new Date().toISOString().slice(0, 10);

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function createArtifact(input: {
  title: string;
  domain: HealthDomain;
  safetyLevel: SafetyLevel;
  summary: string;
  evidenceChecked?: string;
  sources?: HealthSource[];
  nextActions: string[];
  clinicianQuestions?: string[];
}): HealthArtifact {
  return {
    id: input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    title: input.title,
    domain: input.domain,
    safetyLevel: input.safetyLevel,
    summary: input.summary,
    evidenceChecked: input.evidenceChecked ?? today(),
    sources: input.sources ?? [],
    nextActions: input.nextActions,
    clinicianQuestions: input.clinicianQuestions ?? [],
    refusals: DEFAULT_REFUSALS,
  };
}

export class AgenticHealthOS {
  classifyHealthIntent(rawText: string): HealthIntent {
    const text = rawText.toLowerCase();

    if (
      includesAny(text, [
        'emergency',
        'chest pain',
        'can’t breathe',
        "can't breathe",
        'shortness of breath',
        'stroke',
        'suicidal',
        'severe bleeding',
      ])
    ) {
      return {
        rawText,
        domain: 'clinician-handoff',
        safetyLevel: 'urgent',
        routeTo: 'emergency-care',
        reason: 'The request includes urgent symptom language.',
      };
    }

    if (includesAny(text, ['pubmed', 'clinical trial', 'clinicaltrials', 'gene', 'variant', 'chembl', 'alphafold'])) {
      return {
        rawText,
        domain: 'research-routing',
        safetyLevel: 'research-only',
        routeTo: 'life-sciences-researcher',
        reason: 'The request is biomedical research lookup rather than personal health planning.',
      };
    }

    if (
      includesAny(text, [
        'diagnosis',
        'pathology',
        'lab result',
        'imaging',
        'mri',
        'ct scan',
        'medication',
        'supplement',
        'cancer',
        'treatment',
      ])
    ) {
      return {
        rawText,
        domain: 'clinician-handoff',
        safetyLevel: 'medical-prep',
        routeTo: 'clinician',
        reason: 'The request needs clinician-directed interpretation or care decisions.',
      };
    }

    if (includesAny(text, ['sleep'])) {
      return { rawText, domain: 'sleep', safetyLevel: 'wellness', routeTo: 'agentic-health-os', reason: 'Sleep workflow.' };
    }
    if (includesAny(text, ['training', 'workout', 'cardio', 'strength'])) {
      return { rawText, domain: 'training', safetyLevel: 'wellness', routeTo: 'agentic-health-os', reason: 'Training workflow.' };
    }
    if (includesAny(text, ['food', 'nutrition', 'macro', 'meal'])) {
      return { rawText, domain: 'nutrition', safetyLevel: 'wellness', routeTo: 'agentic-health-os', reason: 'Nutrition workflow.' };
    }

    return {
      rawText,
      domain: 'recovery',
      safetyLevel: 'wellness',
      routeTo: 'agentic-health-os',
      reason: 'General personal health organization workflow.',
    };
  }

  createWeeklyHealthReview(input: HealthBriefInput): HealthArtifact {
    return createArtifact({
      title: input.title ?? 'Weekly Health Review',
      domain: 'recovery',
      safetyLevel: 'wellness',
      summary: `Organize weekly health signals around this goal: ${input.goal}.`,
      evidenceChecked: input.evidenceChecked,
      sources: input.sources,
      nextActions: [
        'Review energy, sleep, training load, nutrition consistency, stress, and recovery signals.',
        'Name one adjustment for the next seven days that does not conflict with clinician guidance.',
        'Escalate symptoms, abnormal results, or medication questions to a licensed clinician.',
      ],
      clinicianQuestions: input.constraints?.map((constraint) => `Does this constraint change what is safe for me? ${constraint}`),
    });
  }

  createNutritionBrief(input: HealthBriefInput): HealthArtifact {
    return createArtifact({
      title: input.title ?? 'Nutrition Brief',
      domain: 'nutrition',
      safetyLevel: 'wellness',
      summary: `Prepare a nutrition conversation and tracking loop for: ${input.goal}.`,
      evidenceChecked: input.evidenceChecked,
      sources: input.sources,
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
    return createArtifact({
      title: input.title ?? 'Training Brief',
      domain: 'training',
      safetyLevel: 'wellness',
      summary: `Prepare a training and recovery loop for: ${input.goal}.`,
      evidenceChecked: input.evidenceChecked,
      sources: input.sources,
      nextActions: [
        'Inventory current capacity, injuries, equipment, schedule, and recovery constraints.',
        'Separate strength, aerobic base, mobility, and recovery goals before adding intensity.',
        'Route pain, dizziness, chest symptoms, post-surgical limits, or medical restrictions to qualified care.',
      ],
      clinicianQuestions: input.constraints?.map((constraint) => `Does this limit change training safety? ${constraint}`),
    });
  }

  createClinicianHandoff(input: HealthBriefInput): HealthArtifact {
    return createArtifact({
      title: input.title ?? 'Clinician Handoff',
      domain: 'clinician-handoff',
      safetyLevel: 'medical-prep',
      summary: `Prepare a concise clinician-facing summary for: ${input.goal}.`,
      evidenceChecked: input.evidenceChecked,
      sources: input.sources,
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
    return createArtifact({
      title: input.title ?? 'Health Protocol Packet',
      domain: 'medical-records',
      safetyLevel: 'medical-prep',
      summary: `Create a private packet that applies public Health Intelligence System templates to: ${input.goal}.`,
      evidenceChecked: input.evidenceChecked,
      sources: input.sources,
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
