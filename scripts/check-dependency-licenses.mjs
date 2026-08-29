import { execFileSync } from 'node:child_process';

const ALLOWED_LICENSES = new Set(['MIT', 'Apache-2.0', 'ISC', 'BSD-3-Clause', 'Python-2.0']);
const REVIEWED_PACKAGE_LICENSES = new Map([
  ['@fontsource/inter@5.3.0', 'OFL-1.1'],
  ['@fontsource/jetbrains-mono@5.3.0', 'OFL-1.1'],
  ['@fontsource/playfair-display@5.3.0', 'OFL-1.1'],
  ['@fontsource/poppins@5.3.0', 'OFL-1.1'],
  ['caniuse-lite@1.0.30001810', 'CC-BY-4.0'],
  ['@gsap/react@2.1.2', 'SEE LICENSE AT https://gsap.com/standard-license'],
  ['gsap@3.15.0', "Standard 'no charge' license: https://gsap.com/standard-license."],
]);
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
  const unreviewed = [];
  for (const license of licenses) {
    if (ALLOWED_LICENSES.has(license)) continue;
    const entries = Array.isArray(report[license]) ? report[license] : [];
    for (const entry of entries) {
      const versions = Array.isArray(entry?.versions) ? entry.versions : [];
      for (const version of versions) {
        const packageId = `${entry?.name}@${version}`;
        if (REVIEWED_PACKAGE_LICENSES.get(packageId) !== license) unreviewed.push(`${packageId} (${license})`);
      }
    }
  }
  if (unreviewed.length > 0) throw new Error(`Dependency license requires review: ${unreviewed.sort().join(',')}`);
  const dependencyCount = Object.values(report).reduce(
    (total, entries) => total + (Array.isArray(entries) ? entries.length : 0),
    0,
  );
  console.log(`DEPENDENCY_LICENSE_PASS licenses=${licenses.join(',')} packages=${dependencyCount} reviewed-exceptions=${REVIEWED_PACKAGE_LICENSES.size}`);
} catch (error) {
  console.error(`DEPENDENCY_LICENSE_FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
