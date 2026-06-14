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

export const LifeOSProfileSchema = z.object({
  systemName: z.string(),
  version: z.string(),
  sipVersion: z.string(),
  workstation: z.object({
    machineName: z.string(),
    os: z.string(),
  }),
  modules: z.record(z.string(), OSModuleSchema),
});

export type LifeOSProfile = z.infer<typeof LifeOSProfileSchema>;
