# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(`MAJOR.MINOR.PATCH` — bump PATCH for fixes, MINOR for new features, MAJOR for
breaking changes to skills or config).

## [Unreleased]

## [0.1.0] — 2026-07-31

Initial release. Extracted and generalized from the Tarifo.net localization
pipeline into a project-agnostic translation system.

### Added
- **Translator panel** (`.claude/agents/`):
  - `translate-lead` (Opus) — orchestrator + adversarial QA against a fixed
    C1–C7 checklist, plus final blind-spot sweeps.
  - `translate-senior` (Sonnet) — domain-prose translator across message
    catalogs, documents, MDX/HTML, and WordPress gettext (`.po`/`.pot`, plurals,
    `msgctxt`, WP JSON).
  - `translate-junior` (Haiku) — low-risk UI-chrome translator that escalates
    anything domain-critical.
  - `translate-researcher` (Sonnet) — terminology-research pass that builds a
    per-language glossary from the project's context + content before translating.
- **Skills** (`.claude/skills/`):
  - `translate-init` — guided, step-by-step config wizard that explains each
    option, captures the project's purpose/context, writes `translation.config.json`,
    and registers the folder as a tracked project.
  - `translate` — main pass: source-language + format detection, scope
    (incremental / `--files` / `--full`), tier classification, optional research
    pass, single final verify/build, and delivery or commit. Offers a project
    picker from the registry when run without a path.
  - `translate-add-locale` — scaffold a brand-new UI language into a codebase, then hand
    off to `translate`.
- **Specialization setting** (`specializations/`): per-run domain profile —
  `general` (default), `technical`, `marketing`, and `legal` (ported reference
  example). Extensible by adding a `specializations/<name>.md`.
- **Project context** (`config.context`): a purpose/audience description passed to
  every agent so the translator picks the right sense of ambiguous words.
- **Terminology research** (`config.research`: `first-run` default / `always` /
  `off`, or `--research`): reusable per-language glossary at `projects/<slug>/glossary.csv`.
- **Asynchronous uncertainty handling** (`config.queries`: `report` default /
  `high-stakes` / `off`): best-guess + a `projects/<slug>/queries-<date>.md` log,
  never blocking the operator.
- **Projects registry & memory** (`projects/`): `registry.json` index +
  per-project `notes.md`, `glossary.csv`, and queries logs.
- **Output layouts**: `inplace` (default — sibling next to each source, language
  code swapped), `tree` (isolated `translations/<lang>/…` copies), and `catalog`
  (edit existing per-language files). Language codes in paths are rewritten to the
  target (`en.json` → `de.json`).
- **Configuration**: `translation.config.json` (project path, source/target
  languages, specialization, context, research, queries, glossary, include/exclude,
  output mode, verify/build commands, WordPress options).
- **AI-translation disclaimer** in the README and a per-run report footer.
- Project guide (`CLAUDE.md`), `README.md`, `LICENSE` (MIT), `VERSION`, and this
  changelog.

[Unreleased]: https://github.com/roshaw/claude-translation-agency/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/roshaw/claude-translation-agency/releases/tag/v0.1.0
