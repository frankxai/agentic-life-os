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

This file defines the active modules, substrates, and agent capabilities of Frank's unified Life Operating System.

## Architecture
- Machine: ${profile.workstation.machineName} (${profile.workstation.os})
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
        workstation: profile.workstation,
        modules: Object.entries(profile.modules).map(([name, m]) => ({
          key: name,
          repo: m.repoName,
          status: m.status,
          risk: m.riskLevel,
          verify: m.healthCommand,
          purpose: m.purpose,
        })),
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
        '@type': 'SoftwareApplication',
        name: 'Agentic Life OS (ALOS)',
        description: 'Unified multi-agent operating system.',
        operatingSystem: profile.workstation.os,
        applicationCategory: 'DeveloperApplication',
        creator: {
          '@type': 'Person',
          name: 'Frank Riemer',
        },
        hasPart: Object.entries(profile.modules).map(([name, m]) => ({
          '@type': 'SoftwareApplication',
          name: m.repoName,
          description: m.purpose,
        })),
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
