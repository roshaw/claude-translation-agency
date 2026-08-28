#!/usr/bin/env node
// Reference PROJECT GATE for the Translation Agency `gates` feature.
//
// Copy into the project you translate, replace the ONE `runCheck` TODO with your real
// check, and point translation.config.json → gates at it. Contract + wiring: ./README.md
// and the toolkit's `/translate` Step 6.7. This is a template, not a real plagiarism check.
//
// Usage (the toolkit substitutes the placeholders):
//   node gate.mjs --lang de --out .translate-gate/de.json --files "a.md b.md"
// Emits a findings verdict to --out (and stdout) and exits 0. A crash / missing verdict
// is treated by the toolkit as a gate failure.

import fs from 'node:fs';
import path from 'node:path';

// ---- parse args ------------------------------------------------------------
// --files may be space- or comma-separated; repeated --files also accumulate.
function parseArgs(argv) {
  const out = { lang: '', out: '', files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--lang') out.lang = argv[++i] ?? '';
    else if (a === '--out') out.out = argv[++i] ?? '';
    else if (a === '--files') out.files.push(...(argv[++i] ?? '').split(/[\s,]+/).filter(Boolean));
  }
  return out;
}

// ---- YOUR CHECK GOES HERE --------------------------------------------------
// Return an array of findings (empty array = clean). One finding per problem:
//   { file, passage, issue, suggestion }
// Replace this body with a real plagiarism / readability / compliance check.
function runCheck({ files /*, lang */ }) {
  const findings = [];
  for (const file of files) {
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }

    // TODO: real check. Placeholder demo — flags an obvious leftover marker so the
    // template is runnable end-to-end. Delete this and implement your own.
    const m = text.match(/\bLOREM_PLACEHOLDER\b/);
    if (m) {
      findings.push({
        file,
        passage: text.slice(Math.max(0, m.index - 20), m.index + 40),
        issue: 'placeholder marker left in output',
        suggestion: 'remove the LOREM_PLACEHOLDER marker and write real copy',
      });
    }
  }
  return findings;
}

// ---- main ------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
const findings = runCheck(args);
const verdict = {
  status: findings.length === 0 ? 'pass' : 'fail',
  disposition: 'refine', // hint; the operator's onFail config decides the actual action
  findings,
};

const json = JSON.stringify(verdict, null, 2);
if (args.out) {
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, json);
}
process.stdout.write(json + '\n');
process.exit(0); // pass/fail is read from the verdict, not the exit code
