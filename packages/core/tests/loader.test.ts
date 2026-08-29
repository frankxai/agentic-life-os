import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadLifeOSProfile } from '../src/loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_CONTRACT_YAML = `
publicContract:
  assetSchemaVersion: "1.3.0"
  runtime:
    mode: "local-open-core"
    authority: "private-runtime-authority-store"
    defaultAdmission: "deny"
  healthKnowledgeSource:
    repository: "frankxai/health-intelligence-system"
    requiredBindings: ["pinVersion", "repository", "commitSha", "artifactVersion", "artifactPath", "mediaType", "byteLength", "sha256"]
  prohibitedPublicData: ["raw-health-records", "clinical-data", "genomic-data", "family-records", "secrets", "authority-state", "personal-metrics"]
  prohibitedAgentActions: ["diagnosis", "treatment", "medication-change", "result-interpretation", "emergency-reassurance", "autonomous-transport", "public-storage-of-private-records"]
  familyDataGate:
    dataClasses: ["family-records", "genomic-data"]
    deniedDestinations: ["memory", "creator"]
    requiredControls: ["private-encrypted-deployment", "consent", "audit", "backup-restore", "audience-authorization", "succession-controls"]
`;

describe('ALOS Profile Loader', () => {
  const mockYamlPath = path.join(__dirname, 'mock-alos-profile.yaml');

  it('loads the repository public profile through the strict schema', () => {
    const repositoryProfilePath = path.resolve(__dirname, '../../../alos-profile.yaml');
    const profile = loadLifeOSProfile(repositoryProfilePath);
    expect(profile.version).toBe('1.4.0');
    expect(profile.profileAssertionStatus).toBe('unverified-declarative-configuration');
    expect(profile.workstation.machineName).toBe('local-instance');
    expect(profile.modules['health']?.path).toBe('packages/health');
    expect(profile.modules['family']?.path).toBe('packages/family');
    expect(profile.modules['family']?.healthCheck).toBe('vitest-module');
    expect(profile.modules['family']?.purpose).toMatch(/descriptor-only private family-adapter planning/i);
    expect(profile.publicContract.runtime.authority).toBe('private-runtime-authority-store');
    expect(profile.publicContract.healthKnowledgeSource.requiredBindings).toEqual([
      'pinVersion',
      'repository',
      'commitSha',
      'artifactVersion',
      'artifactPath',
      'mediaType',
      'byteLength',
      'sha256',
    ]);
    expect(profile.publicContract.familyDataGate.deniedDestinations).toEqual(['memory', 'creator']);
  });

  it('should successfully load and validate a well-formed ALOS profile', () => {
    const validProfileContent = `
systemName: "Agentic Life OS"
version: "1.4.0"
sipVersion: "1.1.1"
profileAssertionStatus: "unverified-declarative-configuration"
workstation:
  machineName: "local-instance"
  os: "Cross-platform"
modules:
  business:
    repoName: "agentic-business-os"
    path: "packages/business"
    status: "in-development"
    riskLevel: "template"
    healthCheck: "vitest-module"
    activeAgents:
      - "Claude Code"
    purpose: "Business ops"
${PUBLIC_CONTRACT_YAML}
`;
    fs.writeFileSync(mockYamlPath, validProfileContent);

    try {
      const profile = loadLifeOSProfile(mockYamlPath);
      expect(profile.systemName).toBe('Agentic Life OS');
      expect(profile.modules['business']?.repoName).toBe('agentic-business-os');
      expect(profile.modules['business']?.status).toBe('in-development');
    } finally {
      if (fs.existsSync(mockYamlPath)) {
        fs.unlinkSync(mockYamlPath);
      }
    }
  });

  it('should accept separate personal health and research-only life sciences modules', () => {
    const profileContent = `
systemName: "Agentic Life OS"
version: "1.4.0"
sipVersion: "1.1.1"
profileAssertionStatus: "unverified-declarative-configuration"
workstation:
  machineName: "local-instance"
  os: "Cross-platform"
