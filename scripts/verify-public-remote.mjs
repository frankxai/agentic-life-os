import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSanitizedGitEnvironment } from './export-public-projection.mjs';
import { verifyPublicProjection } from './verify-public-projection.mjs';

const __filename = fileURLToPath(import.meta.url);

function argument(name) {
  const prefix = `--${name}=`;
  const matches = process.argv.filter((value) => value.startsWith(prefix));
  if (matches.length !== 1) throw new Error(`Exactly one ${prefix}<value> argument is required`);
  return matches[0].slice(prefix.length);
}

function git(repoDir, args) {
  return execFileSync('git', ['-C', repoDir, ...args], {
    encoding: 'utf8',
    env: buildSanitizedGitEnvironment(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function validateRemoteAdvertisement(output, branch, expectedCommit) {
  const expectedBranchRef = `refs/heads/${branch}`;
  const symbolicRefs = [];
  const objectRefs = [];
  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const symbolic = /^ref: ([^\t]+)\t([^\t]+)$/.exec(line);
    if (symbolic) {
      symbolicRefs.push({ target: symbolic[1], name: symbolic[2] });
      continue;
    }
    const object = /^([a-f0-9]{40})\t([^\t]+)$/.exec(line);
    if (!object) throw new Error('Remote advertised a malformed or unsupported reference');
    objectRefs.push({ commit: object[1], name: object[2] });
  }

  if (
    symbolicRefs.length !== 1 ||
    symbolicRefs[0].name !== 'HEAD' ||
    symbolicRefs[0].target !== expectedBranchRef
  ) {
    throw new Error('Remote HEAD is not the sole symbolic ref bound to the approved branch');
  }
  const expectedObjectNames = new Set(['HEAD', expectedBranchRef]);
  if (
    objectRefs.length !== 2 ||
    objectRefs.some((ref) => !expectedObjectNames.has(ref.name) || ref.commit !== expectedCommit) ||
    new Set(objectRefs.map((ref) => ref.name)).size !== 2
  ) {
    throw new Error('Remote exposes an extra branch, tag, ref, or unapproved commit');
  }
}

export function main() {
  const repository = argument('repository');
  const branch = argument('branch');
  const expectedCommit = argument('expected-commit');
  const expectedTree = argument('expected-tree');
  const expectedDigest = argument('expected-digest');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Invalid GitHub repository name');
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,100}$/.test(branch) || branch.includes('..') || branch.includes('@{')) {
    throw new Error('Invalid branch name');
  }
  if (!/^[a-f0-9]{40}$/.test(expectedCommit) || !/^[a-f0-9]{40}$/.test(expectedTree)) {
    throw new Error('Expected commit and tree must be full lowercase SHA-1 IDs');
  }
  if (!/^[a-f0-9]{64}$/.test(expectedDigest)) throw new Error('Expected projection digest must be SHA-256');

  const tempParent = fs.realpathSync.native(os.tmpdir());
  const tempRoot = fs.mkdtempSync(path.join(tempParent, 'alos-remote-verify-'));
  const clonePath = path.join(tempRoot, 'candidate');
  try {
    const remoteUrl = `https://github.com/${repository}.git`;
    const advertisedRefs = execFileSync('git', [
      '-c', 'credential.helper=', 'ls-remote', '--symref', remoteUrl,
    ], {
      encoding: 'utf8',
      env: buildSanitizedGitEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    validateRemoteAdvertisement(advertisedRefs, branch, expectedCommit);

    execFileSync('git', [
      '-c', 'credential.helper=',
      'clone', '--filter=blob:none', '--no-tags', '--single-branch', '--branch', branch,
      remoteUrl, clonePath,
    ], {
      encoding: 'utf8',
      env: buildSanitizedGitEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const actualCommit = git(clonePath, ['rev-parse', 'HEAD^{commit}']).trim();
    const actualTree = git(clonePath, ['rev-parse', 'HEAD^{tree}']).trim();
    if (actualCommit !== expectedCommit || actualTree !== expectedTree) {
      throw new Error('Remote branch commit/tree does not match the approved projection receipt');
    }
    if (Number(git(clonePath, ['rev-list', '--count', '--all']).trim()) !== 1) {
      throw new Error('Remote repository exposes more than one reachable commit');
    }
    const refTargets = git(clonePath, ['for-each-ref', '--format=%(objectname)']).split(/\r?\n/).filter(Boolean);
    if (refTargets.length === 0 || refTargets.some((value) => value !== expectedCommit)) {
      throw new Error('Remote refs are not all bound to the approved root commit');
    }

    const assessment = verifyPublicProjection({ rootDir: clonePath, commitRef: 'HEAD' });
    if (assessment.projectionDigest !== expectedDigest) {
      throw new Error('Remote projection digest does not match the approved receipt');
    }
    console.log(`PUBLIC_REMOTE_PASS repository=${repository} commit=${actualCommit} digest=${assessment.projectionDigest}`);
  } finally {
    const resolvedTempRoot = path.resolve(tempRoot);
    if (path.dirname(resolvedTempRoot) !== tempParent || !path.basename(resolvedTempRoot).startsWith('alos-remote-verify-')) {
      throw new Error('Refusing to clean an unverified temporary path');
    }
    fs.rmSync(resolvedTempRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(`PUBLIC_REMOTE_FAIL ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
