import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
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
  .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));

const disallowedPathRules = [
  ['asph-work-in-progress', /(?:^|\/)\.asph-wip(?:\/|$)/i],
  ['environment-file', /(?:^|\/)\.env(?:\..+)?$/i],
  ['private-instance-data', /(?:^|\/)(?:vaults?|raw-records|private-data|exports|backups)(?:\/|$)/i],
  ['database-or-key-material', /\.(?:db|sqlite3?|pem|p12|pfx|key)$/i],
  ['health-record-binary', /\.(?:dcm|dicom)$/i],
  ['genomic-or-family-data', /\.(?:vcf|bcf|bam|cram|fastq|fq|fasta|fa|bed|ged|gedcom)$/i],
  ['archive-container', /\.(?:zip|7z|rar|tar|tgz|gz|bz2|xz)$/i],
];

const contentRules = [
  ['windows-home-path', /[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s]+[\\/]+/i],
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
  matchingPathCodes('packages/memory/vaults/private-note.md').includes('private-instance-data'),
  matchingPathCodes('fixtures/person.vcf').includes('genomic-or-family-data'),
  matchingPathCodes('release/unreviewed.zip').includes('archive-container'),
  matchingPathCodes('config/.env').includes('environment-file'),
  matchingPathCodes('.env.example').length === 0,
  matchingContentCodes(['C:', 'Users', 'operator', 'vault', 'record.json'].join('\\')).includes('windows-home-path'),
  matchingContentCodes(['C:', 'Users', 'operator', 'vault', 'record.json'].join('/')).includes('windows-home-path'),
  matchingContentCodes(`ghp_${'a'.repeat(24)}`).includes('github-token'),
];
if (checkerSelfTests.some((passed) => !passed)) {
  console.error('PUBLIC_SAFETY_CHECKER_SELF_TEST_FAIL');
  process.exit(2);
}

const privateOverlayIgnore = new Set(
  readFileSync(path.join(root, 'templates', 'private-instance-overlay', '.gitignore'), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean),
);
const requiredPrivateDataIgnorePatterns = [
  '*.vcf', '*.vcf.gz', '*.bcf', '*.bcf.gz', '*.bam', '*.cram',
  '*.fastq', '*.fastq.gz', '*.fq', '*.fq.gz', '*.fasta', '*.fasta.gz',
  '*.fa', '*.fa.gz', '*.bed', '*.bed.gz', '*.ged', '*.ged.gz',
  '*.gedcom', '*.gedcom.gz',
];
if (requiredPrivateDataIgnorePatterns.some((pattern) => !privateOverlayIgnore.has(pattern))) {
  console.error('PRIVATE_OVERLAY_IGNORE_CONTRACT_FAIL');
  process.exit(2);
}

const findings = [];
const foldedPaths = new Map();
for (const relativePath of files) {
  const normalized = relativePath.replaceAll('\\', '/');
  const absolutePath = path.join(root, relativePath);
  let stat;
  try {
    stat = lstatSync(absolutePath);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') continue;
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    findings.push({ path: normalized, code: 'non-regular-entry-not-allowed' });
    continue;
  }
  const candidateRealPath = realpathSync.native(absolutePath);
  const rootRealPath = realpathSync.native(root);
  const relativeRealPath = path.relative(rootRealPath, candidateRealPath);
  if (relativeRealPath.startsWith('..') || path.isAbsolute(relativeRealPath)) {
    findings.push({ path: normalized, code: 'repository-path-escape' });
    continue;
  }
  const folded = normalized.normalize('NFC').toLowerCase();
  const prior = foldedPaths.get(folded);
  if (prior !== undefined && prior !== normalized) {
    findings.push({ path: normalized, code: 'cross-platform-path-collision' });
  }
  foldedPaths.set(folded, normalized);
  for (const code of matchingPathCodes(normalized)) findings.push({ path: normalized, code });

  const bytes = readFileSync(absolutePath);
  if (bytes.byteLength > 1_000_000) {
    findings.push({ path: normalized, code: 'text-size-ceiling-exceeded' });
    continue;
  }
  if (bytes.includes(0)) {
    findings.push({ path: normalized, code: 'binary-content-not-allowed' });
    continue;
  }
  const text = bytes.toString('utf8');
  if (Buffer.from(text, 'utf8').compare(bytes) !== 0) {
    findings.push({ path: normalized, code: 'non-canonical-utf8' });
    continue;
  }
  if (text.startsWith('version https://git-lfs.github.com/spec/v1\n')) {
    findings.push({ path: normalized, code: 'git-lfs-pointer-not-allowed' });
  }
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
