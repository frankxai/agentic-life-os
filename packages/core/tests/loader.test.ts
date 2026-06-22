import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadLifeOSProfile } from '../src/loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ALOS Profile Loader', () => {
  const mockYamlPath = path.join(__dirname, 'mock-alos-profile.yaml');

  it('should successfully load and validate a well-formed ALOS profile', () => {
    const validProfileContent = `
systemName: "Agentic Life OS"
version: "1.0.0"
sipVersion: "1.1.1"
workstation:
  machineName: "Yoga Laptop"
  os: "Windows"
modules:
  business:
    repoName: "agentic-business-os"
    path: "C:\\\\Users\\\\frank\\\\agentic-business-os"
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
  machineName: "Yoga Laptop"
  os: "Windows"
modules:
  health:
    repoName: "agentic-health-os"
    path: "C:\\\\Users\\\\frank\\\\starlight\\\\repos\\\\agentic-life-os\\\\packages\\\\health"
    status: "in-development"
    riskLevel: "private"
    healthCommand: "vitest run"
    activeAgents:
      - "Claude Code"
    purpose: "Private personal health workflows"
  lifeSciencesResearcher:
    repoName: "life-sciences-researcher-is"
    path: "C:\\\\Users\\\\frank\\\\starlight\\\\repos\\\\agentic-life-os\\\\packages\\\\life-sciences-researcher"
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

  it('should throw an error on invalid schema data', () => {
    const invalidProfileContent = `
systemName: "Agentic Life OS"
version: "1.0.0"
sipVersion: "1.1.1"
workstation:
  machineName: "Yoga Laptop"
  os: "Windows"
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
});
