#!/usr/bin/env node
// Generator: emit a tool's agent/skill tree from src/ (bodies + meta) + the tool's
// adapter + tiers.json. Usage: node tools/generate.mjs <tool> [<tool> ...]
// (default: every adapter in adapters/). Writes into the adapter's paths.
//
// Design: the src/ body is authored in the "Claude dialect" and treated as the
// canonical interlingua. Each adapter carries (a) a frontmatter spec and (b) an
// ORDERED list of literal body substitutions (the six seams). The Claude adapter's
// substitution list is empty, so its output is byte-identical to the authored
// .claude/ tree (Layer 1). Substitutions are literal string replacements applied
// in order (longest/most-specific first).

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { UNITS, ROOT, read, readJson, tiers, adapter, srcBodyPath, srcMetaPath, outPath } from './lib.mjs';

// --- frontmatter renderers, keyed by adapter.frontmatter.flavor ------------

function yamlEscapeInline(s) {
  // These descriptions are plain one-liners with no YAML metacharacters that
  // require quoting in the source tool; keep them verbatim (matches .claude).
  return s;
}

const RENDERERS = {
  // Claude Code — the round-trip baseline. Must reproduce .claude/ exactly.
  'claude-agent'(meta, ad, T) {
    return [
      '---',
      `name: ${meta.name}`,
      `description: ${meta.description}`,
      `tools: ${meta.tools.join(ad.frontmatter.toolsSeparator)}`,
      `model: ${T.tiers[meta.tier].claude}`,
      '---',
    ].join('\n') + '\n';
  },
  'claude-skill'(meta) {
    return ['---', `name: ${meta.name}`, `description: ${meta.description}`, '---'].join('\n') + '\n';
  },

  // OpenCode — YAML frontmatter; agents are subagents, skills are /commands.
  'opencode-agent'(meta, ad, T) {
    const model = T.tiers[meta.tier].opencode;
    const granted = new Set(
      meta.tools.map((t) => ad.toolNames[t]).filter((n) => n) // drop tools with no OpenCode equivalent
    );
    const lines = ['---', `description: ${yamlEscapeInline(meta.description)}`, 'mode: subagent', `model: ${model}`];
    // tools map: enable granted, disable the rest of the known tool set (real restriction).
    lines.push('tools:');
    for (const t of ad.allTools) lines.push(`  ${t}: ${granted.has(t)}`);
    // permission map for the configurable tools (fixed per tool family).
    lines.push('permission:');
    for (const [p, mode] of Object.entries(ad.permissions || {})) lines.push(`  ${p}: ${mode}`);
    lines.push('---');
    return lines.join('\n') + '\n';
  },
  // OpenCode skills become /commands (.opencode/commands/<name>.md).
  'opencode-skill'(meta) {
    return ['---', `description: ${yamlEscapeInline(meta.description)}`, '---'].join('\n') + '\n';
  },
};

export function renderFrontmatter(ad, meta) {
  const flavor = `${ad.frontmatter.flavor}-${meta.kind}`;
  const fn = RENDERERS[flavor];
  if (!fn) throw new Error(`no renderer for flavor "${flavor}" (tool ${ad.tool})`);
  return fn(meta, ad, tiers());
}

export function applyBodySubs(body, ad) {
  let out = body;
  for (const [from, to] of ad.body || []) {
    out = out.split(from).join(to);
  }
  return out;
}

// Generate a tool's tree. destRoot defaults to the repo root; pass a temp dir for
// the Layer-1 round-trip test. Returns { relPath: content } written.
export function generateTool(tool, destRoot = ROOT) {
  const ad = adapter(tool);
  const written = {};
  for (const u of UNITS) {
    const meta = readJson(srcMetaPath(u));
    const body = applyBodySubs(read(srcBodyPath(u)), ad);
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

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const tools = process.argv.slice(2);
  const targets = tools.length ? tools : listAdapters();
  for (const t of targets) {
    const written = generateTool(t);
    console.log(`generated ${Object.keys(written).length} units -> ${t}`);
  }
}
