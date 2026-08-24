import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadLifeOSProfile } from '../packages/core/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PROFILE_PATH = path.join(ROOT_DIR, 'alos-profile.yaml');

const HEALTH_CHECK_DEFINITIONS = Object.freeze({
  'vitest-module': Object.freeze({
    executable: process.execPath,
    argsForRoot: (rootDir) => [
      path.join(rootDir, 'node_modules', 'vitest', 'vitest.mjs'),
      'run',
      '--config',
      path.join(rootDir, 'vitest.config.ts'),
    ],
    timeoutMs: 30_000,
  }),
});

function isContained(rootPath, candidatePath) {
  const relative = path.relative(rootPath, candidatePath);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function resolveContainedDirectory(rootDir, relativePath) {
  if (
    typeof relativePath !== 'string' ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath) ||
    relativePath.includes('\\') ||
    relativePath.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error('Health-check path must be a normalized repository-relative directory.');
  }

  const rootRealPath = fs.realpathSync(rootDir);
  const candidatePath = path.resolve(rootRealPath, relativePath);
  if (!isContained(rootRealPath, candidatePath)) throw new Error('Health-check path escapes the repository.');
  if (!fs.existsSync(candidatePath) || !fs.statSync(candidatePath).isDirectory()) {
    throw new Error('Health-check directory does not exist.');
  }

  const candidateRealPath = fs.realpathSync(candidatePath);
  if (!isContained(rootRealPath, candidateRealPath)) {
    throw new Error('Health-check directory resolves outside the repository.');
  }
  return candidateRealPath;
}

export function getHealthCheckDefinition(checkId) {
  const definition = HEALTH_CHECK_DEFINITIONS[checkId];
  if (!definition) throw new Error(`Unknown health-check identifier: ${String(checkId)}`);

  const rootRealPath = fs.realpathSync(ROOT_DIR);
  const args = definition.argsForRoot(rootRealPath);
  const cliRealPath = fs.realpathSync(args[0]);
  if (!isContained(rootRealPath, cliRealPath)) throw new Error('Health-check executable resolves outside the repository.');
  return Object.freeze({
    executable: definition.executable,
    args: Object.freeze([cliRealPath, ...args.slice(1)]),
    timeoutMs: definition.timeoutMs,
  });
}

function runHealthCheck(checkId, relativePath) {
  try {
    const definition = getHealthCheckDefinition(checkId);
    const cwd = resolveContainedDirectory(ROOT_DIR, relativePath);
    execFileSync(definition.executable, definition.args, {
      cwd,
      stdio: 'pipe',
      timeout: definition.timeoutMs,
      windowsHide: true,
    });
    return { success: true, error: null };
  } catch (error) {
    const output = error?.stdout?.toString() || error?.stderr?.toString() || error?.message || String(error);
    return { success: false, error: output };
  }
}

export function main() {
  console.log('Agentic Life OS — bounded workspace health checks');

  let profile;
  try {
    profile = loadLifeOSProfile(PROFILE_PATH);
  } catch (error) {
    console.error(`PROFILE_LOAD_FAIL ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }

  let passedCount = 0;
  let failedCount = 0;
  const start = Date.now();

  for (const [key, module] of Object.entries(profile.modules)) {
    console.log(`CHECK_START module=${key} check=${module.healthCheck} path=${module.path}`);

    const startedAt = Date.now();
    const result = runHealthCheck(module.healthCheck, module.path);
    const durationMs = Date.now() - startedAt;
    if (result.success) {
      console.log(`CHECK_PASS module=${key} durationMs=${durationMs}`);
      passedCount += 1;
    } else {
      console.error(`CHECK_FAIL module=${key} durationMs=${durationMs}`);
      console.error(result.error.split('\n').slice(0, 10).join('\n'));
      failedCount += 1;
    }
  }

  console.log(`HEALTH_CHECK_SUMMARY passed=${passedCount} failed=${failedCount} durationMs=${Date.now() - start}`);
  if (failedCount > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) main();
