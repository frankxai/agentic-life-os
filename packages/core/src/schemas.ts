import { z } from 'zod';

export const OSModuleSchema = z.object({
  repoName: z.string(),
  path: z.string(),
  status: z.enum(['live', 'in-development', 'dormant', 'archive']),
  riskLevel: z.enum(['production', 'private', 'library', 'template', 'backup-sensitive']),
  healthCommand: z.string(),
  activeAgents: z.array(z.string()),
  purpose: z.string(),
});

export type OSModule = z.infer<typeof OSModuleSchema>;

export const OfferPackageSchema = z.object({
  name: z.string(),
  audience: z.string(),
  promise: z.string(),
  deliveryMode: z.string(),
  commercialStatus: z.enum(['free', 'proposed-not-priced', 'priced', 'private-only']),
  supportBoundary: z.string(),
});

export type OfferPackage = z.infer<typeof OfferPackageSchema>;

export const AgenticLifeOSOfferingSchema = z.object({
  name: z.string(),
  audience: z.string(),
  promise: z.string(),
  status: z.enum(['draft', 'active', 'public-wrapper', 'private-operator-suite']),
  deliveryMode: z.string(),
  publicBoundary: z.string(),
  packages: z.array(OfferPackageSchema),
});

export type AgenticLifeOSOffering = z.infer<typeof AgenticLifeOSOfferingSchema>;

export const IntelligenceSystemSchema = z.object({
  name: z.string(),
  repoName: z.string(),
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
  publicStatus: z.enum(['public-safe', 'private', 'hybrid']),
  purpose: z.string(),
  proofGate: z.string(),
});

export type IntelligenceSystem = z.infer<typeof IntelligenceSystemSchema>;

export const EstateRepoSchema = z.object({
  name: z.string(),
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
  role: z.string(),
  source: z.enum(['verified', 'repo-evidenced', 'doc-evidenced', 'inferred']),
  status: z.enum(['primary', 'supporting', 'candidate', 'watch', 'archive']),
});

export type EstateRepo = z.infer<typeof EstateRepoSchema>;

export const OperatingLoopSchema = z.object({
  name: z.string(),
  cadence: z.string(),
  owner: z.string(),
  purpose: z.string(),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  safetyGate: z.string(),
});

export type OperatingLoop = z.infer<typeof OperatingLoopSchema>;

export const LifeOSProfileSchema = z.object({
  systemName: z.string(),
  version: z.string(),
  sipVersion: z.string(),
  workstation: z.object({
    machineName: z.string(),
    os: z.string(),
  }),
  modules: z.record(z.string(), OSModuleSchema),
  offering: AgenticLifeOSOfferingSchema.optional(),
  intelligenceSystems: z.array(IntelligenceSystemSchema).default([]),
  estateRepos: z.array(EstateRepoSchema).default([]),
  operatingLoops: z.array(OperatingLoopSchema).default([]),
});

export type LifeOSProfile = z.infer<typeof LifeOSProfileSchema>;