modules:
  health:
    repoName: "agentic-health-os"
    path: "packages/health"
    status: "in-development"
    riskLevel: "private"
    healthCheck: "vitest-module"
    activeAgents:
      - "Claude Code"
    purpose: "Private personal health workflows"
  lifeSciencesResearcher:
    repoName: "life-sciences-researcher-is"
    path: "packages/life-sciences-researcher"
    status: "in-development"
    riskLevel: "private"
    healthCheck: "vitest-module"
    activeAgents:
      - "Claude Code"
    purpose: "Research-only biomedical lookup"
${PUBLIC_CONTRACT_YAML}
`;
    fs.writeFileSync(mockYamlPath, profileContent);

    try {
      const profile = loadLifeOSProfile(mockYamlPath);
      expect(profile.modules['health']?.repoName).toBe('agentic-health-os');
      expect(profile.modules['lifeSciencesResearcher']?.repoName).toBe('life-sciences-researcher-is');
    } finally {
      if (fs.existsSync(mockYamlPath)) {
        fs.unlinkSync(mockYamlPath);
      }
    }
  });

  it('should load offering, intelligence systems, repo lanes, and operating loops', () => {
    const profileContent = `
systemName: "Agentic Life OS"
version: "1.4.0"
sipVersion: "1.1.1"
profileAssertionStatus: "unverified-declarative-configuration"
workstation:
  machineName: "local-instance"
  os: "Cross-platform"
modules:
  business:
    repoName: "agentic-business-os"
    path: "packages/business"
    status: "in-development"
    riskLevel: "template"
    healthCheck: "vitest-module"
    activeAgents:
      - "Claude Code"
    purpose: "Business ops"
offering:
  name: "Agentic Life OS"
  audience: "Founder-operators"
  promise: "One private command spine for work and life"
  status: "private-operator-suite"
  deliveryMode: "Git-backed repo package plus guided implementation"
  publicBoundary: "Public wrappers exclude private memory, health, finance, and unreleased strategy."
  packages:
    - name: "Public Blueprint"
      audience: "Builders evaluating the model"
      promise: "Understand the stack"
      deliveryMode: "Docs"
      commercialStatus: "free"
      supportBoundary: "Self-serve only"
intelligenceSystems:
  - name: "Starlight Intelligence System"
    repoName: "Starlight-Intelligence-System"
    layer: "substrate"
    publicStatus: "hybrid"
    purpose: "Memory, provenance, and validation"
    proofGate: "Health command plus evidence path"
estateRepos:
  - name: "agentic-life-os"
    lane: "master-offer"
    role: "Master operating shell"
    source: "repo-evidenced"
    status: "primary"
operatingLoops:
  - name: "Daily Command Loop"
    cadence: "daily"
    owner: "chief-operator"
    purpose: "Select and verify the day's work"
    inputs:
      - "progress ledger"
    outputs:
      - "bounded queue"
    safetyGate: "No production or billing mutation without approval"
${PUBLIC_CONTRACT_YAML}
`;
    fs.writeFileSync(mockYamlPath, profileContent);

    try {
      const profile = loadLifeOSProfile(mockYamlPath);
      expect(profile.offering?.name).toBe('Agentic Life OS');
      expect(profile.offering?.packages[0]?.commercialStatus).toBe('free');
      expect(profile.intelligenceSystems[0]?.repoName).toBe('Starlight-Intelligence-System');
      expect(profile.estateRepos[0]?.lane).toBe('master-offer');
      expect(profile.operatingLoops[0]?.cadence).toBe('daily');
    } finally {
      if (fs.existsSync(mockYamlPath)) {
        fs.unlinkSync(mockYamlPath);
      }
    }
  });

  it('should throw an error on invalid schema data', () => {
    const invalidProfileContent = `
