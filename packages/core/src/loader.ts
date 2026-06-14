import fs from 'node:fs';
import yaml from 'js-yaml';
import { LifeOSProfileSchema, type LifeOSProfile } from './schemas.js';

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
      .map((err) => `  - [${err.path.join('.')}] ${err.message}`)
      .join('\n');
    throw new Error(`ALOS Profile validation failed:\n${errorDetails}`);
  }

  return result.data;
}
