import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadLifeOSProfile } from '../packages/core/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PROFILE_PATH = path.join(ROOT_DIR, 'alos-profile.yaml');

function runCommandInPath(command, cwd) {
  try {
    execSync(command, { cwd, stdio: 'pipe', timeout: 30000 });
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error.stdout?.toString() || error.stderr?.toString() || error.message,
    };
  }
}

function main() {
  console.log('🏛️  Agentic Life OS (ALOS) — Workspace Health Audit');
  console.log('===================================================');

  let profile;
  try {
    profile = loadLifeOSProfile(PROFILE_PATH);
  } catch (error) {
    console.error(`❌ Failed to load ALOS profile: ${error.message}`);
    process.exit(1);
  }

  const modules = profile.modules;
  if (!modules || typeof modules !== 'object') {
    console.error('❌ No modules declared in the profile.');
    process.exit(1);
  }

  let passedCount = 0;
  let failedCount = 0;
  const start = Date.now();

  for (const [key, mod] of Object.entries(modules)) {
    console.log(`\n🔍 Auditing [${key.toUpperCase()}] at ${mod.path}...`);
    console.log(`   Command: \`${mod.healthCommand}\``);

    if (!fs.existsSync(mod.path)) {
      console.log(`   ❌ [FAIL] Directory does not exist on workstation.`);
      failedCount++;
      continue;
    }

    const t0 = Date.now();
    const result = runCommandInPath(mod.healthCommand, mod.path);
    const duration = ((Date.now() - t0) / 1000).toFixed(2);

    if (result.success) {
      console.log(`   ✅ [PASS] in ${duration}s`);
      passedCount++;
    } else {
      console.log(`   ❌ [FAIL] in ${duration}s`);
      console.log(`   --- Error Output ---`);
      console.log(result.error.split('\n').slice(0, 10).join('\n')); // show first 10 lines
      console.log(`   --------------------`);
      failedCount++;
    }
  }

  const totalDuration = ((Date.now() - start) / 1000).toFixed(2);
  console.log('\n===================================================');
  console.log(`📊 Audit Complete: ${passedCount} passed, ${failedCount} failed.`);
  console.log(`   Total Duration: ${totalDuration}s`);
  console.log('===================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All Agentic Life OS modules are fully healthy and compliant!');
  }
}

main();
