// Shared helpers for the porting toolchain (extract / generate / lint).
// Pure Node built-ins. No deps.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The authored surface, as an explicit manifest (no globbing surprises).
export const UNITS = [
  { kind: 'agent', name: 'translate-lead' },
  { kind: 'agent', name: 'translate-senior' },
  { kind: 'agent', name: 'translate-junior' },
  { kind: 'agent', name: 'translate-researcher' },
  { kind: 'skill', name: 'translate' },
  { kind: 'skill', name: 'translate-init' },
  { kind: 'skill', name: 'translate-add-locale' },
  { kind: 'skill', name: 'translate-audit' },
];

export const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
export const readJson = (rel) => JSON.parse(read(rel));
export const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

export function writeFile(rel, content) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

export const tiers = () => readJson('tiers.json');
export const adapter = (tool) => readJson(`adapters/${tool}.json`);

// invert the claude model column -> tier (opus->strong, sonnet->mid, haiku->cheap)
export function modelToTier(model) {
  const t = tiers().tiers;
  for (const [tier, byTool] of Object.entries(t)) {
    if (byTool.claude === model) return tier;
  }
  throw new Error(`no tier maps to claude model "${model}"`);
}

// Split a .claude source file into { frontmatter: {ordered fields}, body }.
// Frontmatter is the leading ---\n...\n---\n block; body is everything after it
// (including the blank line that follows the closing ---), byte-for-byte.
export function split(text) {
  if (!text.startsWith('---\n')) throw new Error('no frontmatter');
  const closing = text.indexOf('\n---\n', 3);
  if (closing === -1) throw new Error('unterminated frontmatter');
  const block = text.slice(4, closing); // between the opening ---\n and closing \n---\n
  const body = text.slice(closing + 5); // after \n---\n
  const fm = {};
  const order = [];
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (!m) throw new Error(`unparseable frontmatter line: ${JSON.stringify(line)}`);
    fm[m[1]] = m[2];
    order.push(m[1]);
  }
  return { fm, order, body };
}

// Paths in the src tree.
export const srcBodyPath = (u) =>
  u.kind === 'agent' ? `src/agents/${u.name}.md` : `src/skills/${u.name}/SKILL.md`;
export const srcMetaPath = (u) =>
  u.kind === 'agent' ? `src/agents/${u.name}.meta.json` : `src/skills/${u.name}/SKILL.meta.json`;

// Render an output path for a unit under a given adapter.
export function outPath(ad, u) {
  return ad.paths[u.kind].replace('{name}', u.name);
}
