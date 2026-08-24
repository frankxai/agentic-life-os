import { z } from 'zod';

const CONTROL_CHARACTERS = /[\p{Cc}\p{Cf}\u2028\u2029]/u;

function boundedSingleLine(min: number, max: number) {
  return z.string().min(min).max(max).refine(
    (value) =>
      value === value.normalize('NFC') &&
      value === value.trim() &&
      !CONTROL_CHARACTERS.test(value),
    'must be trimmed NFC text without control or formatting characters'
  );
}

function boundedPattern(min: number, max: number, pattern: RegExp, message: string) {
  return z.string().min(min).max(max).regex(pattern, message).refine(
    (value) =>
      value === value.normalize('NFC') &&
      value === value.trim() &&
      !CONTROL_CHARACTERS.test(value),
    'must be trimmed NFC text without control or formatting characters'
  );
}

const IdentifierSchema = boundedPattern(
  1, 100, /^[A-Za-z0-9][A-Za-z0-9._/-]*$/, 'must be a bounded identifier'
);
const ModuleKeySchema = boundedPattern(
  1, 64, /^[a-z][A-Za-z0-9]*$/, 'must be a lower-camel module key'
);
const DisplayNameSchema = boundedPattern(
  1, 120, /^[\p{L}\p{N}][\p{L}\p{N} .&()'’+:/-]*$/u, 'must be a safe display name'
);
const ProseSchema = boundedSingleLine(1, 1_000);
const ShortTextSchema = boundedSingleLine(1, 200);

const RepoRelativePathSchema = boundedSingleLine(1, 240).refine(
  (value) =>
    !value.includes('\\') &&
    !value.startsWith('/') &&
    !/^[A-Za-z]:/.test(value) &&
    value.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..'),
  'path must be normalized and repository-relative'
);

export const OSModuleSchema = z.object({
  repoName: IdentifierSchema,
  path: RepoRelativePathSchema,
  status: z.enum(['in-development', 'dormant', 'archive']),
  riskLevel: z.enum(['private', 'library', 'template']),
  healthCheck: z.literal('vitest-module'),
  activeAgents: z.array(DisplayNameSchema).min(1).max(16),
  purpose: ProseSchema,
}).strict();

export type OSModule = z.infer<typeof OSModuleSchema>;

export const OfferPackageSchema = z.object({
  name: DisplayNameSchema,
  audience: ProseSchema,
  promise: ProseSchema,
  deliveryMode: ProseSchema,
  commercialStatus: z.enum(['free', 'proposed-not-priced', 'priced', 'private-only']),
  supportBoundary: ProseSchema,
}).strict();

export type OfferPackage = z.infer<typeof OfferPackageSchema>;

export const AgenticLifeOSOfferingSchema = z.object({
  name: DisplayNameSchema,
  audience: ProseSchema,
  promise: ProseSchema,
  status: z.enum(['draft', 'active', 'public-wrapper', 'private-operator-suite']),
  deliveryMode: ProseSchema,
  publicBoundary: ProseSchema,
  packages: z.array(OfferPackageSchema).min(1).max(16),
}).strict();

export type AgenticLifeOSOffering = z.infer<typeof AgenticLifeOSOfferingSchema>;

export const IntelligenceSystemSchema = z.object({
  name: DisplayNameSchema,
  repoName: IdentifierSchema,
  layer: z.enum([
    'substrate',
    'memory',
    'orchestration',
    'swarm-runtime',
    'agent-governance',
    'capability-index',
    'domain-vertical',
    'distribution',
    'quality-gate',
  ]),
  publicStatus: z.enum(['publication-candidate', 'private', 'hybrid']),
  purpose: ProseSchema,
  proofGate: ProseSchema,
}).strict();

export type IntelligenceSystem = z.infer<typeof IntelligenceSystemSchema>;

export const EstateRepoSchema = z.object({
  name: IdentifierSchema,
  lane: z.enum([
    'master-offer',
    'substrate',
    'agent-ops',
    'swarm',
    'business',
    'creator',
    'learning',
    'growth',
    'wealth',
    'health',
    'family',
    'creative-platform',
    'distribution',
    'quality',
    'archive',
  ]),
  role: ProseSchema,
  source: z.enum(['repo-evidenced', 'doc-evidenced', 'inferred']),
  status: z.enum(['primary', 'supporting', 'candidate', 'watch', 'archive']),
}).strict();

export type EstateRepo = z.infer<typeof EstateRepoSchema>;

export const OperatingLoopSchema = z.object({
  name: DisplayNameSchema,
  cadence: ShortTextSchema,
  owner: IdentifierSchema,
  purpose: ProseSchema,
  inputs: z.array(ProseSchema).min(1).max(32),
  outputs: z.array(ProseSchema).min(1).max(32),
  safetyGate: ProseSchema,
}).strict();

export type OperatingLoop = z.infer<typeof OperatingLoopSchema>;

const HealthArtifactBindingsSchema = z.tuple([
  z.literal('pinVersion'),
  z.literal('repository'),
  z.literal('commitSha'),
  z.literal('artifactVersion'),
  z.literal('artifactPath'),
  z.literal('mediaType'),
  z.literal('byteLength'),
  z.literal('sha256'),
]);

const ProhibitedPublicDataSchema = z.tuple([
  z.literal('raw-health-records'),
  z.literal('clinical-data'),
  z.literal('genomic-data'),
  z.literal('family-records'),
  z.literal('secrets'),
  z.literal('authority-state'),
  z.literal('personal-metrics'),
]);

const ProhibitedAgentActionsSchema = z.tuple([
  z.literal('diagnosis'),
  z.literal('treatment'),
  z.literal('medication-change'),
  z.literal('result-interpretation'),
  z.literal('emergency-reassurance'),
  z.literal('autonomous-transport'),
  z.literal('public-storage-of-private-records'),
]);

const FamilyDataGateSchema = z.object({
  dataClasses: z.tuple([
    z.literal('family-records'),
    z.literal('genomic-data'),
  ]),
  deniedDestinations: z.tuple([
    z.literal('memory'),
    z.literal('creator'),
  ]),
  requiredControls: z.tuple([
    z.literal('private-encrypted-deployment'),
    z.literal('consent'),
    z.literal('audit'),
    z.literal('backup-restore'),
    z.literal('audience-authorization'),
    z.literal('succession-controls'),
  ]),
}).strict();

export const PublicContractSchema = z.object({
  assetSchemaVersion: z.literal('1.3.0'),
  runtime: z.object({
    mode: z.literal('local-open-core'),
    authority: z.literal('private-runtime-authority-store'),
    defaultAdmission: z.literal('deny'),
  }).strict(),
  healthKnowledgeSource: z.object({
    repository: z.literal('frankxai/health-intelligence-system'),
    requiredBindings: HealthArtifactBindingsSchema,
  }).strict(),
  prohibitedPublicData: ProhibitedPublicDataSchema,
  prohibitedAgentActions: ProhibitedAgentActionsSchema,
  familyDataGate: FamilyDataGateSchema,
}).strict();

export type PublicContract = z.infer<typeof PublicContractSchema>;

export const LifeOSProfileSchema = z.object({
  systemName: DisplayNameSchema,
  version: z.literal('1.4.0'),
  sipVersion: z.literal('1.1.1'),
  profileAssertionStatus: z.literal('unverified-declarative-configuration'),
  workstation: z.object({
    machineName: IdentifierSchema,
    os: ProseSchema,
  }).strict(),
  modules: z.record(ModuleKeySchema, OSModuleSchema).refine(
    (modules) => Object.keys(modules).length >= 1 && Object.keys(modules).length <= 32,
    'modules must contain 1 to 32 entries'
  ),
  offering: AgenticLifeOSOfferingSchema.optional(),
  intelligenceSystems: z.array(IntelligenceSystemSchema).max(32).default([]),
  estateRepos: z.array(EstateRepoSchema).max(64).default([]),
  operatingLoops: z.array(OperatingLoopSchema).max(32).default([]),
  publicContract: PublicContractSchema,
}).strict();

export type LifeOSProfile = z.infer<typeof LifeOSProfileSchema>;
