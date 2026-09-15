#!/usr/bin/env node
// Layer 1 — golden regression. Proves the generator reproduces the authored
// .claude/ tree BYTE-FOR-BYTE from src/ + adapters/claude.json + tiers.json.
// This is the guard that answers "did the refactor break the working tool."
//
// Exports check() so tests/check.mjs can fold it into `npm test`; also runnable
// standalone: `node tests/no-regression.mjs`.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROOT } from '../tools/lib.mjs';
import { generateTool } from '../tools/generate.mjs';

// Compare generated claude output (to a temp dir) against the live .claude tree.
// Returns { ok, reason, details }.
export function check() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ta-nrg-'));
  try {
    const written = generateTool('claude', tmp);
    const mismatches = [];
    for (const rel of Object.keys(written)) {
      const live = path.join(ROOT, rel);
      if (!fs.existsSync(live)) { mismatches.push(`${rel} (no live file to compare)`); continue; }
      const a = fs.readFileSync(live);
      const b = fs.readFileSync(path.join(tmp, rel));
      if (!a.equals(b)) {
        // find first differing byte for a useful message
        const len = Math.min(a.length, b.length);
        let i = 0;
        while (i < len && a[i] === b[i]) i++;
        mismatches.push(`${rel} (differs at byte ${i}; live ${a.length}B vs gen ${b.length}B)`);
      }
    }
    const n = Object.keys(written).length;
    return {
      ok: mismatches.length === 0,
      reason: mismatches.length === 0
        ? `all ${n} generated claude files are byte-identical to .claude/`
        : `mismatches: ${mismatches.join('; ')}`,
    };
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { ok, reason } = check();
  console.log(`${ok ? 'PASS' : 'FAIL'}  NO-REGRESSION  ${reason}`);
  process.exit(ok ? 0 : 1);
}