systemName: "Agentic Life OS"
version: "1.0.0"
sipVersion: "1.1.1"
workstation:
  machineName: "local-instance"
  os: "Cross-platform"
modules:
  business:
    repoName: "agentic-business-os"
    status: "unknown-status-value" # Invalid enum value
`;
    fs.writeFileSync(mockYamlPath, invalidProfileContent);

    try {
      expect(() => loadLifeOSProfile(mockYamlPath)).toThrow(/ALOS Profile validation failed/);
    } finally {
      if (fs.existsSync(mockYamlPath)) {
        fs.unlinkSync(mockYamlPath);
      }
    }
  });

  it('rejects machine-absolute module paths and unknown profile keys', () => {
    const unsafeProfileContent = `
systemName: "Agentic Life OS"
version: "1.4.0"
sipVersion: "1.1.1"
profileAssertionStatus: "unverified-declarative-configuration"
workstation:
  machineName: "local-instance"
  os: "Cross-platform"
modules:
  health:
    repoName: "agentic-health-os"
    path: "/private/health-vault"
    status: "in-development"
    riskLevel: "private"
    healthCheck: "vitest-module"
    activeAgents: ["local-agent"]
    purpose: "Synthetic fixture"
unexpectedAuthority: true
${PUBLIC_CONTRACT_YAML}
`;
    fs.writeFileSync(mockYamlPath, unsafeProfileContent);

    try {
      expect(() => loadLifeOSProfile(mockYamlPath)).toThrow(/ALOS Profile validation failed/);
    } finally {
      if (fs.existsSync(mockYamlPath)) {
        fs.unlinkSync(mockYamlPath);
      }
    }
  });

  it('rejects weakened public authority and artifact-binding contracts', () => {
    const repositoryProfilePath = path.resolve(__dirname, '../../../alos-profile.yaml');
    const source = fs.readFileSync(repositoryProfilePath, 'utf8');
    const weakenedProfiles = [
      source.replace('authority: "private-runtime-authority-store"', 'authority: "prompt-owned"'),
      source.replace(', "sha256"]', ']'),
      source.replace('deniedDestinations: ["memory", "creator"]', 'deniedDestinations: ["memory"]'),
    ];

    try {
      for (const weakenedProfile of weakenedProfiles) {
        fs.writeFileSync(mockYamlPath, weakenedProfile);
        expect(() => loadLifeOSProfile(mockYamlPath)).toThrow(/ALOS Profile validation failed/);
      }
    } finally {
      if (fs.existsSync(mockYamlPath)) fs.unlinkSync(mockYamlPath);
    }
  });

  it('rejects discovery-text and terminal-control injection in profile fields', () => {
    const repositoryProfilePath = path.resolve(__dirname, '../../../alos-profile.yaml');
    const source = fs.readFileSync(repositoryProfilePath, 'utf8');
    const maliciousProfiles = [
      source.replace(
        'repoName: "agentic-business-os"',
        'repoName: "agentic-business-os\\n## injected heading"',
      ),
      source.replace(
        'activeAgents: ["local-agent"]',
        'activeAgents: ["local-agent\\u001b[31m"]',
      ),
      source.replace(
        '\n  business:\n',
        '\n  "bad\\n## injected-module":\n',
      ),
      source.replace(
        'os: "Portable Node.js 24 target; Windows verified, Linux CI pending"',
        'os: "Trusted platform\\u2028verified: true"',
      ),
      source.replace(
        'os: "Portable Node.js 24 target; Windows verified, Linux CI pending"',
        'os: "Trusted platform\\u202Eprivate override"',
      ),
    ];

    try {
      for (const maliciousProfile of maliciousProfiles) {
        fs.writeFileSync(mockYamlPath, maliciousProfile);
        expect(() => loadLifeOSProfile(mockYamlPath)).toThrow(/ALOS Profile validation failed/);
      }
    } finally {
      if (fs.existsSync(mockYamlPath)) fs.unlinkSync(mockYamlPath);
    }
  });
});
