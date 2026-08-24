import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const packageDirectories = [
  'core',
  'business',
  'creator',
  'memory',
  'investor',
  'health',
  'life-sciences-researcher',
  'family',
  'orchestration',
];

for (const packageDirectory of packageDirectories) {
  const packageRoot = path.join(root, 'packages', packageDirectory);
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageManifest = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const entryPath = path.join(root, 'packages', packageDirectory, 'dist', 'index.js');
  const declarationPath = path.join(packageRoot, 'dist', 'index.d.ts');
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Built package entry is missing: packages/${packageDirectory}/dist/index.js`);
  }
  if (!fs.existsSync(declarationPath)) {
    throw new Error(`Built package declaration is missing: packages/${packageDirectory}/dist/index.d.ts`);
  }
  if (typeof packageManifest.name !== 'string') {
    throw new Error(`Package name is missing: packages/${packageDirectory}/package.json`);
  }
  const requireFromPackage = createRequire(packageJsonPath);
  const resolvedEntry = requireFromPackage.resolve(packageManifest.name);
  if (fs.realpathSync.native(resolvedEntry) !== fs.realpathSync.native(entryPath)) {
    throw new Error(`Package export does not resolve to dist/index.js: ${packageManifest.name}`);
  }
  const module = await import(pathToFileURL(resolvedEntry).href);
  if (Object.keys(module).length === 0) {
    throw new Error(`Built package has no public exports: ${packageDirectory}`);
  }
  console.log(`PACKAGE_IMPORT_OK ${packageDirectory}`);
}
