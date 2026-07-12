import {
  ProjectionEnvelopeSchema,
  type ProjectionEnvelope,
} from '@frankx-ai/alos-core';

export interface EncryptedProjectionStore {
  put(envelope: ProjectionEnvelope): Promise<void>;
  get(id: string): Promise<ProjectionEnvelope | undefined>;
  list(vaultId: string): Promise<ProjectionEnvelope[]>;
  remove(id: string): Promise<void>;
}

export interface ProjectionConflict {
  current: ProjectionEnvelope;
  incoming: ProjectionEnvelope;
  resolution: 'keep-current' | 'accept-incoming' | 'needs-user-review';
  reason: string;
}

export interface SyncBetaGate {
  status: 'local-only' | 'beta-gated';
  requirements: string[];
  prohibited: string[];
}

export const LOCAL_ONLY_SYNC_GATE: SyncBetaGate = {
  status: 'local-only',
  requirements: [
    'The local vault remains the source of truth.',
    'Only ciphertext envelopes may cross a sync boundary.',
    'A passphrase-owned key and offline recovery kit are required before enabling any remote pairing.',
  ],
  prohibited: [
    'Do not send raw reflections, health artifacts, fitness logs, or private memory content to a remote service.',
    'Do not treat this package as a cryptographic implementation or an enabled cloud sync client.',
  ],
};

export function createProjectionEnvelope(input: ProjectionEnvelope): ProjectionEnvelope {
  return ProjectionEnvelopeSchema.parse(input);
}

export function resolveProjectionConflict(
  current: ProjectionEnvelope,
  incoming: ProjectionEnvelope,
): ProjectionConflict {
  if (current.vaultId !== incoming.vaultId || current.id !== incoming.id) {
    return {
      current,
      incoming,
      resolution: 'needs-user-review',
      reason: 'Projection identities do not match.',
    };
  }

  if (incoming.revision > current.revision) {
    return {
      current,
      incoming,
      resolution: 'accept-incoming',
      reason: 'Incoming revision is newer.',
    };
  }

  if (incoming.revision < current.revision) {
    return {
      current,
      incoming,
      resolution: 'keep-current',
      reason: 'Current revision is newer.',
    };
  }

  return {
    current,
    incoming,
    resolution: 'needs-user-review',
    reason: 'Both encrypted projections have the same revision; ciphertext cannot be safely merged here.',
  };
}

export class InMemoryEncryptedProjectionStore implements EncryptedProjectionStore {
  private readonly records = new Map<string, ProjectionEnvelope>();

  async put(envelope: ProjectionEnvelope): Promise<void> {
    this.records.set(envelope.id, createProjectionEnvelope(envelope));
  }

  async get(id: string): Promise<ProjectionEnvelope | undefined> {
    return this.records.get(id);
  }

  async list(vaultId: string): Promise<ProjectionEnvelope[]> {
    return Array.from(this.records.values()).filter((record) => record.vaultId === vaultId);
  }

  async remove(id: string): Promise<void> {
    this.records.delete(id);
  }
}
