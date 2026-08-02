#!/usr/bin/env node
// Deterministic, CI-able invariant checker for the Translation Agency toolkit.
// Pure Node built-ins + ajv (dev). Run with `npm test` (or `npm start`).
//
// Prints PASS/FAIL per check with a one-line reason. HARD failures exit 1;
// SOFT checks print a WARNING and never fail the run.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { evaluate, parseGlossary } from './eval-assert.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---- tiny result harness ---------------------------------------------------
let passed = 0, failed = 0, warnings = 0;
const rows = [];

function record(kind, name, ok, reason) {
  if (kind === 'soft') {
    if (ok) { passed++; rows.push(['PASS', name, reason]); }
    else { warnings++; rows.push(['WARN', name, reason]); }
  } else {
    if (ok) { passed++; rows.push(['PASS', name, reason]); }
    else { failed++; rows.push(['FAIL', name, reason]); }
  }
}
const hard = (name, ok, reason) => record('hard', name, ok, reason);
const soft = (name, ok, reason) => record('soft', name, ok, reason);

// ---- helpers ---------------------------------------------------------------
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function tryRead(rel) {
  try { return read(rel); } catch { return null; }
}

// Parse a leading --- YAML-ish frontmatter block into a flat key->value map.
// Only handles the simple `key: value` lines these files use.
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const block = text.slice(text.indexOf('\n') + 1, end);
  const out = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

// ===========================================================================
// (a) VERSION CONSISTENCY  [HARD]
// ===========================================================================
const version = read('VERSION').trim();
{
  const v = version;
  const vEsc = reEsc(v);
  const spots = [];

  // package.json "version"
  let pkgVer = null;
  try { pkgVer = readJson('package.json').version; } catch { /* handled in (f) */ }
  spots.push(['package.json "version"', pkgVer === v]);

  const claude = read('CLAUDE.md');
  const readme = read('README.md');

  spots.push(['CLAUDE.md header "**Version X.Y.Z**"', claude.includes(`**Version ${v}**`)]);
  spots.push(['README.md badge "version-X.Y.Z-blue"', readme.includes(`version-${v}-blue`)]);
  spots.push(['README.md "Current version: **X.Y.Z**"', readme.includes(`Current version: **${v}**`)]);

  const treeRe = new RegExp(`VERSION\\s+#\\s*${vEsc}`);
  spots.push(['CLAUDE.md VERSION tree comment', treeRe.test(claude)]);
  spots.push(['README.md VERSION tree comment', treeRe.test(readme)]);

  const bad = spots.filter(([, ok]) => !ok).map(([n]) => n);
  hard(
    `VERSION CONSISTENCY (${v})`,
    bad.length === 0,
    bad.length === 0
      ? `all ${spots.length} version spots match VERSION`
      : `mismatch in: ${bad.join('; ')}`
  );
}

// ===========================================================================
// (b) CHANGELOG  [HARD]
// ===========================================================================
{
  const cl = read('CHANGELOG.md');
  const vEsc = reEsc(version);
  const heading = new RegExp(`^## \\[${vEsc}\\] — \\d{4}-\\d{2}-\\d{2}$`, 'm');
  const link = new RegExp(`^\\[${vEsc}\\]:`, 'm');
  const hasHeading = heading.test(cl);
  const hasLink = link.test(cl);
  hard(
    `CHANGELOG (${version})`,
    hasHeading && hasLink,
    hasHeading && hasLink
      ? `dated "## [${version}] — <date>" heading and "[${version}]:" compare-link both present`
      : `missing ${[!hasHeading && 'dated heading', !hasLink && 'compare-link'].filter(Boolean).join(' + ')}`
  );
}

