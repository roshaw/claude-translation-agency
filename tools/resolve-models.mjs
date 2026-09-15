#!/usr/bin/env node
// Dynamic model resolution (seam 5). Instead of hardcoding model IDs per tool,
// discover the tool's ACTUALLY-AVAILABLE models and write the operator's tier
// choices into tiers.json. Kept separate from the deterministic generator (like
// translate-init is separate from translate), so a build stays headless.
//
// Usage:
//   node tools/resolve-models.mjs <tool>                 # LIST available models
//   node tools/resolve-models.mjs <tool> --cmd "<c>"     #   ...from a custom discovery command
//   node tools/resolve-models.mjs <tool> --file <path>   #   ...from a file (one id per line)
//   node tools/resolve-models.mjs <tool> strong=<id> mid=<id> cheap=<id>   # SET tiers.json
//   node tools/resolve-models.mjs --check                # print current tiers.json mapping + gaps

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, readJson } from './lib.mjs';

const TIERS = ['strong', 'mid', 'cheap'];
const TIERS_PATH = path.join(ROOT, 'tiers.json');

// A tool may declare how to list its models in its adapter (`modelsCommand`).
function adapterModelsCommand(tool) {
  try { return readJson(`adapters/${tool}.json`).modelsCommand || null; } catch { return null; }
}

// Extract candidate model ids from arbitrary list output: trimmed, whitespace-free,
// looks like an id (letters/digits and ./-/_/: or a provider "/" separator).
export function parseModelList(text) {
  return text.split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-*\d.)\]\s]+/, '').trim())
    .filter((l) => l && /^[A-Za-z0-9][A-Za-z0-9._:\/-]*$/.test(l) && !/\s/.test(l));
}

export function discover(tool, { cmd, file } = {}) {
  if (file) return parseModelList(fs.readFileSync(file, 'utf8'));
  const command = cmd || adapterModelsCommand(tool);
  if (!command) return { error: `no discovery command for "${tool}" — pass --cmd "<command>" or --file <path>, or list manually` };
  try {
    const out = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return parseModelList(out);
  } catch (e) {
    return { error: `discovery command failed (${command}): ${e.message.split('\n')[0]}` };
  }
}

export function setTiers(tool, assignments) {
  const data = readJson('tiers.json');
  for (const [tier, id] of Object.entries(assignments)) {
    if (!TIERS.includes(tier)) throw new Error(`unknown tier "${tier}" (use ${TIERS.join('/')})`);
    if (!id || !id.trim()) throw new Error(`empty model id for tier "${tier}"`);
    if (!data.tiers[tier]) throw new Error(`tiers.json has no tier "${tier}"`);
    data.tiers[tier][tool] = id.trim();
  }
  fs.writeFileSync(TIERS_PATH, JSON.stringify(data, null, 2) + '\n');
  return data;
}

// Mark every tier for a tool UNRESOLVED (null) — the generated agents then omit
// `model:` and inherit the tool's configured default.
export function clearTiers(tool) {
  const data = readJson('tiers.json');
  for (const tier of TIERS) if (data.tiers[tier]) data.tiers[tier][tool] = null;
  fs.writeFileSync(TIERS_PATH, JSON.stringify(data, null, 2) + '\n');
  return data;
}

function checkAll() {
  const data = readJson('tiers.json');
  const tools = new Set();
  for (const t of TIERS) for (const k of Object.keys(data.tiers[t] || {})) tools.add(k);
  const rows = [];
  for (const tool of [...tools].sort()) {
    for (const tier of TIERS) {
      const v = data.tiers[tier] && data.tiers[tier][tool];
      rows.push([tool, tier, v || '(EMPTY)']);
    }
  }
  return rows;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2);
  if (argv.includes('--check')) {
    console.log('tool      tier    model');
    for (const [tool, tier, v] of checkAll()) console.log(`${tool.padEnd(9)} ${tier.padEnd(6)} ${v}`);
    process.exit(0);
  }
  const tool = argv.find((a) => !a.startsWith('--') && !a.includes('='));
  if (!tool) { console.error('usage: resolve-models.mjs <tool> [strong=id mid=id cheap=id] [--clear] [--cmd "..."] [--file path] | --check'); process.exit(1); }
  if (argv.includes('--clear')) {
    clearTiers(tool);
    console.log(`tiers.json: cleared ${tool} (all tiers unresolved -> agents inherit the tool's default model)`);
    process.exit(0);
  }
  const cmd = (() => { const i = argv.indexOf('--cmd'); return i >= 0 ? argv[i + 1] : undefined; })();
  const file = (() => { const i = argv.indexOf('--file'); return i >= 0 ? argv[i + 1] : undefined; })();
  const assignments = {};
  for (const a of argv) { const m = a.match(/^(strong|mid|cheap)=(.+)$/); if (m) assignments[m[1]] = m[2]; }

  if (Object.keys(assignments).length) {
    setTiers(tool, assignments);
    console.log(`tiers.json updated for ${tool}:`);
    for (const [t, id] of Object.entries(assignments)) console.log(`  ${t} -> ${id}`);
  } else {
    const models = discover(tool, { cmd, file });
    if (models.error) { console.error(models.error); process.exit(2); }
    console.log(`Available models for ${tool} (${models.length}):`);
    for (const m of models) console.log(`  ${m}`);
    console.log(`\nAssign tiers with:\n  node tools/resolve-models.mjs ${tool} strong=<id> mid=<id> cheap=<id>`);
  }
}
