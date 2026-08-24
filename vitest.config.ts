import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@frankx-ai/alos-core': path.join(root, 'packages/core/src/index.ts'),
      '@frankx-ai/agentic-business-os': path.join(root, 'packages/business/src/index.ts'),
      '@frankx-ai/agentic-creator-os': path.join(root, 'packages/creator/src/index.ts'),
      '@frankx-ai/second-brain-os': path.join(root, 'packages/memory/src/index.ts'),
      '@frankx-ai/agentic-investor-os': path.join(root, 'packages/investor/src/index.ts'),
      '@frankx-ai/agentic-health-os': path.join(root, 'packages/health/src/index.ts'),
      '@frankx-ai/life-sciences-researcher-is': path.join(root, 'packages/life-sciences-researcher/src/index.ts'),
      '@frankx-ai/agentic-family-os': path.join(root, 'packages/family/src/index.ts'),
      '@frankx-ai/agentic-orchestration-os': path.join(root, 'packages/orchestration/src/index.ts'),
    },
  },
  test: {
    passWithNoTests: false,
  },
});
