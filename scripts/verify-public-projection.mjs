import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(__filename), '..');
const MANIFEST_PATH = 'release/public-projection.paths';
const MAX_TEXT_BYTES = 1_000_000;
const NULL_DEVICE = process.platform === 'win32' ? 'NUL' : '/dev/null';

const deniedPathPatterns = [
  /(?:^|\/)\.asph-wip(?:\/|$)/i,
  /(?:^|\/)\.env(?:\..+)?$/i,
  /(?:^|\/)(?:vaults?|raw-records|private-data|exports|backups)(?:\/|$)/i,
  /\.(?:db|sqlite3?|pem|p12|pfx|key|dcm|dicom)$/i,
  /\.(?:vcf|bcf|bam|cram|fastq|fq|fasta|fa|bed|ged|gedcom)$/i,
  /\.(?:zip|7z|rar|tar|tgz|gz|bz2|xz)$/i,
];

const deniedContentPatterns = [
  /[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s]+[\\/]+/i,
  /file:\/\/[A-Za-z]:\/Users\//i,
  /\/(?:Users|home)\/[A-Za-z0-9._-]+\//,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /ghp_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /Bearer\s+[A-Za-z0-9._~+\/-]{24,}={0,2}/i,
];

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function comparePathsBytewise(left, right) {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
}

export function decodeCanonicalUtf8(bytes, label = 'Git path') {
  const buffer = Buffer.from(bytes);
  const decoded = buffer.toString('utf8');
  if (!Buffer.from(decoded, 'utf8').equals(buffer)) {
    throw new Error(`${label} is not canonical UTF-8`);
  }
  return decoded;
}

function splitNulRecords(raw, label) {
  const buffer = Buffer.from(raw);
  if (buffer.length === 0) return [];
  if (buffer.at(-1) !== 0) throw new Error(`${label} is missing its terminal NUL byte`);
  const records = [];
  let start = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] !== 0) continue;
    if (index === start) throw new Error(`${label} contains an empty entry`);
    records.push(buffer.subarray(start, index));
    start = index + 1;
  }
  return records;
}

function decodeAscii(bytes, label) {
  const buffer = Buffer.from(bytes);
  if (buffer.some((value) => value > 0x7f)) throw new Error(`${label} contains non-ASCII metadata`);
  return buffer.toString('ascii');
}

function assertUniqueActualPaths(paths) {
  if (new Set(paths).size !== paths.length) {
    throw new Error('Projection candidate contains duplicate decoded paths');
  }
}

function assertCrossPlatformPathSet(paths) {
  const folded = new Map();
  for (const relativePath of paths) {
    const key = relativePath.normalize('NFKC').toLowerCase();
    const prior = folded.get(key);
    if (prior !== undefined && prior !== relativePath) {
      throw new Error(`Projection paths collide on case-insensitive filesystems: ${prior},${relativePath}`);
    }
    folded.set(key, relativePath);
  }
}

export function buildVerifierGitEnvironment(sourceEnvironment = process.env) {
  const environment = {};
  for (const [key, value] of Object.entries(sourceEnvironment)) {
    if (!key.toUpperCase().startsWith('GIT_') && value !== undefined) environment[key] = value;
  }
  return {
    ...environment,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: NULL_DEVICE,
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_TERMINAL_PROMPT: '0',
    LC_ALL: 'C',
    LANG: 'C',
    TZ: 'UTC',
  };
}

