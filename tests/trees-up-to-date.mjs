#!/usr/bin/env node
// test: generated trees up to date
//
// Asserts that every generated per-tool tree (.opencode/, .codex/, .github/) is
// byte-for-byte what the generator produces from the current .claude/ — i.e. no
// one edited .claude/ (or a generated file) without running `npm run build:agents`.
// This is the "clean fix" that guards against stale generated trees; the pre-push
// hook runs it, and it also runs inside `npm test`.
//
// Runnable standalone: `node tests/trees-up-to-date.mjs` (exit 1 on any drift).

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../tools/lib.mjs';
import { checkTool } from './no-regression.mjs';

const SOURCE_TOOL = 'claude'; // the authored source, not a generated tree

// The generated tools that have a committed tree.
export function generatedTools() {
  return fs.readdirSync(path.join(ROOT, 'adapters'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .filter((t) => t !== SOURCE_TOOL);
}

// Returns { ok, results: [{tool, ok, reason, skipped}] }.
export function treesUpToDate() {
  const results = generatedTools().map((tool) => ({ tool, ...checkTool(tool) }));
  const ok = results.every((r) => r.ok || r.skipped);
  return { ok, results };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { ok, results } = treesUpToDate();
  for (const r of results) {
    const status = r.skipped ? 'SKIP' : r.ok ? 'PASS' : 'FAIL';
    console.log(`${status}  generated tree up to date (${r.tool})  ${r.reason}`);
  }
  console.log(ok ? '\nAll generated trees are up to date with .claude/.'
                 : '\nStale generated tree(s) — run `npm run build:agents` and commit.');
  process.exit(ok ? 0 : 1);
}
