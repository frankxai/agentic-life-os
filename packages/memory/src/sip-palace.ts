export type PrivateMemoryOperation = 'index-descriptor' | 'distill-chat';

export interface PrivateMemoryPlan {
  operation: PrivateMemoryOperation;
  opaqueSourceRef: string;
  target: 'private-external-memory-adapter';
  sensitivity: 'unverified-private';
  contentIncluded: false;
  executionPermitted: false;
  authorityStatus: 'unverified-public-plan';
  requiredControls: readonly [
    'private-adapter-issued-reference',
    'private-sink-path-selection',
    'data-classification',
    'sanitization-review',
    'human-clearance',
  ];
}

const OPAQUE_MEMORY_REF = /^mem_[a-f0-9]{32}$/;
const OPAQUE_SESSION_REF = /^session_[a-f0-9]{32}$/;
const MEMORY_REQUIRED_CONTROLS = Object.freeze([
  'private-adapter-issued-reference',
  'private-sink-path-selection',
  'data-classification',
  'sanitization-review',
  'human-clearance',
] as const);

function assertOpaqueRef(value: string, pattern: RegExp, label: string): void {
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(`${label} must use the reserved opaque reference syntax.`);
  }
}

function buildPlan(operation: PrivateMemoryOperation, opaqueSourceRef: string): PrivateMemoryPlan {
  return Object.freeze({
    operation,
    opaqueSourceRef,
    target: 'private-external-memory-adapter',
    sensitivity: 'unverified-private',
    contentIncluded: false,
    executionPermitted: false,
    authorityStatus: 'unverified-public-plan',
    requiredControls: MEMORY_REQUIRED_CONTROLS,
  });
}

/**
 * Public, descriptor-only memory boundary.
 *
 * It deliberately accepts no labels, content, metadata, snippets, paths, or
 * caller-asserted sensitivity. A separately deployed private adapter must mint
 * the opaque reference, resolve the content, enforce authority, and execute.
 */
export class MemoryOSManager {
  planExternalIndex(opaqueMemoryRef: string): PrivateMemoryPlan {
    assertOpaqueRef(opaqueMemoryRef, OPAQUE_MEMORY_REF, 'Memory reference');
    return buildPlan('index-descriptor', opaqueMemoryRef);
  }

  planChatDistillation(opaqueSessionRef: string): PrivateMemoryPlan {
    assertOpaqueRef(opaqueSessionRef, OPAQUE_SESSION_REF, 'Session reference');
    return buildPlan('distill-chat', opaqueSessionRef);
  }

  getNodesCount(): 0 {
    return 0;
  }
}
