import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadLifeOSProfile } from '../src/loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ALOS Profile Loader', () => {
  const mockYamlPath = path.join(__dirname, 'mock-alos-profile.yaml');

  it('loads the repository public profile through the strict schema', () => {
    const repositoryProfilePath = path.resolve(__dirname, '../../../alos-profile.yaml');
    const profile = loadLifeOSProfile(repositoryProfilePath);
    expect(profile.version).toBe('1.3.0');
    expect(profile.workstation.machineName).toBe('local-instance');
    expect(profile.modules['health']?.path).toBe('packages/health');
    expect(profile.modules['family']?.path).toBe('packages/family');
    expect(profile.modules['family']?.healthCommand).toBe('pnpm exec vitest run packages/family/tests');
    expect(profile.modules['family']?.purpose).toMatch(/evidence-backed private family research/i);
  });

  it('should successfully load and validate a well-formed ALOS profile', () => {
    const validProfileContent = `
systemName: "Agentic Life OS"
version: "1.0.0"
sipVersion: "1.1.1"
workstation:
  machineName: "local-instance"
  os: "Cross-platform"
modules:
  business:
    repoName: "agentic-business-os"
    path: "packages/business"
    status: "live"
    riskLevel: "production"
    healthCommand: "pnpm test"
    activeAgents:
      - "Claude Code"
    purpose: "Business ops"
`;
    fs.writeFileSync(mockYamlPath, validProfileContent);

    try {
      const profile = loadLifeOSProfile(mockYamlPath);
      expect(profile.systemName).toBe('Agentic Life OS');
      expect(profile.modules['business']?.repoName).toBe('agentic-business-os');
      expect(profile.modules['business']?.status).toBe('live');
    } finally {
      if (fs.existsSync(mockYamlPath)) {
        fs.unlinkSync(mockYamlPath);
      }
    }
  });

  it('should accept separate personal health and research-only life sciences modules', () => {
    const profileContent = `
systemName: "Agentic Life OS"
version: "1.1.0"
sipVersion: "1.1.1"
workstation:
  machineName: "local-instance"
  os: "Cross-platform"
modules:
  health:
    repoName: "agentic-health-os"
    path: "packages/health"
    status: "in-development"
    riskLevel: "private"
    healthCommand: "vitest run"
    activeAgents:
      - "Claude Code"
    purpose: "Private personal health workflows"
  lifeSciencesResearcher:
    repoName: "life-sciences-researcher-is"
    path: "packages/life-sciences-researcher"
    status: "in-development"
    riskLevel: "private"
    healthCommand: "vitest run"
    activeAgents:
      - "Claude Code"
    purpose: "Research-only biomedical lookup"
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
version: "1.2.0"
sipVersion: "1.1.1"
workstation:
  machineName: "local-instance"
  os: "Cross-platform"
modules:
  business:
    repoName: "agentic-business-os"
    path: "packages/business"
    status: "in-development"
    riskLevel: "production"
    healthCommand: "vitest run"
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
    source: "verified"
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
version: "1.3.0"
sipVersion: "1.1.1"
workstation:
  machineName: "local-instance"
  os: "Cross-platform"
modules:
  health:
    repoName: "agentic-health-os"
    path: "/private/health-vault"
    status: "in-development"
    riskLevel: "private"
    healthCommand: "vitest run"
    activeAgents: ["local-agent"]
    purpose: "Synthetic fixture"
unexpectedAuthority: true
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
});
