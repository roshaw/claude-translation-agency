#!/usr/bin/env node
// Layer 1 + Layer 3 — regression / equivalence / idempotence guards.
//
// .claude/ is the AUTHORED source of truth (hand-edited in Claude Code); every
// other tool tree is generated FROM it (loadUnit → adapters/<tool>.json + tiers.json).
//
// Layer 1 (no-regression):
//   - `claude`: generating to a temp dir and comparing to the committed .claude/
//     proves the parse+render TOOLCHAIN is faithful (it never corrupts the source
//     as it splits frontmatter/body) — the source is never overwritten by a build.
//   - other tools: the committed tree matches a fresh generation from the current
//     .claude/, i.e. it hasn't drifted (someone edited .claude/ but forgot to
//     re-run `npm run build:agents`, or hand-edited a generated tree).
// Layer 3 (idempotence): generating twice yields identical output (determinism).
//
// Pure/offline. Exported for tests/check.mjs; also runnable standalone.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../tools/lib.mjs';
import { generateTool } from '../tools/generate.mjs';

function listTools() {
  return fs.readdirSync(path.join(ROOT, 'adapters'))
    .filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
}

// A tool tree is "committed" if at least one of its expected output files exists.
function treePresent(written) {
  return Object.keys(written).some((rel) => fs.existsSync(path.join(ROOT, rel)));
}

// Compare a freshly generated tree (in a temp dir) against the live/committed files.
export function checkTool(tool) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `ta-nrg-${tool}-`));
  try {
    const written = generateTool(tool, tmp);
    if (!treePresent(written)) return { skipped: true, reason: `no committed ${tool} tree` };
    const mismatches = [];
    for (const rel of Object.keys(written)) {
      const live = path.join(ROOT, rel);
      if (!fs.existsSync(live)) { mismatches.push(`${rel} (not committed)`); continue; }
      const a = fs.readFileSync(live);
      const b = fs.readFileSync(path.join(tmp, rel));
      if (!a.equals(b)) {
        const len = Math.min(a.length, b.length); let i = 0;
        while (i < len && a[i] === b[i]) i++;
        mismatches.push(`${rel} (differs at byte ${i}; committed ${a.length}B vs gen ${b.length}B)`);
      }
    }
    const n = Object.keys(written).length;
    return {
      ok: mismatches.length === 0,
      reason: mismatches.length === 0
        ? `all ${n} generated ${tool} files match the committed tree`
        : `mismatches: ${mismatches.join('; ')}`,
    };
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
}

// Generate twice; assert byte-identical output (deterministic generator).
export function idempotent(tool) {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), `ta-idem-a-${tool}-`));
  const b = fs.mkdtempSync(path.join(os.tmpdir(), `ta-idem-b-${tool}-`));
  try {
    const wa = generateTool(tool, a);
    const wb = generateTool(tool, b);
    for (const rel of Object.keys(wa)) {
      if (wa[rel] !== wb[rel]) return { ok: false, reason: `${tool}: ${rel} differs between runs` };
    }
    return { ok: true, reason: `${tool}: two runs identical (${Object.keys(wa).length} files)` };
  } finally {
    try { fs.rmSync(a, { recursive: true, force: true }); fs.rmSync(b, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
}

// Back-compat: claude-only check used by earlier wiring.
export function check() { return checkTool('claude'); }

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  let bad = 0;
  for (const t of listTools()) {
    const r = checkTool(t);
    if (r.skipped) { console.log(`SKIP  no-regression(${t})  ${r.reason}`); continue; }
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  no-regression(${t})  ${r.reason}`);
    if (!r.ok) bad++;
    const i = idempotent(t);
    console.log(`${i.ok ? 'PASS' : 'FAIL'}  idempotent(${t})  ${i.reason}`);
    if (!i.ok) bad++;
  }
  process.exit(bad ? 1 : 0);
}
