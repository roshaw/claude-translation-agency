#!/usr/bin/env node
// Deterministic assertion harness for the Tier-2 behavioral eval.
//
//   node tests/eval-assert.mjs <target.json> <source.json> [glossary.csv] [--formality formal]
//
// Loads a source message catalog and a translated target catalog, then checks the
// post-conditions the translator panel + coverage audit are supposed to guarantee.
// Prints one line per violation and a final "N violations" line; exits 1 if any,
// 0 if clean. Pure Node built-ins — no network, no LLM, no dependencies.
//
// It is ALSO importable: `import { evaluate, parseGlossary, flatten } from './eval-assert.mjs'`.
// The CLI only runs when the file is executed directly (see the guard at the bottom),
// so tests/check.mjs can import evaluate() and self-test the harness offline.
//
// Violation classes (the `class` field):
//   missing-key        — a source key absent from the target            (coverage)
//   empty-value        — a target key present but "" / whitespace       (coverage)
//   missing-in-source  — a target key with no matching source key       (coverage; source gap)
//   leftover           — target value byte-identical to source (C1)
//   placeholder        — a {token}/%s present in source, gone in target (C4)
//   wrong-term         — glossary source term in source, target term absent (C2)
//   formality          — informal German marker where formal required   (C6)

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// --- helpers ---------------------------------------------------------------

// Flatten a nested object into a { "a.b.c": leafValue } map. Arrays are treated
// as leaves (message catalogs don't nest arrays of strings here).
export function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

// {token}, {{token}}, and printf-style %s / %d / %1$s placeholders.
const PLACEHOLDER_RE = /\{\{[^{}]+\}\}|\{[^{}]+\}|%\d*\$?[sd]/g;
function placeholders(s) {
  return typeof s === 'string' ? (s.match(PLACEHOLDER_RE) || []) : [];
}

// Informal German second-person markers, matched as whole words, case-insensitive.
// Deliberately small and word-boundary-anchored so formal copy ("Ihre", "Sie") is safe.
const INFORMAL_DE = ['du', 'dich', 'dir', 'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines'];
const INFORMAL_DE_RE = new RegExp(`\\b(?:${INFORMAL_DE.join('|')})\\b`, 'i');

const latinLetters = (s) => (String(s).match(/[A-Za-z]/g) || []).length;

// Minimal CSV parser (handles double-quoted fields with embedded commas/quotes).
function parseCsvLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Parse a glossary CSV (header: source,lang,term,...) into [{source, lang, term}].
export function parseGlossary(csvText) {
  const lines = String(csvText).split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const si = header.indexOf('source');
  const li = header.indexOf('lang');
  const ti = header.indexOf('term');
  if (si === -1 || ti === -1) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const source = cols[si], term = cols[ti], lang = li === -1 ? '' : cols[li];
    if (source && term) rows.push({ source, term, lang });
  }
  return rows;
}

// --- the check ------------------------------------------------------------

// evaluate({ target, source, glossary, formality, exempt }) -> [{ class, key, reason }]
export function evaluate({ target, source, glossary = [], formality = null, exempt = [] }) {
  const violations = [];
  const src = flatten(source);
  const tgt = flatten(target);
  const exemptSet = new Set(exempt);

  // COVERAGE — every source key present and non-empty in the target.
  for (const key of Object.keys(src)) {
    if (!(key in tgt)) {
      violations.push({ class: 'missing-key', key, reason: 'present in source, missing from target' });
    } else if (typeof tgt[key] === 'string' && tgt[key].trim() === '') {
      violations.push({ class: 'empty-value', key, reason: 'target value is empty' });
    }
  }
  // COVERAGE — target keys with no source key (source gap the translator can't auto-fill).
  for (const key of Object.keys(tgt)) {
    if (!(key in src)) {
      violations.push({ class: 'missing-in-source', key, reason: 'present in target but not in source (source gap)' });
    }
  }

  // Per-key content checks — only where both sides are present, non-empty strings.
  for (const key of Object.keys(src)) {
    const s = src[key];
    const t = tgt[key];
    if (typeof s !== 'string' || typeof t !== 'string') continue;
    if (t.trim() === '') continue;           // already flagged as empty-value
    if (exemptSet.has(s)) continue;          // verbatim / pass-through value

    // LEFTOVER (C1) — target identical to source, only meaningful for real prose.
    if (s === t && latinLetters(s) >= 3) {
      violations.push({ class: 'leftover', key, reason: `target byte-identical to source ("${s}")` });
    }

    // PLACEHOLDER (C4) — every source placeholder must survive in the target.
    for (const ph of placeholders(s)) {
      if (!t.includes(ph)) {
        violations.push({ class: 'placeholder', key, reason: `placeholder ${ph} missing from target` });
      }
    }

    // WRONG TERM (C2) — where the source uses a glossary source term, the target
    // must contain the glossary target term (case-insensitive substring).
    for (const g of glossary) {
      if (s.toLowerCase().includes(g.source.toLowerCase()) &&
          !t.toLowerCase().includes(g.term.toLowerCase())) {
        violations.push({ class: 'wrong-term', key, reason: `expected glossary term "${g.term}" for "${g.source}", not found` });
      }
    }

    // FORMALITY (C6) — when formal register is required, reject informal markers.
    if (formality === 'formal') {
      const m = t.match(INFORMAL_DE_RE);
      if (m) violations.push({ class: 'formality', key, reason: `informal marker "${m[0]}" where formal register required` });
    }
  }

  return violations;
}

// --- CLI -------------------------------------------------------------------

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function main(argv) {
  const args = argv.slice(2);
  const positional = [];
  let formality = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--formality') formality = args[++i] ?? null;
    else positional.push(args[i]);
  }
  const [targetPath, sourcePath, glossaryPath] = positional;
  if (!targetPath || !sourcePath) {
    console.error('usage: node tests/eval-assert.mjs <target.json> <source.json> [glossary.csv] [--formality formal]');
    process.exit(2);
  }
  const target = loadJson(targetPath);
  const source = loadJson(sourcePath);
  const glossary = glossaryPath ? parseGlossary(fs.readFileSync(glossaryPath, 'utf8')) : [];
  const violations = evaluate({ target, source, glossary, formality });

  for (const v of violations) console.log(`  [${v.class}] ${v.key}: ${v.reason}`);
  console.log(`${violations.length} violations`);
  process.exit(violations.length ? 1 : 0);
}

// Run the CLI only when executed directly, not when imported by check.mjs.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv);
}
