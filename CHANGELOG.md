# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(`MAJOR.MINOR.PATCH` — bump PATCH for fixes, MINOR for new features, MAJOR for
breaking changes to skills or config).

## [Unreleased]

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

[Unreleased]: https://github.com/roshaw/claude-translation-agency/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/roshaw/claude-translation-agency/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/roshaw/claude-translation-agency/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/roshaw/claude-translation-agency/releases/tag/v0.1.0