// ===========================================================================
// (c) SCHEMA HEALTH  [HARD]
// ===========================================================================
{
  let ajv = null, validate = null, schemaOk = false, reason = '';
  try {
    const schema = readJson('translation.config.schema.json');
    ajv = new Ajv2020({ allErrors: true, strict: false });
    validate = ajv.compile(schema);
    schemaOk = true;
  } catch (e) {
    reason = `schema failed to parse/compile: ${e.message}`;
  }
  hard('SCHEMA compiles', schemaOk, schemaOk ? 'translation.config.schema.json compiles under ajv (draft 2020-12)' : reason);

  if (schemaOk) {
    // template config must validate
    let cfgOk = false, cfgReason = '';
    try {
      const cfg = readJson('translation.config.json');
      cfgOk = validate(cfg);
      cfgReason = cfgOk ? 'translation.config.json validates against the schema' : `errors: ${ajv.errorsText(validate.errors)}`;
    } catch (e) {
      cfgReason = `translation.config.json unreadable: ${e.message}`;
    }
    hard('SCHEMA validates template config', cfgOk, cfgReason);

    // the eval-fixture's config must also validate (proves the fixture is well-formed)
    let fxOk = false, fxReason = '';
    const fxRel = 'examples/eval-fixture/translation.config.json';
    try {
      fxOk = validate(readJson(fxRel));
      fxReason = fxOk ? `${fxRel} validates against the schema` : `errors: ${ajv.errorsText(validate.errors)}`;
    } catch (e) {
      fxReason = `${fxRel} unreadable: ${e.message}`;
    }
    hard('SCHEMA validates eval-fixture config', fxOk, fxReason);

    // fixtures/valid/* must all validate
    const validDir = 'tests/fixtures/valid';
    const validFiles = fs.readdirSync(path.join(ROOT, validDir)).filter((f) => f.endsWith('.json')).sort();
    const validBad = [];
    for (const f of validFiles) {
      try {
        const ok = validate(readJson(`${validDir}/${f}`));
        if (!ok) validBad.push(`${f} (${ajv.errorsText(validate.errors)})`);
      } catch (e) {
        validBad.push(`${f} (unreadable: ${e.message})`);
      }
    }
    hard(
      `SCHEMA valid fixtures (${validFiles.length})`,
      validBad.length === 0,
      validBad.length === 0 ? `all ${validFiles.length} valid fixtures pass` : `unexpectedly rejected: ${validBad.join('; ')}`
    );

    // fixtures/invalid/* must all FAIL
    const invalidDir = 'tests/fixtures/invalid';
    const invalidFiles = fs.readdirSync(path.join(ROOT, invalidDir)).filter((f) => f.endsWith('.json')).sort();
    const leaked = [];
    for (const f of invalidFiles) {
      try {
        const ok = validate(readJson(`${invalidDir}/${f}`));
        if (ok) leaked.push(f); // validated when it should have been rejected
      } catch (e) {
        leaked.push(`${f} (unreadable: ${e.message})`);
      }
    }
    hard(
      `SCHEMA invalid fixtures rejected (${invalidFiles.length})`,
      leaked.length === 0,
      leaked.length === 0 ? `all ${invalidFiles.length} invalid fixtures correctly rejected` : `unexpectedly PASSED validation: ${leaked.join('; ')}`
    );
  }
}