function git(rootDir, args, encoding = 'utf8') {
  return execFileSync('git', [
    '-c', 'i18n.commitEncoding=UTF-8',
    '-c', 'i18n.logOutputEncoding=UTF-8',
    '-c', `core.attributesFile=${NULL_DEVICE}`,
    '-C', rootDir,
    ...args,
  ], {
    encoding,
    env: buildVerifierGitEnvironment(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function validateProjectionPath(relativePath) {
  if (
    typeof relativePath !== 'string' ||
    relativePath.length === 0 ||
    relativePath.length > 240 ||
    relativePath.includes('\\') ||
    /[^A-Za-z0-9._+/-]/.test(relativePath) ||
    relativePath !== relativePath.normalize('NFC') ||
    relativePath.startsWith('/') ||
    /^[A-Za-z]:/.test(relativePath) ||
    relativePath.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error(`Projection path is not normalized and repository-relative: ${String(relativePath)}`);
  }
  for (const segment of relativePath.split('/')) {
    const compatibilityFolded = segment.normalize('NFKC').toLowerCase();
    if (
      Buffer.byteLength(segment, 'utf8') > 255 ||
      /[<>:"|?*]/.test(segment) ||
      /[. ]$/.test(segment) ||
      compatibilityFolded === '.git' ||
      /^git~[1-9]$/.test(compatibilityFolded) ||
      /^(?:con|prn|aux|nul|clock\$|conin\$|conout\$|com[0-9]|lpt[0-9])(?:\..*)?$/i.test(compatibilityFolded)
    ) {
      throw new Error(`Projection path is not cross-platform safe: ${relativePath}`);
    }
  }
  if (deniedPathPatterns.some((pattern) => pattern.test(relativePath))) {
    throw new Error(`Projection path is forbidden: ${relativePath}`);
  }
  return relativePath;
}

export function parsePathManifest(text) {
  if (typeof text !== 'string' || text.length === 0) throw new Error('Projection path manifest is empty');
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.some((line) => line.length === 0 || line.trim() !== line)) {
    throw new Error('Projection path manifest contains blank or padded lines');
  }
  const paths = lines.map(validateProjectionPath);
  if (new Set(paths).size !== paths.length) throw new Error('Projection path manifest contains duplicates');
  assertCrossPlatformPathSet(paths);
  const sorted = [...paths].sort(comparePathsBytewise);
  if (paths.some((entry, index) => entry !== sorted[index])) {
    throw new Error('Projection path manifest must be sorted bytewise');
  }
  if (!paths.includes(MANIFEST_PATH)) throw new Error('Projection path manifest must include itself');
  return paths;
}

function parseCommitTree(rootDir, commitRef) {
  const raw = git(rootDir, ['ls-tree', '-r', '-z', '--full-tree', commitRef], null);
  const entries = splitNulRecords(raw, 'Git tree').map((entry) => {
    const tabIndex = entry.indexOf(0x09);
    if (tabIndex <= 0 || tabIndex === entry.length - 1) throw new Error('Git tree entry is malformed');
    const metadata = decodeAscii(entry.subarray(0, tabIndex), 'Git tree entry');
    const relativePath = decodeCanonicalUtf8(entry.subarray(tabIndex + 1), 'Git tree path');
    const match = /^(\d{6}) (\w+) ([a-f0-9]+)$/.exec(metadata);
    if (!match) throw new Error('Git tree entry is malformed');
    const [, mode, type, oid] = match;
    if (type !== 'blob' || (mode !== '100644' && mode !== '100755')) {
      throw new Error(`Projection rejects non-regular Git entry: ${relativePath}`);
    }
    return { path: validateProjectionPath(relativePath), mode, oid };
  }).sort((left, right) => comparePathsBytewise(left.path, right.path));
  assertUniqueActualPaths(entries.map((entry) => entry.path));
  assertCrossPlatformPathSet(entries.map((entry) => entry.path));
  return entries;
}

function assertContainedRegularWorktreeFile(rootDir, relativePath) {
  const candidatePath = path.join(rootDir, relativePath);
  const stat = fs.lstatSync(candidatePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`Projection rejects non-regular worktree entry: ${relativePath}`);
  }
  const rootRealPath = fs.realpathSync.native(rootDir);
  const candidateRealPath = fs.realpathSync.native(candidatePath);
  const relativeRealPath = path.relative(rootRealPath, candidateRealPath);
  if (relativeRealPath.startsWith('..') || path.isAbsolute(relativeRealPath)) {
    throw new Error(`Projection rejects worktree path escaping the repository: ${relativePath}`);
  }
}

function lstatExists(candidatePath) {
  try {
    fs.lstatSync(candidatePath);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return false;
    throw error;
  }
}

function parseWorktree(rootDir) {
  const indexed = splitNulRecords(
    git(rootDir, ['ls-files', '--stage', '-z'], null),
    'Git index',
  ).flatMap((entry) => {
    const tabIndex = entry.indexOf(0x09);
    if (tabIndex <= 0 || tabIndex === entry.length - 1) throw new Error('Git index entry is malformed');
    const metadata = decodeAscii(entry.subarray(0, tabIndex), 'Git index entry');
    const relativePath = decodeCanonicalUtf8(entry.subarray(tabIndex + 1), 'Git index path');
    const match = /^(\d{6}) ([a-f0-9]+) (\d)$/.exec(metadata);
    if (!match) throw new Error('Git index entry is malformed');
    const [, mode, oid, stage] = match;
    if (stage !== '0') throw new Error(`Projection rejects unresolved Git index entry: ${relativePath}`);
    if (mode !== '100644' && mode !== '100755') {
      throw new Error(`Projection rejects non-regular Git index entry: ${relativePath}`);
    }
    if (!lstatExists(path.join(rootDir, relativePath))) return [];
    const candidatePath = validateProjectionPath(relativePath);
    assertContainedRegularWorktreeFile(rootDir, candidatePath);
    return [{ path: candidatePath, mode, oid }];
  });

  const untracked = splitNulRecords(
    git(rootDir, ['ls-files', '--others', '--exclude-standard', '-z'], null),
    'Git untracked file list',
  ).map((entry) => {
    const relativePath = decodeCanonicalUtf8(entry, 'Git untracked path');
    const candidatePath = validateProjectionPath(relativePath);
    assertContainedRegularWorktreeFile(rootDir, candidatePath);
    return { path: candidatePath, mode: '100644' };
  });
  const entries = [...indexed, ...untracked].sort((left, right) => comparePathsBytewise(left.path, right.path));
  assertUniqueActualPaths(entries.map((entry) => entry.path));
  assertCrossPlatformPathSet(entries.map((entry) => entry.path));
  return entries;
}

function readCandidateBytes(rootDir, source, entry) {
  if (source.kind === 'commit') return git(rootDir, ['cat-file', 'blob', entry.oid], null);
  return fs.readFileSync(path.join(rootDir, entry.path));
}

function assertSafeText(relativePath, bytes) {
  if (bytes.byteLength > MAX_TEXT_BYTES) throw new Error(`Projection file exceeds text-size ceiling: ${relativePath}`);
  if (bytes.includes(0)) throw new Error(`Projection rejects binary content: ${relativePath}`);
  const text = bytes.toString('utf8');
  if (Buffer.from(text, 'utf8').compare(bytes) !== 0) throw new Error(`Projection file is not canonical UTF-8: ${relativePath}`);
  if (text.startsWith('version https://git-lfs.github.com/spec/v1\n')) {
    throw new Error(`Projection rejects Git LFS pointer content: ${relativePath}`);
  }
  if (deniedContentPatterns.some((pattern) => pattern.test(text))) {
    throw new Error(`Projection file matches a sensitive-content rule: ${relativePath}`);
  }
}

function assertExactPathSet(manifestPaths, entries) {
  const actualPaths = entries.map((entry) => entry.path);
  const missing = manifestPaths.filter((entry) => !actualPaths.includes(entry));
  const unexpected = actualPaths.filter((entry) => !manifestPaths.includes(entry));
  if (missing.length || unexpected.length) {
    throw new Error(`Projection path mismatch; missing=${missing.join(',') || '-'} unexpected=${unexpected.join(',') || '-'}`);
  }
}

export function verifyPublicProjection({
  rootDir = ROOT_DIR,
  worktree = false,
  commitRef = 'HEAD',
  requireSingleCommit = false,
} = {}) {
  const canonicalRoot = fs.realpathSync.native(path.resolve(rootDir));
  const source = worktree ? { kind: 'worktree' } : { kind: 'commit', commitRef };
  const entries = worktree ? parseWorktree(canonicalRoot) : parseCommitTree(canonicalRoot, commitRef);
  const manifestEntry = entries.find((entry) => entry.path === MANIFEST_PATH);
  if (!manifestEntry) throw new Error('Projection manifest is not part of the candidate');
  const manifestBytes = readCandidateBytes(canonicalRoot, source, manifestEntry);
  const manifestPaths = parsePathManifest(decodeCanonicalUtf8(manifestBytes, 'Projection path manifest'));
  assertExactPathSet(manifestPaths, entries);

  if (requireSingleCommit) {
    if (worktree) throw new Error('Single-commit history verification requires a committed candidate');
    const selectedCommit = git(canonicalRoot, ['rev-parse', '--verify', `${commitRef}^{commit}`]).trim();
    const headCommit = git(canonicalRoot, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
    if (selectedCommit !== headCommit) throw new Error('Initial public projection verification must target HEAD');
    const commitCount = Number(git(canonicalRoot, ['rev-list', '--count', '--all']).trim());
    if (commitCount !== 1) throw new Error(`Initial public projection must expose exactly one commit across all refs; found ${commitCount}`);
    if (git(canonicalRoot, ['rev-parse', '--is-shallow-repository']).trim() !== 'false') {
      throw new Error('Initial public projection cannot be a shallow repository');
    }
    const gitDir = path.resolve(canonicalRoot, git(canonicalRoot, ['rev-parse', '--git-dir']).trim());
    const commonDir = path.resolve(canonicalRoot, git(canonicalRoot, ['rev-parse', '--git-common-dir']).trim());
    if (gitDir !== commonDir) throw new Error('Initial public projection cannot use a shared Git object database');
    if (process.env.GIT_ALTERNATE_OBJECT_DIRECTORIES || process.env.GIT_OBJECT_DIRECTORY) {
      throw new Error('Initial public projection cannot use alternate Git object environment settings');
    }
    for (const relativeGitPath of ['objects/info/alternates', 'info/grafts']) {
      const resolvedGitPath = git(canonicalRoot, ['rev-parse', '--git-path', relativeGitPath]).trim();
      const absoluteGitPath = path.resolve(canonicalRoot, resolvedGitPath);
      if (lstatExists(absoluteGitPath) && fs.readFileSync(absoluteGitPath, 'utf8').trim().length > 0) {
        throw new Error(`Initial public projection cannot use ${relativeGitPath}`);
      }
    }
    const headRef = git(canonicalRoot, ['symbolic-ref', '-q', 'HEAD']).trim();
    const refs = git(canonicalRoot, ['for-each-ref', '--format=%(refname)']).split(/\r?\n/).filter(Boolean);
    if (refs.length !== 1 || refs[0] !== headRef) {
      throw new Error(`Initial public projection must contain only its current branch ref; found ${refs.join(',') || '-'}`);
    }
    const unreachable = git(canonicalRoot, ['fsck', '--unreachable', '--no-reflogs']).trim();
    if (unreachable.length > 0) throw new Error('Initial public projection contains unreachable Git objects');
  }

  const digests = [];
  for (const entry of entries) {
    const bytes = readCandidateBytes(canonicalRoot, source, entry);
    assertSafeText(entry.path, bytes);
    digests.push(`${entry.mode}\0${entry.path}\0${bytes.byteLength}\0${sha256(bytes)}`);
  }
  const projectionDigest = sha256(Buffer.from(digests.join('\n'), 'utf8'));
  return Object.freeze({ files: entries.length, projectionDigest, source: source.kind });
}

function main() {
  const worktree = process.argv.includes('--worktree');
  const requireSingleCommit = process.argv.includes('--require-single-commit');
  const commitArg = process.argv.find((argument) => argument.startsWith('--commit='));
  const rootArgs = process.argv.filter((argument) => argument.startsWith('--root='));
  if (rootArgs.length > 1 || rootArgs[0] === '--root=') {
    throw new Error('At most one non-empty --root=<repository-path> argument is accepted');
  }
  const result = verifyPublicProjection({
    rootDir: rootArgs[0]?.slice('--root='.length) || ROOT_DIR,
    worktree,
    commitRef: commitArg?.slice('--commit='.length) || 'HEAD',
    requireSingleCommit,
  });
  console.log(`PUBLIC_PROJECTION_PASS files=${result.files} digest=${result.projectionDigest} source=${result.source}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(`PUBLIC_PROJECTION_FAIL ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
