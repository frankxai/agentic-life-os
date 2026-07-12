import { z } from 'zod';

export const LiveOSDomainSchema = z.enum([
  'practice',
  'spiritual',
  'body',
  'fitness',
  'health',
  'intellectual',
  'palace',
  'review',
]);

export type LiveOSDomain = z.infer<typeof LiveOSDomainSchema>;

export const PrivacyClassSchema = z.enum(['public', 'private', 'sensitive', 'regulated']);
export type PrivacyClass = z.infer<typeof PrivacyClassSchema>;

export const ActionModeSchema = z.enum(['read', 'plan', 'propose', 'apply']);
export type ActionMode = z.infer<typeof ActionModeSchema>;

export const ActionStatusSchema = z.enum(['completed', 'needs-approval', 'blocked', 'rejected']);
export type ActionStatus = z.infer<typeof ActionStatusSchema>;

export const EvidenceRefSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['note', 'practice', 'reflection', 'import', 'source', 'receipt', 'handoff']),
  uri: z.string().min(1),
  privacyClass: PrivacyClassSchema,
  recordedAt: z.string().datetime(),
});

export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;

export const ConsentGrantSchema = z.object({
  id: z.string().min(1),
  scope: z.array(z.string().min(1)).min(1),
  privacyClass: PrivacyClassSchema,
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
});

export type ConsentGrant = z.infer<typeof ConsentGrantSchema>;

export const LiveOSModuleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  domain: LiveOSDomainSchema,
  owner: z.string().min(1),
  capabilities: z.array(z.string().min(1)).min(1),
  riskLevel: z.enum(['low', 'guarded', 'high']),
  privacyClass: PrivacyClassSchema,
  sourceAdapter: z.string().min(1),
  dashboardRoute: z.string().startsWith('/'),
  command: z.string().startsWith('/liveos '),
  proofGate: z.string().min(1),
  requiresConsent: z.boolean(),
});

export type LiveOSModule = z.infer<typeof LiveOSModuleSchema>;

export const PracticeSourceSchema = z.object({
  title: z.string().min(1),
  tradition: z.string().min(1),
  citation: z.string().min(1),
  usageNote: z.string().min(1),
});

export type PracticeSource = z.infer<typeof PracticeSourceSchema>;

export const PracticeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  domain: z.enum(['spiritual', 'intellectual', 'body', 'fitness']),
  tradition: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  intention: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1),
  sourceRefs: z.array(PracticeSourceSchema),
  privacyClass: PrivacyClassSchema,
  safetyBoundary: z.string().min(1),
});

export type Practice = z.infer<typeof PracticeSchema>;

export const CheckInSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime(),
  domain: z.enum(['body', 'fitness', 'intellectual', 'review']),
  observations: z.array(z.string().min(1)).min(1),
  privacyClass: PrivacyClassSchema,
});

export type CheckIn = z.infer<typeof CheckInSchema>;

export const FitnessSessionSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime(),
  label: z.string().min(1),
  sessionType: z.enum(['strength', 'aerobic', 'mobility', 'recovery']),
  selfReportedEffort: z.number().int().min(1).max(10).optional(),
  observations: z.array(z.string().min(1)).default([]),
  privacyClass: PrivacyClassSchema,
});

export type FitnessSession = z.infer<typeof FitnessSessionSchema>;

export const LearningSessionSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime(),
  topic: z.string().min(1),
  sourceRefs: z.array(EvidenceRefSchema).default([]),
  insight: z.string().min(1),
  nextQuestion: z.string().min(1),
  privacyClass: PrivacyClassSchema,
});

export type LearningSession = z.infer<typeof LearningSessionSchema>;

export const ReflectionSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime(),
  practiceId: z.string().min(1).optional(),
  body: z.string().min(1),
  nextCommitment: z.string().min(1),
  privacyClass: PrivacyClassSchema,
});

export type Reflection = z.infer<typeof ReflectionSchema>;

export const MemoryAnchorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['practice', 'reflection', 'learning', 'person', 'project', 'source']),
  sourceRefs: z.array(EvidenceRefSchema).min(1),
  privacyClass: PrivacyClassSchema,
  createdAt: z.string().datetime(),
});

export type MemoryAnchor = z.infer<typeof MemoryAnchorSchema>;

export const MemoryLinkSchema = z.object({
  id: z.string().min(1),
  fromAnchorId: z.string().min(1),
  toAnchorId: z.string().min(1),
  relation: z.enum(['continues', 'informs', 'questions', 'supports', 'contrasts']),
  createdAt: z.string().datetime(),
});

export type MemoryLink = z.infer<typeof MemoryLinkSchema>;

export const ActionRequestSchema = z.object({
  id: z.string().min(1),
  command: z.string().startsWith('/liveos '),
  mode: ActionModeSchema,
  scope: z.array(LiveOSDomainSchema).min(1),
  requestedOutcome: z.string().min(1),
  inputs: z.record(z.unknown()).default({}),
  consentId: z.string().min(1).optional(),
  sourceRefs: z.array(EvidenceRefSchema).default([]),
  requestedAt: z.string().datetime(),
});

export type ActionRequest = z.infer<typeof ActionRequestSchema>;

export const ActionReceiptSchema = z.object({
  id: z.string().min(1),
  actionId: z.string().min(1),
  command: z.string().startsWith('/liveos '),
  status: ActionStatusSchema,
  summary: z.string().min(1),
  evidenceRefs: z.array(EvidenceRefSchema).default([]),
  dashboardRoute: z.string().startsWith('/'),
  approvalRequired: z.boolean(),
  issuedAt: z.string().datetime(),
});

export type ActionReceipt = z.infer<typeof ActionReceiptSchema>;

export const ProjectionEnvelopeSchema = z.object({
  id: z.string().min(1),
  vaultId: z.string().min(1),
  deviceId: z.string().min(1),
  schemaVersion: z.string().min(1),
  revision: z.number().int().nonnegative(),
  ciphertext: z.string().min(1),
  metadata: z.object({
    contentType: z.string().min(1),
    byteLength: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
  }),
});

export type ProjectionEnvelope = z.infer<typeof ProjectionEnvelopeSchema>;

export const LifeOverviewSchema = z.object({
  date: z.string().date(),
  intention: z.string().min(1),
  nextAction: z.string().min(1),
  activePractice: PracticeSchema.optional(),
  anchors: z.array(MemoryAnchorSchema).default([]),
  latestReceipt: ActionReceiptSchema.optional(),
  privacyClass: PrivacyClassSchema,
});

export type LifeOverview = z.infer<typeof LifeOverviewSchema>;

export function requestNeedsApproval(request: ActionRequest): boolean {
  return request.mode === 'apply' || request.command === '/liveos health-prep';
}