// ===========================================================================
// (d) CROSS-REFERENCES  [HARD]
// ===========================================================================
{
  const claude = read('CLAUDE.md');
  const readme = read('README.md');

  // specializations/*.md (except README) referenced in BOTH docs
  const specs = fs.readdirSync(path.join(ROOT, 'specializations'))
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .map((f) => f.replace(/\.md$/, ''));
  const specBad = [];
  for (const name of specs) {
    const inC = claude.includes(name);
    const inR = readme.includes(name);
    if (!inC || !inR) specBad.push(`${name} (missing in ${[!inC && 'CLAUDE.md', !inR && 'README.md'].filter(Boolean).join(' & ')})`);
  }
  hard(
    `CROSS-REF specializations (${specs.length})`,
    specBad.length === 0,
    specBad.length === 0 ? `all ${specs.length} specializations referenced in README.md + CLAUDE.md` : specBad.join('; ')
  );

  // .claude/skills/*/ dir name in CLAUDE.md + contains SKILL.md
  const skillsRoot = path.join(ROOT, '.claude', 'skills');
  const skillDirs = fs.readdirSync(skillsRoot).filter((d) => fs.statSync(path.join(skillsRoot, d)).isDirectory());
  const skillBad = [];
  for (const d of skillDirs) {
    if (!claude.includes(d)) skillBad.push(`${d} (not named in CLAUDE.md)`);
    if (!fs.existsSync(path.join(skillsRoot, d, 'SKILL.md'))) skillBad.push(`${d} (no SKILL.md)`);
  }
  hard(
    `CROSS-REF skills (${skillDirs.length})`,
    skillBad.length === 0,
    skillBad.length === 0 ? `all ${skillDirs.length} skill dirs named in CLAUDE.md and have SKILL.md` : skillBad.join('; ')
  );

  // .claude/agents/*.md name: frontmatter in CLAUDE.md
  const agentsRoot = path.join(ROOT, '.claude', 'agents');
  const agentFiles = fs.readdirSync(agentsRoot).filter((f) => f.endsWith('.md'));
  const agentBad = [];
  for (const f of agentFiles) {
    const fm = parseFrontmatter(fs.readFileSync(path.join(agentsRoot, f), 'utf8'));
    const name = fm && fm.name;
    if (!name) agentBad.push(`${f} (no name: frontmatter)`);
    else if (!claude.includes(name)) agentBad.push(`${name} (not named in CLAUDE.md)`);
  }
  hard(
    `CROSS-REF agents (${agentFiles.length})`,
    agentBad.length === 0,
    agentBad.length === 0 ? `all ${agentFiles.length} agent names referenced in CLAUDE.md` : agentBad.join('; ')
  );
}

// ===========================================================================
// (e) FRONTMATTER LINT  [HARD]
// ===========================================================================
{
  // skills: name + description
  const skillsRoot = path.join(ROOT, '.claude', 'skills');
  const skillDirs = fs.readdirSync(skillsRoot).filter((d) => fs.statSync(path.join(skillsRoot, d)).isDirectory());
  const skillBad = [];
  for (const d of skillDirs) {
    const p = path.join(skillsRoot, d, 'SKILL.md');
    if (!fs.existsSync(p)) { skillBad.push(`${d} (no SKILL.md)`); continue; }
    const fm = parseFrontmatter(fs.readFileSync(p, 'utf8'));
    if (!fm) { skillBad.push(`${d} (no frontmatter block)`); continue; }
    const miss = ['name', 'description'].filter((k) => !fm[k] || !fm[k].trim());
    if (miss.length) skillBad.push(`${d} (empty/missing: ${miss.join(', ')})`);
  }
  hard(
    `FRONTMATTER skills (${skillDirs.length})`,
    skillBad.length === 0,
    skillBad.length === 0 ? `all ${skillDirs.length} SKILL.md have non-empty name + description` : skillBad.join('; ')
  );

  // agents: name + description + model + tools
  const agentsRoot = path.join(ROOT, '.claude', 'agents');
  const agentFiles = fs.readdirSync(agentsRoot).filter((f) => f.endsWith('.md'));
  const agentBad = [];
  for (const f of agentFiles) {
    const fm = parseFrontmatter(fs.readFileSync(path.join(agentsRoot, f), 'utf8'));
    if (!fm) { agentBad.push(`${f} (no frontmatter block)`); continue; }
    const miss = ['name', 'description', 'model', 'tools'].filter((k) => !fm[k] || !fm[k].trim());
    if (miss.length) agentBad.push(`${f} (empty/missing: ${miss.join(', ')})`);
  }
  hard(
    `FRONTMATTER agents (${agentFiles.length})`,
    agentBad.length === 0,
    agentBad.length === 0 ? `all ${agentFiles.length} agents have non-empty name + description + model + tools` : agentBad.join('; ')
  );
}

// ===========================================================================
// (f) JSON VALIDITY  [HARD]
// ===========================================================================
{
  const targets = ['translation.config.json', 'translation.config.schema.json', 'package.json'];
  const bad = [];
  for (const t of targets) {
    try { readJson(t); } catch (e) { bad.push(`${t} (${e.message})`); }
  }
  hard(
    'JSON VALIDITY',
    bad.length === 0,
    bad.length === 0 ? `${targets.join(', ')} all parse as JSON` : `parse errors: ${bad.join('; ')}`
  );
}

