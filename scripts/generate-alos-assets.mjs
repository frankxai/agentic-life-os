import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadLifeOSProfile } from '../packages/core/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PROFILE_PATH = path.join(ROOT_DIR, 'alos-profile.yaml');

function main() {
  console.log('⚡ Generating ALOS discovery and sitemap assets...');

  try {
    const profile = loadLifeOSProfile(PROFILE_PATH);

    // 1. Generate llms.txt
    let llmsText = `# Agentic Life OS (ALOS) — Discoverability Spec

This file defines the public modules, substrates, and bounded agent capabilities of Agentic Life OS.

## Architecture
- Runtime target: ${profile.workstation.os}
- SIP Version: ${profile.sipVersion}
- System Version: ${profile.version}

## Interconnected Modules
`;

    for (const [key, mod] of Object.entries(profile.modules)) {
      llmsText += `
### ${mod.repoName} (\`${key}\`)
- Path: \`${mod.path}\`
- Status: \`${mod.status}\`
- Risk Level: \`${mod.riskLevel}\`
- Health Command: \`${mod.healthCommand}\`
- Active Agents: ${mod.activeAgents.join(', ')}
- Description: ${mod.purpose}
`;
    }

    if (profile.offering) {
      llmsText += `
## Master Offering
- Name: ${profile.offering.name}
- Audience: ${profile.offering.audience}
- Promise: ${profile.offering.promise}
- Status: ${profile.offering.status}
- Delivery Mode: ${profile.offering.deliveryMode}
- Public Boundary: ${profile.offering.publicBoundary}
`;

      for (const pkg of profile.offering.packages) {
        llmsText += `
### Package: ${pkg.name}
- Audience: ${pkg.audience}
- Promise: ${pkg.promise}
- Delivery Mode: ${pkg.deliveryMode}
- Commercial Status: ${pkg.commercialStatus}
- Support Boundary: ${pkg.supportBoundary}
`;
      }
    }

    if (profile.intelligenceSystems.length > 0) {
      llmsText += `
## Intelligence Systems
`;

      for (const system of profile.intelligenceSystems) {
        llmsText += `
### ${system.name}
- Repo: \`${system.repoName}\`
- Layer: \`${system.layer}\`
- Public Status: \`${system.publicStatus}\`
- Purpose: ${system.purpose}
- Proof Gate: ${system.proofGate}
`;
      }
    }

    if (profile.operatingLoops.length > 0) {
      llmsText += `
## Operating Loops
`;

      for (const loop of profile.operatingLoops) {
        llmsText += `
### ${loop.name}
- Cadence: ${loop.cadence}
- Owner: ${loop.owner}
- Purpose: ${loop.purpose}
- Inputs: ${loop.inputs.join(', ')}
- Outputs: ${loop.outputs.join(', ')}
- Safety Gate: ${loop.safetyGate}
`;
      }
    }

    const llmsPath = path.join(ROOT_DIR, 'llms.txt');
    fs.writeFileSync(llmsPath, llmsText, 'utf8');
    console.log(`✅ Generated: llms.txt -> ${llmsPath}`);

    // 2. Generate agents.json
    const agentsJson = JSON.stringify(
      {
        schemaVersion: '1.0.0',
        systemName: profile.systemName,
        version: profile.version,
        sip: profile.sipVersion,
        runtime: {
          mode: 'local-open-core',
          operatingSystem: profile.workstation.os,
          defaultAdmission: 'deny',
        },
        modules: Object.entries(profile.modules).map(([name, m]) => ({
          key: name,
          repo: m.repoName,
          status: m.status,
          risk: m.riskLevel,
          verify: m.healthCommand,
          purpose: m.purpose,
        })),
        offering: profile.offering ?? null,
        intelligenceSystems: profile.intelligenceSystems,
        estateRepos: profile.estateRepos,
        operatingLoops: profile.operatingLoops,
      },
      null,
      2
    );
    const agentsPath = path.join(ROOT_DIR, 'agents.json');
    fs.writeFileSync(agentsPath, agentsJson, 'utf8');
    console.log(`✅ Generated: agents.json -> ${agentsPath}`);

    // 3. Generate jsonld.json
    const jsonLd = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: 'Agentic Life OS (ALOS)',
        description: 'Open-source, local-first agent runtime with private-instance overlays.',
        operatingSystem: profile.workstation.os,
        applicationCategory: 'DeveloperApplication',
        creator: {
          '@type': 'Person',
          name: 'Frank Riemer',
        },
        hasPart: [
          ...Object.entries(profile.modules).map(([name, m]) => ({
            '@type': 'SoftwareApplication',
            name: m.repoName,
            description: m.purpose,
          })),
          ...profile.intelligenceSystems.map((system) => ({
            '@type': 'SoftwareApplication',
            name: system.name,
            description: system.purpose,
            applicationSubCategory: system.layer,
          })),
        ],
      },
      null,
      2
    );
    const jsonLdPath = path.join(ROOT_DIR, 'jsonld.json');
    fs.writeFileSync(jsonLdPath, jsonLd, 'utf8');
    console.log(`✅ Generated: jsonld.json -> ${jsonLdPath}`);

    console.log('🎉 ALOS sitemaps successfully generated!');
  } catch (error) {
    console.error('❌ Error generating ALOS assets:', error.message);
    process.exit(1);
  }
}

main();
