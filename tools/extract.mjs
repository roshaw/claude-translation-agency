#!/usr/bin/env node
// One-time (re-runnable) extractor: derive the tool-agnostic src/ tree from the
// authored .claude/ tree. Body is copied byte-for-byte; frontmatter is reduced to
// neutral metadata (model -> tier). Running this then `generate.mjs claude` must
// reproduce .claude/ exactly (Layer 1). Re-run whenever .claude/ is the thing edited.

import { UNITS, read, writeFile, split, modelToTier, srcBodyPath, srcMetaPath } from './lib.mjs';

let n = 0;
for (const u of UNITS) {
  const rel = u.kind === 'agent'
    ? `.claude/agents/${u.name}.md`
    : `.claude/skills/${u.name}/SKILL.md`;
  const { fm, body } = split(read(rel));

  const meta = { kind: u.kind, name: fm.name, description: fm.description };
  if (u.kind === 'agent') {
    meta.tier = modelToTier(fm.model);
    meta.tools = fm.tools.split(', ');
  }

  writeFile(srcBodyPath(u), body);
  writeFile(srcMetaPath(u), JSON.stringify(meta, null, 2) + '\n');
  n++;
}
console.log(`extracted ${n} units -> src/`);