// ===========================================================================
// (g) EVAL HARNESS SELF-TEST  [HARD]
// ===========================================================================
// Proves the Tier-2 behavioral assertion script (tests/eval-assert.mjs) actually
// bites — deterministically, with no LLM. The known-good target must report ZERO
// violations; the deliberately-defective target must report violations covering
// EVERY planted class. If either drifts, the eval harness itself is broken.
{
  const FX = 'examples/eval-fixture';
  const PLANTED = ['missing-key', 'empty-value', 'missing-in-source', 'leftover', 'placeholder', 'wrong-term', 'formality'];
  let setupErr = null, source = null, glossary = [];
  try {
    source = readJson(`${FX}/locales/en.json`);
    glossary = parseGlossary(read(`${FX}/glossary.csv`));
  } catch (e) {
    setupErr = e.message;
  }

  if (setupErr) {
    hard('EVAL fixture loads', false, `could not load fixture: ${setupErr}`);
  } else {
    // good target -> 0 violations
    let goodViol = null, goodErr = null;
    try {
      goodViol = evaluate({ target: readJson(`${FX}/expected-good/locales/de.json`), source, glossary, formality: 'formal' });
    } catch (e) { goodErr = e.message; }
    hard(
      'EVAL good target clean',
      !goodErr && goodViol.length === 0,
      goodErr ? `errored: ${goodErr}` :
        goodViol.length === 0 ? 'expected-good/locales/de.json -> 0 violations' :
        `expected 0 violations, got ${goodViol.length}: ${goodViol.map((v) => `${v.class}:${v.key}`).join(', ')}`
    );

    // defective target -> violations covering every planted class
    let badViol = null, badErr = null;
    try {
      badViol = evaluate({ target: readJson(`${FX}/locales/de.json`), source, glossary, formality: 'formal' });
    } catch (e) { badErr = e.message; }
    if (badErr) {
      hard('EVAL bad target caught', false, `errored: ${badErr}`);
    } else {
      const seen = new Set(badViol.map((v) => v.class));
      const missed = PLANTED.filter((c) => !seen.has(c));
      hard(
        'EVAL bad target caught',
        badViol.length > 0 && missed.length === 0,
        missed.length === 0
          ? `defective locales/de.json -> ${badViol.length} violations covering all ${PLANTED.length} planted classes`
          : `undetected planted classes: ${missed.join(', ')}`
      );
    }
  }
}

