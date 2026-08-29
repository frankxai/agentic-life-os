import fs from 'node:fs';
import yaml from 'js-yaml';
import { LifeOSProfileSchema, type LifeOSProfile } from './schemas.js';

const CONTROL_CHARACTERS = /[\p{Cc}\p{Cf}\u2028\u2029]/gu;

function safeDiagnostic(value: unknown, maxLength = 500): string {
  return String(value)
    .normalize('NFC')
    .replace(CONTROL_CHARACTERS, '?')
    .slice(0, maxLength);
}

export function loadLifeOSProfile(filePath: string): LifeOSProfile {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ALOS Profile file not found at path: ${filePath}`);
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsedYaml = yaml.load(fileContents);

  if (!parsedYaml || typeof parsedYaml !== 'object') {
    throw new Error(`ALOS Profile is invalid or empty YAML at path: ${filePath}`);
  }

  const result = LifeOSProfileSchema.safeParse(parsedYaml);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => {
        const safePath = err.path.map((segment) => safeDiagnostic(segment, 80)).join('.');
        return `  - [${safePath}] ${safeDiagnostic(err.message)}`;
      })
      .join('\n');
    throw new Error(`ALOS Profile validation failed:\n${errorDetails}`);
  }

  return result.data;
}
