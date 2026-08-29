import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getHealthCheckDefinition, resolveContainedDirectory } from './alos-health.mjs';

describe('bounded workspace health checks', () => {
  it('rejects command-like profile values instead of passing them to a shell', () => {
    expect(() => getHealthCheckDefinition('vitest-module && arbitrary-command')).toThrow(/unknown health-check identifier/i);
  });

  it('binds the executable to this repository and exposes no executing root override', () => {
    const definition = getHealthCheckDefinition('vitest-module');
    expect(path.basename(definition.args[0])).toBe('vitest.mjs');
    expect(definition.args[0]).toContain(`${path.sep}agentic-life-os${path.sep}node_modules${path.sep}`);
  });

  it('rejects lexical path traversal and absolute paths', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alos-health-root-'));
    try {
      expect(() => resolveContainedDirectory(root, '../outside')).toThrow(/repository-relative/i);
      expect(() => resolveContainedDirectory(root, path.resolve(root))).toThrow(/repository-relative/i);
      expect(() => resolveContainedDirectory(root, 'nested\\..\\outside')).toThrow(/repository-relative/i);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects a repository junction or symlink that resolves outside the root', () => {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'alos-health-link-'));
    const root = path.join(sandbox, 'root');
    const outside = path.join(sandbox, 'outside');
    const link = path.join(root, 'escaped-module');
    fs.mkdirSync(root);
    fs.mkdirSync(outside);
    fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');

    try {
      expect(() => resolveContainedDirectory(root, 'escaped-module')).toThrow(/resolves outside/i);
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
