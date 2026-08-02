# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(`MAJOR.MINOR.PATCH` — bump PATCH for fixes, MINOR for new features, MAJOR for
breaking changes to skills or config).

## [Unreleased]

## [0.8.1] — 2026-08-02

### Fixed
- **Strong-disclaimer trigger now covers the shipped `banking` module and no longer references
  non-existent modules.** `/translate` Step 9 bolds a full-sentence disclaimer for high-stakes runs,
  but the trigger list read `legal`, `medical`, or `financial` — neither `financial` (the real module
  is `banking`) nor `medical` is a shipped specialization, so a `--domain banking` run (the actual
  high-stakes financial domain) silently got only the plain disclaimer. The trigger is rewritten to
  fire for any high-stakes / safety-critical domain — `legal`, `banking`, or `medical`, or any custom
  module of comparable stakes (health, financial, legal, safety) — so `banking` is covered and the
  check is robust rather than a brittle hard-coded list. Descriptive category prose elsewhere (the
  "legal/medical/financial content" wording in disclaimers, `high-stakes` queries, and agent
  examples) is unchanged — those describe kinds of content, not module names.

## [0.8.0] — 2026-08-02

### Added
- **JSON Schema for `translation.config.json`** (`translation.config.schema.json`, draft 2020-12).
  The config was hand-edited with no validation, so a typo like `"research": "firstrun"` failed
  silently. The schema defines every current field (all optional) with correct types and enums —
  `research`, `queries`, and `output.mode` are enum-checked; `specialization` stays open-typed
  because custom `specializations/<name>.md` modules are valid values — and sets
  `additionalProperties: false` (with a `^\$comment` `patternProperties` allowance plus `$schema`)
  so unknown keys are caught while the annotated template still validates. Each field carries a
  one-line description for editor hovers. The template now points at the schema via a `$schema` key
  using the raw-GitHub URL, so editors get **autocomplete + typo-catching** from any project the file
  is copied into. Documented in both README and CLAUDE.md "Configuration". Config behavior is
  unchanged — this is additive editor/validation tooling only.

## [0.7.0] — 2026-08-02

### Added
- **`/translate-audit --deep` — quality review of existing translations.** Beyond
  the default coverage pass, `--deep` spawns the `translate-lead` in a new
  review-only **`audit` mode** to run the C1–C7 checklist over the *existing*
  translations (domain-aware, using the specialization + glossary + context) and
  report, per finding, a **severity** — `must-fix` (correctness: leftovers,
  identity-token drift, dropped placeholders, broken markup) or `polish` (quality:
  weak terminology, machine-translation stiffness / wrong register, parallel-copy
  drift) — with the current value and a suggested rewrite. It is **scoped/sampled
  by default** (`--sample N`, default 40, or `--files`/`--langs`) and reports the
  sample honestly (no silent truncation). Still read-only; `--fix` hands the
  flagged files to `/translate` to apply. New flags: `--deep`, `--sample`,
  `--fix`, `--domain`. Writes a separate `translation-quality-<date>.md`.

### Changed
- **`translate-lead`** gained a review-only **`audit` mode**: no worker spawns, no
  file edits — it treats each existing target value as the candidate, runs C1–C7,
  and returns severity-tagged findings. The flag row now carries a `severity`
  field. Normal translate runs are unchanged.

## [0.6.0] — 2026-08-02

