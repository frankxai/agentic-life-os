#!/usr/bin/env node
/**
 * Scan the full git history for real-looking personal data.
 *
 * A clean-history public projection is only clean if the history behind it is.
 * `check-public-safety.mjs` inspects the worktree; this inspects every blob every
 * commit ever introduced, because a record deleted in commit N is still in the pack
 * file and still ships with a clone.
 *
 * Reports COUNTS ONLY. It never prints a matched value, and it never prints the
 * surrounding line — printing a leak to find a leak is how the leak spreads. Use
 * `--paths` to get the file paths that hold hits, which is enough to act on.
 *
 *   node scripts/scan-history-personal-data.mjs
 *   node scripts/scan-history-personal-data.mjs --paths --ref origin/main
 *
 * Exit 0 when nothing matched, 1 when something did. Findings need human review:
 * these patterns match synthetic data too, and a count is a prompt to look, not a verdict.
 */

import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const showPaths = args.includes('--paths');
const refIndex = args.indexOf('--ref');
const ref = refIndex === -1 ? '--all' : args[refIndex + 1];

/**
 * Deliberately narrow. Each pattern targets a shape that is expensive to leak and
 * rare in source. Broad patterns (any 9-digit run, any capitalised pair) produce
 * a number nobody reads, which is worse than no scan.
 */
const PATTERNS = [
  {
    id: 'email',
    // Excludes the reserved example/test/invalid TLDs, which are the correct way
    // to write a synthetic address and therefore not a finding.
    re: /\b[A-Za-z0-9._%+-]+@(?!example\.|test\.|invalid\b|localhost\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    id: 'phone-e164',
    re: /(?<![\w.])\+(?:[1-9]\d{0,2})[\s.-]?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}(?![\w.])/g,
  },
  {
    id: 'iban',
    re: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g,
    // No IBAN is shorter than 15 characters or longer than 34. Without this the
    // pattern fires on every uppercase-prefixed identifier in a test fixture.
    accept: (m) => {
      const s = m.replace(/ /g, '');
      return s.length >= 15 && s.length <= 34;
    },
  },
  {
    id: 'credit-card-like',
    re: /\b(?:\d[ -]?){13,19}\b/g,
    // Luhn. Long digit runs are everywhere in canvas coordinates, timestamps and
    // generated ids; a checksum is the difference between a signal and a chore.
    accept: (m) => luhn(m.replace(/[ -]/g, '')),
  },
  {
    id: 'us-ssn-like',
    re: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    id: 'date-of-birth-field',
    re: /\b(?:date_of_birth|dateOfBirth|dob|birthdate|birthDate)\b\s*[:=]/g,
  },
];

function luhn(digits) {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
}

function isProbablyText(content) {
  return !content.includes('\u0000');
}

const counts = Object.fromEntries(PATTERNS.map((p) => [p.id, 0]));
const pathsByPattern = Object.fromEntries(PATTERNS.map((p) => [p.id, new Set()]));

// Every blob ever reachable, deduplicated by object id, with the path it was
// introduced under. `--all` covers every branch and tag, not just HEAD.
const listing = git('rev-list', '--objects', ref);
const blobs = [];
for (const line of listing.split('\n')) {
  const space = line.indexOf(' ');
  if (space === -1) continue;
  const oid = line.slice(0, space);
  const path = line.slice(space + 1);
  if (path) blobs.push({ oid, path });
}

// Skip the scanner's own source, which necessarily contains the patterns.
const SELF = 'scripts/scan-history-personal-data.mjs';

let scanned = 0;
let skippedBinary = 0;
for (const { oid, path } of blobs) {
  if (path === SELF) continue;
  let type;
  try {
    type = git('cat-file', '-t', oid).trim();
  } catch {
    continue;
  }
  if (type !== 'blob') continue;

  let content;
  try {
    content = git('cat-file', 'blob', oid);
  } catch {
    continue;
  }
  if (!isProbablyText(content)) {
    skippedBinary += 1;
    continue;
  }
  scanned += 1;

  for (const { id, re, accept } of PATTERNS) {
    re.lastIndex = 0;
    const matches = (content.match(re) ?? []).filter((m) => (accept ? accept(m) : true));
    if (matches.length > 0) {
      counts[id] += matches.length;
      pathsByPattern[id].add(path);
    }
  }
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);

console.log(`ref              ${ref}`);
console.log(`blobs listed     ${blobs.length}`);
console.log(`text blobs read  ${scanned}`);
console.log(`binary skipped   ${skippedBinary}`);
console.log('');
console.log('pattern               matches  files');
for (const { id } of PATTERNS) {
  console.log(`${id.padEnd(21)} ${String(counts[id]).padStart(7)}  ${pathsByPattern[id].size}`);
}
console.log('');
console.log(`total matches    ${total}`);

if (showPaths) {
  console.log('');
  for (const { id } of PATTERNS) {
    if (pathsByPattern[id].size === 0) continue;
    console.log(`${id}:`);
    for (const p of [...pathsByPattern[id]].sort()) console.log(`  ${p}`);
  }
}

if (total > 0) {
  console.log('');
  console.log('Matched values are NOT printed. Review the listed paths by hand; these');
  console.log('patterns match synthetic and structural data too, so a count is a prompt');
  console.log('to look, not a finding. Real personal data in history needs a rewrite,');
  console.log('not a delete commit.');
}

process.exit(total > 0 ? 1 : 0);
