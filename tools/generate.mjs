#!/usr/bin/env node
// Generator: emit a tool's agent/skill tree from src/ (bodies + meta) + the tool's
// adapter + tiers.json. Usage: node tools/generate.mjs <tool> [<tool> ...]
// (default: every adapter in adapters/). Writes into the adapter's paths.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { UNITS, ROOT, read, readJson, writeFile, tiers, adapter, srcBodyPath, srcMetaPath, outPath } from './lib.mjs';

export function renderFrontmatter(ad, meta) {
  const fmSpec = ad.frontmatter;
  if (fmSpec.syntax !== 'yaml') {
    throw new Error(`frontmatter syntax "${fmSpec.syntax}" not supported yet (tool ${ad.tool})`);
  }
  const fields = meta.kind === 'agent' ? fmSpec.agentFields : fmSpec.skillFields;
  const T = tiers();
  const lines = ['---'];
  for (const f of fields) {
    if (f === 'name') lines.push(`name: ${meta.name}`);
    else if (f === 'description') lines.push(`description: ${meta.description}`);
    else if (f === 'tools') lines.push(`tools: ${meta.tools.join(fmSpec.toolsSeparator)}`);
    else if (f === 'model') lines.push(`model: ${T.tiers[meta.tier][ad.tool]}`);
    else throw new Error(`unknown frontmatter field "${f}"`);
  }
  lines.push('---');
  return lines.join('\n') + '\n';
}

// Generate a tool's tree. destRoot defaults to the repo root (writes the live
// .claude/ etc.); pass a temp dir for the Layer-1 round-trip test. Returns the
// map { relPath: content } that was written, so callers can compare in memory.
export function generateTool(tool, destRoot = ROOT) {
  const ad = adapter(tool);
  const written = {};
  for (const u of UNITS) {
    const meta = readJson(srcMetaPath(u));
    const body = read(srcBodyPath(u));
    const rel = outPath(ad, u);
    const content = renderFrontmatter(ad, meta) + body;
    const abs = path.join(destRoot, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
    written[rel] = content;
  }
  return written;
}

function listAdapters() {
  return fs.readdirSync(path.join(ROOT, 'adapters'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

// CLI entry (skip when imported by the Layer-1 test).
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const tools = process.argv.slice(2);
  const targets = tools.length ? tools : listAdapters();
  for (const t of targets) {
    const written = generateTool(t);
    console.log(`generated ${Object.keys(written).length} units -> ${t}`);
  }
}
