import path from 'node:path';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadLifeOSProfile } from '../packages/core/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PROFILE_PATH = path.join(ROOT_DIR, 'alos-profile.yaml');
const PACKAGE_PATH = path.join(ROOT_DIR, 'package.json');
const CHECK_MODE = process.argv.includes('--check');

function buildLlmsText(profile, packageManifest) {
  const contract = profile.publicContract;
  const lines = [
    '# Agentic Life OS (ALOS)',
    '',
    'Publication-candidate local-first agent runtime with private-instance overlays.',
    '',
    '## Public boundary',
    '',
    '- Public repository: code, contracts, docs, synthetic fixtures, and generic templates.',
    '- Private instance overlay: preferences, local policy identifiers, and sanitized notes; it is not authority.',
    '- Private runtime authority store: authenticated capabilities, consent, approvals, and revocations.',
    '- Encrypted local vault: raw personal, clinical, genomic, family, and financial data.',
    `- Profile assertions: \`${profile.profileAssertionStatus}\`; fields below are configuration declarations, not runtime receipts.`,
    '',
    '## Version axes',
    '',
    `- Runtime package version: \`${packageManifest.version}\``,
    `- Profile contract version: \`${profile.version}\``,
    `- SIP compatibility version: \`${profile.sipVersion}\``,
    `- Discovery asset schema: \`${contract.assetSchemaVersion}\``,
    `- Runtime target: ${profile.workstation.os}`,
    '',
    '## Modules',
  ];

  for (const [key, module] of Object.entries(profile.modules)) {
    lines.push(
      '',
      `### ${module.repoName} (\`${key}\`)`,
      `- Path: \`${module.path}\``,
      `- Declared status: \`${module.status}\``,
      `- Declared risk class: \`${module.riskLevel}\``,
      `- Health check: \`${module.healthCheck}\``,
      `- Declared agent roles: ${module.activeAgents.join(', ')}`,
      `- Purpose: ${module.purpose}`,
    );
  }

  lines.push(
    '',
    '## Health knowledge source',
    '',
    `- Repository: \`${contract.healthKnowledgeSource.repository}\``,
    `- Required immutable bindings: ${contract.healthKnowledgeSource.requiredBindings.map((item) => `\`${item}\``).join(', ')}`,
    '- Integrity proves exact bytes against the supplied pin. Provenance requires separate private Git and release-manifest verification; neither proves clinical validity.',
    '',
    '## Safety contract',
    '',
    `- Runtime authority: \`${contract.runtime.authority}\``,
    `- Default admission: \`${contract.runtime.defaultAdmission}\``,
    `- Prohibited public data: ${contract.prohibitedPublicData.map((item) => `\`${item}\``).join(', ')}`,
    `- Prohibited agent actions: ${contract.prohibitedAgentActions.map((item) => `\`${item}\``).join(', ')}`,
    `- Family/genetic data classes: ${contract.familyDataGate.dataClasses.map((item) => `\`${item}\``).join(', ')}`,
    `- Denied generic destinations: ${contract.familyDataGate.deniedDestinations.map((item) => `\`${item}\``).join(', ')}`,
    `- Controls required before any specialized private flow: ${contract.familyDataGate.requiredControls.map((item) => `\`${item}\``).join(', ')}`,
  );

  if (profile.offering) {
    lines.push(
      '',
      '## Offering',
      '',
      `- Name: ${profile.offering.name}`,
      `- Audience: ${profile.offering.audience}`,
      `- Promise: ${profile.offering.promise}`,
      `- Status: \`${profile.offering.status}\``,
      `- Delivery: ${profile.offering.deliveryMode}`,
      `- Public boundary: ${profile.offering.publicBoundary}`,
    );

    for (const offerPackage of profile.offering.packages) {
      lines.push(
        '',
        `### ${offerPackage.name}`,
        `- Audience: ${offerPackage.audience}`,
        `- Promise: ${offerPackage.promise}`,
        `- Delivery: ${offerPackage.deliveryMode}`,
        `- Commercial status: \`${offerPackage.commercialStatus}\``,
        `- Support boundary: ${offerPackage.supportBoundary}`,
      );
    }
  }

  if (profile.intelligenceSystems.length > 0) {
    lines.push('', '## Intelligence systems');
    for (const system of profile.intelligenceSystems) {
      lines.push(
        '',
        `### ${system.name}`,
        `- Repository: \`${system.repoName}\``,
        `- Layer: \`${system.layer}\``,
        `- Declared public status: \`${system.publicStatus}\``,
        `- Purpose: ${system.purpose}`,
        `- Proof gate: ${system.proofGate}`,
      );
    }
  }

  if (profile.estateRepos.length > 0) {
    lines.push('', '## Estate roles');
    for (const repository of profile.estateRepos) {
      lines.push(
        '',
        `### ${repository.name}`,
        `- Lane: \`${repository.lane}\``,
        `- Role: ${repository.role}`,
        `- Declared evidence basis: \`${repository.source}\``,
        `- Declared status: \`${repository.status}\``,
      );
    }
  }

  if (profile.operatingLoops.length > 0) {
    lines.push('', '## Operating loops');
    for (const loop of profile.operatingLoops) {
      lines.push(
        '',
        `### ${loop.name}`,
        `- Cadence: ${loop.cadence}`,
        `- Owner: ${loop.owner}`,
        `- Purpose: ${loop.purpose}`,
        `- Inputs: ${loop.inputs.join(', ')}`,
        `- Outputs: ${loop.outputs.join(', ')}`,
        `- Safety gate: ${loop.safetyGate}`,
      );
    }
  }

  return `${lines.join('\n')}\n`;
}

