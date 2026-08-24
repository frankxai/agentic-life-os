import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  decodeCanonicalUtf8,
  parsePathManifest,
  validateProjectionPath,
  verifyPublicProjection,
} from './verify-public-projection.mjs';
import {
  buildSanitizedGitEnvironment,
  resolveCanonicalFuturePath,
} from './export-public-projection.mjs';
import { validateRemoteAdvertisement } from './verify-public-remote.mjs';

describe('public projection verifier', () => {
  it('accepts only a sorted, unique, self-containing path manifest', () => {
    expect(parsePathManifest('README.md\nrelease/public-projection.paths\n')).toEqual([
      'README.md',
      'release/public-projection.paths',
    ]);
    expect(() => parsePathManifest('release/public-projection.paths\nREADME.md\n')).toThrow(/sorted/i);
    expect(() => parsePathManifest('README.md\nREADME.md\nrelease/public-projection.paths\n')).toThrow(/duplicates/i);
  });

  it('rejects private roots, archives, genomic files, and traversal', () => {
    for (const unsafePath of [
      '../escape.md',
      '.git/hooks/post-checkout',
      'vaults/private.md',
      'records/person.vcf',
      'release/candidate.zip',
      'C:/private/file.md',
      'docs/CON.txt',
      'docs/trailing. ',
      `docs/cafe\u0301.md`,
      'docs/question?.md',
      'docs/CONIN$',
      'docs/CONOUT$.txt',
      'docs/COM¹',
      'docs/LPT².log',
    ]) {
      expect(() => validateProjectionPath(unsafePath)).toThrow();
    }
  });

  it('rejects non-canonical UTF-8 Git path bytes instead of replacement-decoding them', () => {
    expect(() => decodeCanonicalUtf8(
      Buffer.from([0x62, 0x61, 0x64, 0xff]),
      'Synthetic Git path',
    )).toThrow(/not canonical UTF-8/i);
  });

  it('rejects case-fold collisions that would overwrite on common filesystems', () => {
    expect(() => parsePathManifest([
      'README.md',
      'readme.md',
      'release/public-projection.paths',
      '',
    ].join('\n'))).toThrow(/case-insensitive filesystems/i);
  });

  it('rejects an export path that traverses a symbolic-link or junction ancestor', () => {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'alos-export-link-test-'));
    const realTarget = path.join(sandbox, 'real-target');
    const link = path.join(sandbox, 'linked-target');
    fs.mkdirSync(realTarget);
    fs.symlinkSync(realTarget, link, process.platform === 'win32' ? 'junction' : 'dir');
    try {
      expect(() => resolveCanonicalFuturePath(path.join(link, 'public'))).toThrow(/symbolic-link or junction/i);
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('removes inherited Git controls and pins deterministic locale/config inputs', () => {
    const environment = buildSanitizedGitEnvironment({
      PATH: 'synthetic-path',
      GIT_DEFAULT_HASH: 'sha256',
      GIT_CONFIG_COUNT: '99',
    });
    expect(environment.PATH).toBe('synthetic-path');
    expect(environment.GIT_DEFAULT_HASH).toBeUndefined();
    expect(environment.GIT_CONFIG_COUNT).toBeUndefined();
    expect(environment.GIT_CONFIG_NOSYSTEM).toBe('1');
    expect(environment.GIT_NO_REPLACE_OBJECTS).toBe('1');
    expect(environment.LC_ALL).toBe('C');
    expect(environment.TZ).toBe('UTC');
  });

  it('ignores replacement refs while verifying a concrete temporary repository', () => {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'alos-replace-ref-test-'));
    const gitEnvironment = buildSanitizedGitEnvironment();
    const runGit = (args, options = {}) => execFileSync('git', ['-C', sandbox, ...args], {
      encoding: 'utf8',
      env: gitEnvironment,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });
    try {
      fs.mkdirSync(path.join(sandbox, 'release'));
      fs.writeFileSync(path.join(sandbox, 'README.md'), 'reviewed root\n');
      fs.writeFileSync(
        path.join(sandbox, 'release', 'public-projection.paths'),
        'README.md\nrelease/public-projection.paths\n',
      );
      runGit(['init', '--object-format=sha1', '--initial-branch=main']);
      runGit(['config', 'user.name', 'Synthetic Test']);
      runGit(['config', 'user.email', 'synthetic@example.invalid']);
      runGit(['add', '--', 'README.md', 'release/public-projection.paths']);
      runGit(['commit', '-m', 'reviewed root']);
      const reviewedCommit = runGit(['rev-parse', 'HEAD']).trim();

      fs.writeFileSync(path.join(sandbox, 'README.md'), 'replacement root\n');
      fs.writeFileSync(path.join(sandbox, 'legacy.md'), 'unreviewed replacement content\n');
      runGit(['add', '--', 'README.md', 'legacy.md']);
      runGit(['commit', '-m', 'replacement tree']);
      const replacementCommit = runGit(['rev-parse', 'HEAD']).trim();
      runGit(['reset', '--hard', reviewedCommit]);
      runGit(['replace', reviewedCommit, replacementCommit]);

      const replacementAwareEnvironment = buildSanitizedGitEnvironment();
      delete replacementAwareEnvironment.GIT_NO_REPLACE_OBJECTS;
      const replacementAwareTree = execFileSync(
        'git',
        ['-C', sandbox, 'ls-tree', '-r', '--name-only', 'HEAD'],
        {
          encoding: 'utf8',
          env: replacementAwareEnvironment,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      expect(replacementAwareTree).toContain('legacy.md');

      expect(verifyPublicProjection({ rootDir: sandbox, commitRef: 'HEAD' })).toMatchObject({
        files: 2,
        source: 'commit',
      });
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('treats candidate verifier files as inert data', () => {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'alos-inert-candidate-test-'));
    const marker = path.join(sandbox, 'EXECUTED_MARKER');
    const environment = buildSanitizedGitEnvironment();
    const runGit = (args) => execFileSync('git', ['-C', sandbox, ...args], {
      encoding: 'utf8',
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    try {
      fs.mkdirSync(path.join(sandbox, 'release'));
      fs.mkdirSync(path.join(sandbox, 'scripts'));
      fs.writeFileSync(path.join(sandbox, 'README.md'), 'reviewed root\n');
      fs.writeFileSync(
        path.join(sandbox, 'scripts', 'verify-public-projection.mjs'),
        "import fs from 'node:fs'; fs.writeFileSync(new URL('../EXECUTED_MARKER', import.meta.url), 'executed');\n",
      );
      fs.writeFileSync(
        path.join(sandbox, 'release', 'public-projection.paths'),
        [
          'README.md',
          'release/public-projection.paths',
          'scripts/verify-public-projection.mjs',
          '',
        ].join('\n'),
      );
      runGit(['init', '--object-format=sha1', '--initial-branch=main']);
      runGit(['config', 'user.name', 'Synthetic Test']);
      runGit(['config', 'user.email', 'synthetic@example.invalid']);
      runGit(['add', '--', 'README.md', 'release/public-projection.paths', 'scripts/verify-public-projection.mjs']);
      runGit(['commit', '-m', 'inert candidate']);

      expect(verifyPublicProjection({ rootDir: sandbox, commitRef: 'HEAD' }).files).toBe(3);
      expect(fs.existsSync(marker)).toBe(false);
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('requires the remote advertisement to contain only HEAD and the approved branch', () => {
    const commit = 'a'.repeat(40);
    const valid = [
      'ref: refs/heads/main\tHEAD',
      `${commit}\tHEAD`,
      `${commit}\trefs/heads/main`,
      '',
    ].join('\n');
    expect(() => validateRemoteAdvertisement(valid, 'main', commit)).not.toThrow();
    expect(() => validateRemoteAdvertisement(
      `${valid}${commit}\trefs/heads/legacy\n`,
      'main',
      commit,
    )).toThrow(/extra branch, tag, ref/i);
    expect(() => validateRemoteAdvertisement(
      `${valid}${commit}\trefs/tags/v0.1.0\n`,
      'main',
      commit,
    )).toThrow(/extra branch, tag, ref/i);
  });
});