### Added
- **`/translate-audit` skill** (`.claude/skills/translate-audit/SKILL.md`): a
  read-only coverage audit across every existing language. It builds the union of
  all keys/strings/pages present in any locale (including the source) and reports,
  per language, what is missing, which languages *do* have it, and how to fix it —
  a coverage matrix + fix plan, changing nothing. Catches four gap classes:
  missing-in-target, **missing-in-source** (a key present in translations but not
  the source, which `/translate` can't auto-fill), empty values, and untranslated
  leftovers; plus content-tree file coverage and stale `source_hash`. Works on
  message catalogs, gettext (`.po`/`.pot`), and mirrored content trees. Points at
  `/translate` to close the gaps. Cross-referenced from `/translate` and
  `/translate-add-locale`.

## [0.5.0] — 2026-08-02

### Added
- **Attribution** — the tool now credits itself, safely. Every `/translate` run's
  **report always** ends with `Translated with Translation Agency <version> —
  <repo URL>` (operator-facing; never written into your files). New optional
  config `creditInCommit` (default `false`): when `true` and a run actually
  commits (`inplace`/`catalog` in a git repo), the translation commit gets a
  `Translated-with: Translation Agency <version> (<repo URL>)` trailer — credit in
  git history, still nothing stamped inside the translated files. No attribution
  is ever injected into file headers, frontmatter, or a project README. README
  documents the flag with an invitation to enable it if the tool has been helpful.

## [0.4.1] — 2026-08-02

### Changed
- **Per-project data is now local, not committed.** `projects/registry.json` and
  every `projects/<slug>/` folder (notes, glossary, queries) are git-ignored and
  `registry.json` is untracked — they hold private, project-specific data that
  should not land in this public repo, and ignoring them stops every
  `init`/`translate` run from showing up as a diff. Only `projects/_template/`
  and `projects/README.md` remain tracked. The `/translate-init` and `/translate`
  skills now create `registry.json` (`{ "version": 1, "projects": [] }`) if it is
  missing, and treat a missing registry the same as an empty one. Docs updated to
  reflect that project memory is local (sync a `<slug>/` folder yourself if you
  want it to travel between machines).

### Added
- **`doNotTranslate` config option**: a list of manual pass-through / verbatim
  rules — free-form, plain-language instructions for strings that look like copy
  but are project-specific data (colour/size tokens like `42x2`, raw user-entered
  text, named placeholders) and must stay byte-identical. The panel treats each
  rule as absolute, adding covered values to the C1/C3 verbatim exempt list so
  they are never translated and never flagged as source-language leftovers. Wired
  end-to-end: `translation.config.json` → `/translate` brief (`do_not_translate`,
  merged with any `notes.md` items) → Lead C1/C3 checks → Senior & Junior workers.
  `/translate-init` now asks for these rules during setup. For a single fixed term,
  a glossary row with `lang=*` remains the tighter tool.

## [0.3.1] — 2026-08-02

### Changed
- **Release convention now requires tagging.** `CLAUDE.md`'s "Release & commit
  convention" makes an annotated `vX.Y.Z` tag a mandatory step of every version
  bump (was "tag if cutting a release"), keeping the tag list 1:1 with releases.

## [0.3.0] — 2026-08-02

### Added
- **`banking` specialization** (`specializations/banking.md`): a high-constraint
  domain module for retail/commercial/investment banking and financial-services
  copy — money, rates, and financial identifiers kept verbatim; market terms of
  art enforced; obligation/risk framing and regulated disclosures never softened.
  Select with `--domain banking` or `translation.config.json → specialization`.
- **"Which one to pick" guidance** in `README.md`: how to choose among the
  specialization modules and resolve domain overlaps (marketing vs banking vs
  legal vs technical) by the dominant risk in the copy.
- **Release & commit convention** in `CLAUDE.md`: every commit-and-push bumps the
  version first (PATCH/MINOR/MAJOR by the change), updates all version references
  and the changelog, then commits and pushes.

## [0.2.0] — 2026-07-31

Context-aware translation: the panel now works out the right vocabulary for the
specific product before it translates, and asks about what it is unsure of
without blocking the run.

### Added
- **Terminology-research pass** (`.claude/agents/translate-researcher.md`,
  Sonnet): before the panel runs, builds a per-language glossary from the
  project's context + a content sample (researching in the target language) and
  writes `projects/<slug>/glossary.csv`, which the Senior and Lead then translate
  against. Controlled by `config.research` (`first-run` default / `always` /
  `off`) or `--research`.
- **Project context** (`config.context`): a purpose/audience description passed
  to every agent so the translator picks the right sense of ambiguous words.
- **Asynchronous uncertainty handling** (`config.queries`: `report` default /
  `high-stakes` / `off`): best-guess + a `projects/<slug>/queries-<date>.md` log,
  never blocking the operator.
- **Projects registry & memory** (`projects/`): `registry.json` index +
  per-project `notes.md`, `glossary.csv`, and queries logs.
- **AI-translation disclaimer** in the README and a per-run report footer.

### Changed
- `translate-init` is now a guided, step-by-step wizard that explains each
  option, captures the project's purpose/context, and registers the folder as a
  tracked project.
- `translate` reads project notes at the start of a run, runs the optional
  research pass, offers a project picker from the registry when run without a
  path, and appends to the run log at the end.
- Default output layout is now `inplace` (sibling next to each source, language
  code swapped) instead of `tree`; `tree` and `catalog` remain available.
- The Lead's terminology check (C2) and the Senior are now glossary-aware.

## [0.1.0] — 2026-07-31

Initial release. Extracted and generalized from the Tarifo.net localization
pipeline into a project-agnostic translation system.

### Added
- **Three-tier translator panel** (`.claude/agents/`):
  - `translate-lead` (Opus) — orchestrator + adversarial QA against a fixed
    C1–C7 checklist, plus final blind-spot sweeps.
  - `translate-senior` (Sonnet) — domain-prose translator across message
    catalogs, documents, MDX/HTML, and WordPress gettext (`.po`/`.pot`, plurals,
    `msgctxt`, WP JSON).
  - `translate-junior` (Haiku) — low-risk UI-chrome translator that escalates
    anything domain-critical.
- **Skills** (`.claude/skills/`):
  - `translate-init` — setup step: detects source language, formats, and existing target
    languages, then writes a ready `translation.config.json` at the target project's root.
  - `translate` — main pass: source-language + format detection, scope
    (incremental / `--files` / `--full`), tier classification, single final
    verify/build, and delivery or commit.
  - `translate-add-locale` — scaffold a brand-new UI language into a codebase, then hand
    off to `translate`.
- **Specialization setting** (`specializations/`): per-run domain profile —
  `general` (default), `technical`, `marketing`, and `legal` (ported reference
  example). Extensible by adding a `specializations/<name>.md`.
- **Output layouts**: `tree` (default — copies to
  `<root>/translations/<lang>/…`, originals untouched), `inplace`, and `catalog`.
- **Configuration**: `translation.config.json` (project path, source/target
  languages, specialization, glossary, include/exclude, output mode,
  verify/build commands, WordPress options).
- Project guide (`CLAUDE.md`), `README.md`, `LICENSE` (MIT), `VERSION`, and this
  changelog.

[Unreleased]: https://github.com/roshaw/claude-translation-agency/compare/v0.8.1...HEAD
[0.8.1]: https://github.com/roshaw/claude-translation-agency/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/roshaw/claude-translation-agency/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/roshaw/claude-translation-agency/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/roshaw/claude-translation-agency/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/roshaw/claude-translation-agency/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/roshaw/claude-translation-agency/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/roshaw/claude-translation-agency/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/roshaw/claude-translation-agency/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/roshaw/claude-translation-agency/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/roshaw/claude-translation-agency/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/roshaw/claude-translation-agency/releases/tag/v0.1.0
