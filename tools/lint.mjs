#!/usr/bin/env node
// Layer 2 — per-tool structural lint. For a tool's COMMITTED tree, assert it is
// well-formed in that tool's schema: frontmatter parses, required fields present,
// every model resolves via tiers.json, every tool name is one the tool provides,
// every spawn reference names an agent that exists, and every entry point exists.
// Pure/offline. Exported for tests/check.mjs; also runnable standalone.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { UNITS, ROOT, readJson, tiers, adapter, srcMetaPath, outPath } from './lib.mjs';

// Required frontmatter keys per `${flavor}-${kind}`.
const REQUIRED = {
  'claude-agent': ['name', 'description', 'tools', 'model'],
  'claude-skill': ['name', 'description'],
  'opencode-agent': ['description', 'mode', 'model', 'tools', 'permission'],
  'opencode-skill': ['description'],
  'copilot-agent': ['name', 'description', 'model', 'tools'],
  'copilot-skill': ['name', 'description', 'tools'],
  'codex-agent': ['name', 'description', 'model', 'sandbox_mode'],
  'codex-skill': ['name', 'description', 'sandbox_mode'],
};

const AGENT_NAMES = new Set(UNITS.filter((u) => u.kind === 'agent').map((u) => u.name));

// Split a frontmatter fence (--- for YAML, +++ for TOML); return { block, body, fence }.
function splitFm(text) {
  const fence = text.startsWith('---\n') ? '---' : text.startsWith('+++\n') ? '+++' : null;
  if (!fence) return null;
  const close = text.indexOf(`\n${fence}\n`, fence.length);
  if (close === -1) return null;
  return { fence, block: text.slice(fence.length + 1, close), body: text.slice(close + fence.length + 2) };
}

// Top-level keys and (YAML only) indented child keys of map fields.
// YAML uses `key:`; TOML uses `key = value`.
function fmKeys(block, fence) {
  const top = new Set();
  const children = {}; // parentKey -> Set(childKey)
  if (fence === '+++') {
    for (const line of block.split('\n')) {
      const t = line.match(/^([A-Za-z0-9_-]+)\s*=/);
      if (t) top.add(t[1]);
    }
    return { top, children };
  }
  let parent = null;
  for (const line of block.split('\n')) {
    const t = line.match(/^([A-Za-z0-9_-]+):(.*)$/);
    if (t) { top.add(t[1]); parent = t[2].trim() === '' ? t[1] : null; continue; }
    const c = line.match(/^\s+([A-Za-z0-9_-]+):/);
    if (c && parent) { (children[parent] ||= new Set()).add(c[1]); }
    else if (line.trim() !== '') parent = null;
  }
  return { top, children };
}

export function lintTool(tool) {
  const ad = adapter(tool);
  const T = tiers();
  const flavor = ad.frontmatter.flavor;
  const issues = [];

  for (const u of UNITS) {
    const rel = outPath(ad, u);
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) { issues.push(`${rel}: missing (entry point not emitted)`); continue; }
    const text = fs.readFileSync(abs, 'utf8');
    const fm = splitFm(text);
    if (!fm) { issues.push(`${rel}: unparseable frontmatter`); continue; }
    const { top, children } = fmKeys(fm.block, fm.fence);

    // required fields
    const req = REQUIRED[`${flavor}-${u.kind}`] || [];
    for (const k of req) if (!top.has(k)) issues.push(`${rel}: missing required frontmatter key "${k}"`);

    // model resolves via tiers.json (agents only)
    if (u.kind === 'agent') {
      const meta = readJson(srcMetaPath(u));
      const expected = T.tiers[meta.tier] && T.tiers[meta.tier][tool];
      const modelLine = fm.fence === '+++' ? `model = "${expected}"` : `model: ${expected}`;
      if (!expected) issues.push(`${rel}: tier "${meta.tier}" has no model for ${tool}`);
      else if (!fm.block.includes(modelLine)) {
        issues.push(`${rel}: model line does not match tiers.json (${meta.tier} -> ${expected})`);
      }
    }

    // tool-name validity: opencode tools-map keys must be real tools
    if (flavor === 'opencode' && u.kind === 'agent' && ad.allTools) {
      const declared = children.tools || new Set();
      for (const t of declared) if (!ad.allTools.includes(t)) issues.push(`${rel}: unknown tool "${t}" in tools map`);
    }

    // spawn references: any subagent/subagent_type: "X" must be a known agent
    for (const m of fm.body.matchAll(/subagent(?:_type)?:\s*"([^"]+)"/g)) {
      const name = m[1];
      // allow the piped placeholder form: "translate-junior" | "translate-senior"
      const names = name.split('|').map((s) => s.trim().replace(/"/g, ''));
      for (const n of names) if (n && !AGENT_NAMES.has(n)) issues.push(`${rel}: spawn references unknown agent "${n}"`);
    }
  }

  return { ok: issues.length === 0, issues };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const tools = process.argv.slice(2);
  const targets = tools.length ? tools : fs.readdirSync(path.join(ROOT, 'adapters'))
    .filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  let bad = 0;
  for (const t of targets) {
    const { ok, issues } = lintTool(t);
    console.log(`${ok ? 'PASS' : 'FAIL'}  lint(${t})  ${ok ? 'well-formed' : issues.join('; ')}`);
    if (!ok) bad++;
  }
  process.exit(bad ? 1 : 0);
}
