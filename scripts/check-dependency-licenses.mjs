import { execFileSync } from 'node:child_process';

const ALLOWED_LICENSES = new Set(['MIT', 'Apache-2.0', 'ISC', 'BSD-3-Clause', 'Python-2.0']);
const packageManagerCli = process.env.npm_execpath;

try {
  if (!packageManagerCli) throw new Error('Run this checker through pnpm so the pinned package-manager CLI is available');
  const output = execFileSync(process.execPath, [packageManagerCli, 'licenses', 'list', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const report = JSON.parse(output);
  if (report === null || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error('pnpm returned an invalid license report');
  }
  const licenses = Object.keys(report).sort();
  const denied = licenses.filter((license) => !ALLOWED_LICENSES.has(license));
  if (denied.length > 0) throw new Error(`Dependency license requires review: ${denied.join(',')}`);
  const dependencyCount = Object.values(report).reduce(
    (total, entries) => total + (Array.isArray(entries) ? entries.length : 0),
    0,
  );
  console.log(`DEPENDENCY_LICENSE_PASS licenses=${licenses.join(',')} packages=${dependencyCount}`);
} catch (error) {
  console.error(`DEPENDENCY_LICENSE_FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