function buildAgentsJson(profile, packageManifest) {
  const contract = profile.publicContract;
  return `${JSON.stringify(
    {
      schemaVersion: contract.assetSchemaVersion,
      systemName: profile.systemName,
      runtimeVersion: packageManifest.version,
      profileVersion: profile.version,
      sipVersion: profile.sipVersion,
      profileAssertionStatus: profile.profileAssertionStatus,
      runtime: {
        ...contract.runtime,
        operatingSystem: profile.workstation.os,
      },
      modules: Object.entries(profile.modules).map(([key, module]) => ({
        key,
        repo: module.repoName,
        path: module.path,
        declaredStatus: module.status,
        declaredRisk: module.riskLevel,
        healthCheck: module.healthCheck,
        declaredAgentRoles: module.activeAgents,
        purpose: module.purpose,
      })),
      healthKnowledgeSource: contract.healthKnowledgeSource,
      prohibitedPublicData: contract.prohibitedPublicData,
      prohibitedAgentActions: contract.prohibitedAgentActions,
      familyDataGate: contract.familyDataGate,
      offering: profile.offering ?? null,
      intelligenceSystems: profile.intelligenceSystems.map((system) => ({
        name: system.name,
        repoName: system.repoName,
        layer: system.layer,
        declaredPublicStatus: system.publicStatus,
        purpose: system.purpose,
        proofGate: system.proofGate,
      })),
      estateRepos: profile.estateRepos.map((repository) => ({
        name: repository.name,
        lane: repository.lane,
        role: repository.role,
        declaredEvidenceBasis: repository.source,
        declaredStatus: repository.status,
      })),
      operatingLoops: profile.operatingLoops,
    },
    null,
    2,
  )}\n`;
}

