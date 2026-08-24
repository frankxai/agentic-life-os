import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trackedOnly = process.argv.includes('--tracked-only');
const args = trackedOnly
  ? ['-C', root, 'ls-files', '-z']
  : ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'];
const files = execFileSync('git', args, { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right));

const disallowedPathRules = [
  ['asph-work-in-progress', /(?:^|\/)\.asph-wip(?:\/|$)/],
  ['environment-file', /(?:^|\/)\.env(?:\..+)?$/],
  ['private-instance-data', /(?:^|\/)(?:vault|raw-records|private-data|exports|backups)(?:\/|$)/i],
  ['database-or-key-material', /\.(?:db|sqlite3?|pem|p12|pfx|key)$/i],
  ['health-record-binary', /\.(?:dcm|dicom)$/i],
];

const contentRules = [
  ['windows-home-path', /[A-Za-z]:(?:\\{1,2})Users(?:\\{1,2})[^\\\s]+(?:\\{1,2})/],
  ['local-file-url', /file:\/\/[A-Za-z]:\/Users\//i],
  ['unix-home-path', /\/(?:Users|home)\/[A-Za-z0-9._-]+\//],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token', /ghp_[A-Za-z0-9]{20,}/],
  ['openai-style-secret', /sk-[A-Za-z0-9_-]{20,}/],
  ['bearer-token', /Bearer\s+[A-Za-z0-9._~+\/-]{24,}={0,2}/i],
];

function matchingPathCodes(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  return disallowedPathRules
    .filter(([code, pattern]) => !(normalized === '.env.example' && code === 'environment-file') && pattern.test(normalized))
    .map(([code]) => code);
}

function matchingContentCodes(value) {
  return contentRules.filter(([, pattern]) => pattern.test(value)).map(([code]) => code);
}

const checkerSelfTests = [
  matchingPathCodes('private-data/synthetic.json').includes('private-instance-data'),
  matchingPathCodes('config/.env').includes('environment-file'),
  matchingPathCodes('.env.example').length === 0,
  matchingContentCodes(['C:', 'Users', 'operator', 'vault', 'record.json'].join('\\')).includes('windows-home-path'),
  matchingContentCodes(`ghp_${'a'.repeat(24)}`).includes('github-token'),
];
if (checkerSelfTests.some((passed) => !passed)) {
  console.error('PUBLIC_SAFETY_CHECKER_SELF_TEST_FAIL');
  process.exit(2);
}

const findings = [];
for (const relativePath of files) {
  const normalized = relativePath.replaceAll('\\', '/');
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) continue;
  for (const code of matchingPathCodes(normalized)) findings.push({ path: normalized, code });

  const bytes = readFileSync(absolutePath);
  if (bytes.includes(0)) continue;
  const text = bytes.toString('utf8');
  for (const code of matchingContentCodes(text)) findings.push({ path: normalized, code });
}

const unique = [...new Map(findings.map((finding) => [`${finding.path}\0${finding.code}`, finding])).values()]
  .sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));

if (unique.length > 0) {
  console.error(`PUBLIC_SAFETY_FAIL ${unique.length}`);
  for (const finding of unique) console.error(`${finding.code}\t${finding.path}`);
  process.exit(1);
}

console.log(`PUBLIC_SAFETY_PASS files=${files.length} mode=${trackedOnly ? 'tracked' : 'releasable-working-set'}`);
