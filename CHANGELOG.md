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

[Unreleased]: https://github.com/roshaw/claude-translation-agency/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/roshaw/claude-translation-agency/releases/tag/v0.1.0
