import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  decodeCanonicalUtf8,
  validateProjectionPath,
  verifyPublicProjection,
} from './verify-public-projection.mjs';

const __filename = fileURLToPath(import.meta.url);
const SOURCE_ROOT = fs.realpathSync.native(path.resolve(path.dirname(__filename), '..'));
const NULL_DEVICE = process.platform === 'win32' ? 'NUL' : '/dev/null';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function buildSanitizedGitEnvironment(sourceEnvironment = process.env, overrides = {}) {
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
    ...overrides,
  };
}

function git(repoDir, args, { encoding = 'utf8', input, env } = {}) {
  return execFileSync('git', [
    '-c', 'i18n.commitEncoding=UTF-8',
    '-c', 'i18n.logOutputEncoding=UTF-8',
    '-c', `core.attributesFile=${NULL_DEVICE}`,
    '-C', repoDir,
    ...args,
  ], {
    encoding,
    input,
    env: env ?? buildSanitizedGitEnvironment(),
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
  });
}

function argument(name) {
  const prefix = `--${name}=`;
  const matches = process.argv.filter((value) => value.startsWith(prefix));
  if (matches.length !== 1) throw new Error(`Exactly one ${prefix}<value> argument is required`);
  return matches[0].slice(prefix.length);
}

function isWithin(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function lstatIfPresent(candidate) {
  try {
    return fs.lstatSync(candidate);
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

/**
 * Projects a possibly non-existent target through its nearest real ancestor.
 * Existing symlink/junction ancestors are rejected before any write.
 */
export function resolveCanonicalFuturePath(targetPath) {
  const absoluteTarget = path.resolve(targetPath);
  let cursor = absoluteTarget;
  let nearestExisting;

  for (;;) {
    const stat = lstatIfPresent(cursor);
    if (stat !== undefined) {
      if (stat.isSymbolicLink()) {
        throw new Error('Export path has a symbolic-link or junction ancestor');
      }
      nearestExisting ??= cursor;
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  if (nearestExisting === undefined) throw new Error('Export path has no resolvable filesystem ancestor');
  const nearestStat = fs.lstatSync(nearestExisting);
  if (nearestExisting !== absoluteTarget && !nearestStat.isDirectory()) {
    throw new Error('Export path has a non-directory ancestor');
  }
  const realAncestor = fs.realpathSync.native(nearestExisting);
  return path.resolve(realAncestor, path.relative(nearestExisting, absoluteTarget));
}

function samePath(left, right) {
  return path.relative(left, right) === '' && path.relative(right, left) === '';
}

function assertSeparated(destination, receiptPath) {
  if (isWithin(destination, SOURCE_ROOT) || isWithin(SOURCE_ROOT, destination)) {
    throw new Error('Destination must be outside the private source repository and its ancestors');
  }
  if (
    isWithin(receiptPath, destination) ||
    isWithin(destination, receiptPath) ||
    isWithin(receiptPath, SOURCE_ROOT) ||
    isWithin(SOURCE_ROOT, receiptPath)
  ) {
    throw new Error('Receipt must be separate from both source and public repositories');
  }
}

function parseSourceTree(commitSha) {
  const raw = Buffer.from(git(SOURCE_ROOT, ['ls-tree', '-r', '-z', '--full-tree', commitSha], {
    encoding: null,
  }));
  if (raw.length > 0 && raw.at(-1) !== 0) throw new Error('Reviewed source tree is missing its terminal NUL byte');
  const records = [];
  let start = 0;
  for (let index = 0; index < raw.length; index += 1) {
    if (raw[index] !== 0) continue;
    if (index === start) throw new Error('Reviewed source tree contains an empty entry');
    records.push(raw.subarray(start, index));
    start = index + 1;
  }
  const entries = records.map((entry) => {
    const tabIndex = entry.indexOf(0x09);
    if (tabIndex <= 0 || tabIndex === entry.length - 1) {
      throw new Error('Reviewed source tree contains a non-regular or malformed entry');
    }
    const metadataBytes = entry.subarray(0, tabIndex);
    if (metadataBytes.some((value) => value > 0x7f)) {
      throw new Error('Reviewed source tree contains malformed metadata');
    }
    const match = /^(100644|100755) blob ([a-f0-9]+)$/.exec(metadataBytes.toString('ascii'));
    if (!match) throw new Error('Reviewed source tree contains a non-regular or malformed entry');
    const [, mode, blobOid] = match;
    const relativePath = validateProjectionPath(
      decodeCanonicalUtf8(entry.subarray(tabIndex + 1), 'Reviewed source tree path'),
    );
    return { mode, blobOid, relativePath };
  });
  if (new Set(entries.map((entry) => entry.relativePath)).size !== entries.length) {
    throw new Error('Reviewed source tree contains duplicate decoded paths');
  }
  return entries;
}

export function main() {
  const requestedCommit = argument('source-commit');
  if (!/^[a-f0-9]{40}$/.test(requestedCommit)) {
    throw new Error('source-commit must be a full lowercase 40-character Git commit ID');
  }
  const sourceCommit = git(SOURCE_ROOT, ['rev-parse', '--verify', `${requestedCommit}^{commit}`]).trim();
  if (sourceCommit !== requestedCommit) throw new Error('source-commit did not resolve exactly');

  const destination = path.resolve(argument('destination'));
  const receiptPath = path.resolve(argument('receipt'));
  if (lstatIfPresent(destination) !== undefined || lstatIfPresent(receiptPath) !== undefined) {
    throw new Error('Destination and receipt paths must not already exist');
  }
  const canonicalDestination = resolveCanonicalFuturePath(destination);
  const canonicalReceiptPath = resolveCanonicalFuturePath(receiptPath);
  assertSeparated(canonicalDestination, canonicalReceiptPath);

  const sourceAssessment = verifyPublicProjection({ commitRef: sourceCommit });
  const entries = parseSourceTree(sourceCommit);
  if (entries.length !== sourceAssessment.files) throw new Error('Source tree changed during verification');
  const sourceTimestamp = git(SOURCE_ROOT, ['show', '-s', '--format=%cI', sourceCommit]).trim();

  fs.mkdirSync(destination, { recursive: false });
  const destinationRealPath = fs.realpathSync.native(destination);
  if (!samePath(destinationRealPath, canonicalDestination)) {
    throw new Error('Destination resolved differently after creation');
  }
  assertSeparated(destinationRealPath, canonicalReceiptPath);
  git(destinationRealPath, ['init', '--object-format=sha1', '--initial-branch=main']);
  git(destinationRealPath, ['config', 'core.autocrlf', 'false']);
  git(destinationRealPath, ['config', 'core.safecrlf', 'true']);
  git(destinationRealPath, ['config', 'i18n.commitEncoding', 'UTF-8']);

  const receiptEntries = [];
  for (const entry of entries) {
    const bytes = git(SOURCE_ROOT, ['cat-file', 'blob', entry.blobOid], { encoding: null });
    const destinationPath = path.resolve(destinationRealPath, ...entry.relativePath.split('/'));
    if (samePath(destinationPath, destinationRealPath) || !isWithin(destinationPath, destinationRealPath)) {
      throw new Error('Projection entry escapes the destination repository');
    }
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, bytes, { flag: 'wx' });
    if (entry.mode === '100755' && process.platform !== 'win32') fs.chmodSync(destinationPath, 0o755);

    const publicBlobOid = git(destinationRealPath, ['hash-object', '-w', '--stdin'], { input: bytes }).trim();
    if (publicBlobOid !== entry.blobOid) throw new Error(`Git blob mismatch while exporting ${entry.relativePath}`);
    git(destinationRealPath, ['update-index', '--add', '--cacheinfo', entry.mode, publicBlobOid, entry.relativePath]);
    receiptEntries.push({
      path: entry.relativePath,
      mode: entry.mode,
      sourceBlobOid: entry.blobOid,
      publicBlobOid,
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
    });
  }

  const publicTree = git(destinationRealPath, ['write-tree']).trim();
  const commitEnvironment = buildSanitizedGitEnvironment(process.env, {
    GIT_AUTHOR_NAME: 'FrankX Public Release',
    GIT_AUTHOR_EMAIL: 'opensource@frankx.ai',
    GIT_AUTHOR_DATE: sourceTimestamp,
    GIT_COMMITTER_NAME: 'FrankX Public Release',
    GIT_COMMITTER_EMAIL: 'opensource@frankx.ai',
    GIT_COMMITTER_DATE: sourceTimestamp,
  });
  const publicRootCommit = git(destinationRealPath, ['commit-tree', publicTree], {
    input: 'feat: publish Agentic Life OS 0.3.0\n',
    env: commitEnvironment,
  }).trim();
  git(destinationRealPath, ['update-ref', 'refs/heads/main', publicRootCommit]);
  if (git(destinationRealPath, ['status', '--porcelain']).trim().length !== 0) {
    throw new Error('Exported public worktree does not exactly match its root commit');
  }

  const publicAssessment = verifyPublicProjection({
    rootDir: destinationRealPath,
    commitRef: 'HEAD',
    requireSingleCommit: true,
  });
  if (publicAssessment.projectionDigest !== sourceAssessment.projectionDigest) {
    throw new Error('Public root projection digest does not match the reviewed source commit');
  }
  if (git(destinationRealPath, ['status', '--porcelain']).trim().length !== 0) {
    throw new Error('Exported public worktree changed during trusted verification');
  }

  const receipt = {
    schemaVersion: 'alos-public-projection-receipt.v1',
    source: {
      repository: 'private-source:agentic-life-os',
      commit: sourceCommit,
      projectionDigest: sourceAssessment.projectionDigest,
    },
    publicRoot: {
      branch: 'main',
      commit: publicRootCommit,
      tree: publicTree,
      projectionDigest: publicAssessment.projectionDigest,
    },
    sourceTimestamp,
    entries: receiptEntries,
  };
  const receiptParent = path.dirname(receiptPath);
  fs.mkdirSync(receiptParent, { recursive: true });
  const receiptParentRealPath = fs.realpathSync.native(receiptParent);
  if (!samePath(receiptParentRealPath, path.dirname(canonicalReceiptPath))) {
    throw new Error('Receipt parent resolved differently after creation');
  }
  assertSeparated(destinationRealPath, canonicalReceiptPath);
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx', encoding: 'utf8' });
  if (!samePath(fs.realpathSync.native(receiptPath), canonicalReceiptPath)) {
    throw new Error('Receipt resolved differently after creation');
  }
  console.log(`PUBLIC_EXPORT_PASS files=${entries.length} commit=${publicRootCommit} digest=${publicAssessment.projectionDigest}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(`PUBLIC_EXPORT_FAIL ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
