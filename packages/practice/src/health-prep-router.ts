import {
  AgenticHealthOS,
  type HealthIntent,
} from '@frankx-ai/agentic-health-os';

export interface HealthPreparationRoute {
  intent: HealthIntent;
  allowPrivatePreparation: boolean;
  approvalRequired: boolean;
  userFacingBoundary: string;
}

const healthOS = new AgenticHealthOS();

export function routeHealthPreparation(rawText: string): HealthPreparationRoute {
  const intent = healthOS.classifyHealthIntent(rawText);

  if (intent.routeTo === 'emergency-care') {
    return {
      intent,
      allowPrivatePreparation: false,
      approvalRequired: true,
      userFacingBoundary: 'This workspace cannot assess urgent symptoms. Use local emergency services or the urgent-care route supplied by your qualified care team.',
    };
  }

  if (intent.routeTo === 'clinician') {
    return {
      intent,
      allowPrivatePreparation: true,
      approvalRequired: true,
      userFacingBoundary: 'Prepare a private timeline and clinician questions only. Do not interpret results, recommend treatment, or change medication.',
    };
  }

  if (intent.routeTo === 'life-sciences-researcher') {
    return {
      intent,
      allowPrivatePreparation: true,
      approvalRequired: true,
      userFacingBoundary: 'Mark this as research-only and convert findings into clinician questions rather than personal care instructions.',
    };
  }

  return {
    intent,
    allowPrivatePreparation: true,
    approvalRequired: true,
    userFacingBoundary: 'This is a private wellness organization workflow. Escalate symptoms, abnormal results, medication questions, or care decisions to qualified care.',
  };
}
