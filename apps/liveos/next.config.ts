import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@frankx-ai/alos-core',
    '@frankx-ai/agentic-life-os-practice',
    '@frankx-ai/agentic-life-os-sync',
    '@frankx-ai/agentic-health-os',
  ],
};

export default nextConfig;