// ===========================================================================
// (g2) EVAL WRONG-TERM SURFACE FORMS  [HARD]
// ===========================================================================
// The glossary term for de is the German separable verb "anmelden". A correct formal
// rendering splits it ("melden Sie sich an"), which a bare-substring check would wrongly
// flag. These self-tests pin the accepted-forms behavior deterministically: the natural
// separable output is ACCEPTED, the wrong verb ("einloggen") is still REJECTED, and the
// antonym "abmelden" (sign-out) never satisfies "anmelden" (sign-in).
{
  const FX = 'examples/eval-fixture';
  let setupErr = null, source = null, glossary = [];
  try {
    source = readJson(`${FX}/locales/en.json`);
    glossary = parseGlossary(read(`${FX}/glossary.csv`));
  } catch (e) { setupErr = e.message; }

  if (setupErr) {
    hard('EVAL wrong-term fixture loads', false, `could not load fixture: ${setupErr}`);
  } else {
    // (1) separable-verb panel output is ACCEPTED — 0 violations overall.
    let accViol = null, accErr = null;
    try {
      accViol = evaluate({ target: readJson(`${FX}/panel-output/locales/de.json`), source, glossary, formality: 'formal' });
    } catch (e) { accErr = e.message; }
    hard(
      'EVAL wrong-term accepts separable form',
      !accErr && accViol.length === 0,
      accErr ? `errored: ${accErr}` :
        accViol.length === 0 ? 'panel-output/locales/de.json ("melden Sie sich an") -> 0 violations' :
        `expected 0 violations, got ${accViol.length}: ${accViol.map((v) => `${v.class}:${v.key}`).join(', ')}`
    );

    // (2) the wrong verb ("einloggen") in the defective target is still REJECTED.
    let rejViol = null, rejErr = null;
    try {
      rejViol = evaluate({ target: readJson(`${FX}/locales/de.json`), source, glossary, formality: 'formal' });
    } catch (e) { rejErr = e.message; }
    const rejWrong = (rejViol || []).filter((v) => v.class === 'wrong-term' && v.key === 'auth.signInPrompt');
    hard(
      'EVAL wrong-term rejects wrong verb',
      !rejErr && rejWrong.length === 1,
      rejErr ? `errored: ${rejErr}` :
        rejWrong.length === 1 ? 'defective "einloggen" -> wrong-term flag on auth.signInPrompt' :
        `expected 1 wrong-term flag on auth.signInPrompt, got ${rejWrong.length}`
    );

    // (3) "abmelden" (sign-out) must NOT satisfy the "anmelden" (sign-in) glossary term.
    let distinct = null, distinctErr = null;
    try {
      distinct = evaluate({
        target: { auth: { signInPrompt: 'Bitte zum Fortfahren abmelden.' } },
        source: { auth: { signInPrompt: 'Please sign in to continue' } },
        glossary,
      }).filter((v) => v.class === 'wrong-term');
    } catch (e) { distinctErr = e.message; }
    hard(
      'EVAL wrong-term keeps anmelden vs abmelden distinct',
      !distinctErr && distinct.length === 1,
      distinctErr ? `errored: ${distinctErr}` :
        distinct.length === 1 ? '"abmelden" does not satisfy glossary "anmelden" -> correctly flagged' :
        `expected "abmelden" flagged as wrong-term, got ${distinct.length}`
    );

    // (4) --ignore-source-gaps drops ONLY the missing-in-source class from the defective target.
    let withGap = null, noGap = null, gapErr = null;
    try {
      const args = { target: readJson(`${FX}/locales/de.json`), source, glossary, formality: 'formal' };
      withGap = evaluate(args);
      noGap = evaluate({ ...args, ignoreSourceGaps: true });
    } catch (e) { gapErr = e.message; }
    const droppedOnlyGap = !gapErr &&
      withGap.some((v) => v.class === 'missing-in-source') &&
      !noGap.some((v) => v.class === 'missing-in-source') &&
      noGap.length === withGap.filter((v) => v.class !== 'missing-in-source').length;
    hard(
      'EVAL --ignore-source-gaps drops only source gaps',
      droppedOnlyGap,
      gapErr ? `errored: ${gapErr}` :
        droppedOnlyGap ? `missing-in-source suppressed, other classes intact (${withGap.length} -> ${noGap.length})` :
        `flag did not cleanly drop only missing-in-source (${withGap && withGap.length} -> ${noGap && noGap.length})`
    );
  }
}

// ===========================================================================
// (h) GIT TAG  [SOFT]
// ===========================================================================
{
  const tag = `v${version}`;
  let out = null, gitErr = null;
  try {
    out = execFileSync('git', ['tag', '--list', tag], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (e) {
    gitErr = e.message;
  }
  if (gitErr) {
    soft(`GIT TAG (${tag})`, false, `skipped — not a git repo or git unavailable (${gitErr.split('\n')[0]})`);
  } else {
    soft(`GIT TAG (${tag})`, out === tag, out === tag ? `tag ${tag} exists` : `tag ${tag} not found (expected before the release tag is pushed)`);
  }
}

// ---- report ----------------------------------------------------------------
const pad = Math.max(...rows.map(([, n]) => n.length));
console.log('');
console.log(`Translation Agency — invariant check  (VERSION ${version})`);
console.log('─'.repeat(60));
for (const [status, name, reason] of rows) {
  console.log(`${status.padEnd(4)}  ${name.padEnd(pad)}  ${reason}`);
}
console.log('─'.repeat(60));
console.log(`${passed} passed, ${failed} failed, ${warnings} warnings`);
process.exit(failed > 0 ? 1 : 0);