function buildJsonLd(profile, packageManifest) {
  return `${JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: 'Agentic Life OS (ALOS)',
      description: 'Publication-candidate local-first agent runtime with private-instance overlays and sovereign data boundaries.',
      codeRepository: 'https://github.com/frankxai/agentic-life-os',
      programmingLanguage: 'TypeScript',
      license: 'https://opensource.org/license/mit',
      version: packageManifest.version,
      operatingSystem: profile.workstation.os,
      applicationCategory: 'DeveloperApplication',
      conditionsOfAccess: profile.offering?.publicBoundary,
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'Profile assertion status',
        value: profile.profileAssertionStatus,
      },
      creator: {
        '@type': 'Person',
        name: 'Frank Riemer',
      },
      hasPart: [
        ...Object.entries(profile.modules).map(([key, module]) => ({
          '@type': 'SoftwareSourceCode',
          name: module.repoName,
          alternateName: key,
          description: module.purpose,
          applicationSubCategory: module.riskLevel,
        })),
        ...profile.intelligenceSystems.map((system) => ({
          '@type': 'SoftwareSourceCode',
          name: system.name,
          alternateName: system.repoName,
          description: system.purpose,
          applicationSubCategory: system.layer,
        })),
      ],
      isBasedOn: {
        '@type': 'SoftwareSourceCode',
        name: 'Health Intelligence System',
        codeRepository: 'https://github.com/frankxai/health-intelligence-system',
        description: 'Immutable provenance receipts for versioned public health artifacts.',
      },
    },
    null,
    2,
  )}\n`;
}

function writeOrCheckAssets(assets) {
  let driftDetected = false;

  for (const [relativePath, expected] of Object.entries(assets)) {
    const absolutePath = path.join(ROOT_DIR, relativePath);
    if (CHECK_MODE) {
      const actual = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : null;
      if (actual !== expected) {
        driftDetected = true;
        console.error(`GENERATED_ASSET_DRIFT ${relativePath}`);
      } else {
        console.log(`GENERATED_ASSET_OK ${relativePath}`);
      }
      continue;
    }

    fs.writeFileSync(absolutePath, expected, 'utf8');
    console.log(`GENERATED_ASSET_WRITTEN ${relativePath}`);
  }

  if (driftDetected) process.exitCode = 1;
}

function assertStaticContractSurfaces(profile, packageManifest) {
  const dashboardPath = path.join(ROOT_DIR, 'dashboard', 'index.html');
  const dashboard = fs.readFileSync(dashboardPath, 'utf8');
  const expectedFooter = `Runtime ${packageManifest.version} · Profile contract ${profile.version} · Discovery schema ${profile.publicContract.assetSchemaVersion}`;
  if (!dashboard.includes(expectedFooter)) {
    throw new Error('Dashboard version footer drifted from the package/profile contract');
  }
  const style = /<style>([\s\S]*?)<\/style>/.exec(dashboard)?.[1];
  if (style === undefined) throw new Error('Dashboard is missing its embedded stylesheet');
  const styleHash = createHash('sha256').update(style, 'utf8').digest('base64');
  const cspToken = `'sha256-${styleHash}'`;
  if (!dashboard.includes(`style-src ${cspToken}`)) {
    throw new Error('Dashboard CSP hash drifted from its embedded stylesheet');
  }
  const deploymentGuide = fs.readFileSync(path.join(ROOT_DIR, 'dashboard', 'DEPLOYMENT.md'), 'utf8');
  if (!deploymentGuide.includes(`style-src ${cspToken}`)) {
    throw new Error('Dashboard deployment CSP hash drifted from its embedded stylesheet');
  }
  console.log('STATIC_CONTRACT_OK dashboard/index.html');
}

function main() {
  try {
    const profile = loadLifeOSProfile(PROFILE_PATH);
    const packageManifest = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
    writeOrCheckAssets({
      'llms.txt': buildLlmsText(profile, packageManifest),
      'agents.json': buildAgentsJson(profile, packageManifest),
      'jsonld.json': buildJsonLd(profile, packageManifest),
    });
    assertStaticContractSurfaces(profile, packageManifest);
  } catch (error) {
    console.error(`GENERATED_ASSET_ERROR ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

main();
