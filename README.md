# Translation Agency

> Ready-to-use Claude skills and agents that translate **any project or set of files into any language**, with a domain **specialization** you choose per run.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Translation Agency is a portable localization pipeline for [Claude Code](https://claude.com/claude-code) / Cowork. It was extracted and generalized from a production legal-fee-calculator localization system, whose three-tier "translator panel" and adversarial-QA design proved out over many real passes — then had all its project-specific hardwiring lifted out into settings so the same machinery works on a WordPress plugin, a React app's i18n, a folder of Markdown docs, or a batch of JSON files.

## Why a "panel" and not a single translator

A single-writer translation flow reliably leaks a known set of errors: source-language strings left un-translated, wrong terminology, dropped `{placeholders}`, broken markup, and the writer's own "looks fine to me" blind spots. Translation Agency splits **writing** from **adversarial review** across three agents, the way a real localization agency does:

| Tier | Agent | Model | Role |
|---|---|---|---|
| **Lead** | `translate-lead` | Opus | Orchestrates each run, dispatches batches, and adversarially reviews every result against a fixed **C1–C7** checklist before signing off. Runs final blind-spot sweeps. Not a translator itself. |
| **Senior** | `translate-senior` | Sonnet | Translates domain-prose and any substantive surface. Spawned by the Lead. |
| **Junior** | `translate-junior` | Haiku | Translates only low-risk UI chrome; escalates anything domain-critical. Cheap by design. |

The `translate` skill computes scope and per-batch tier, spawns the Lead **once**, and the Lead drives the workers and QA. One final verify/build runs at the end.

## Features

- **Any project, any files, any language** — codebase i18n *and* standalone documents.
- **Domain specialization as a per-run setting** — `general` (default), `technical`, `marketing`, `legal`, or your own.
- **Broad format support** — JS/TS & JSON message catalogs, i18next/`.arb`, YAML, `.resx`, `.strings`; **WordPress / gettext** (`.pot`, `.po`, plurals, `msgctxt`, WP JSON); Markdown/MDX/HTML/XML/XLIFF content trees; `.docx`, `.txt`, subtitles (`.srt`/`.vtt`), CSV.
- **Flexible output** — copy into a `translations/<lang>/…` tree (originals untouched), write siblings in place, or edit an existing per-language catalog.
- **Quality gates every run** — zero source-language leftovers, identity tokens verbatim, placeholders & markup preserved, correct terminology/framing, and a completeness gate that never lets a full run finish with a silent gap.
- **Projects registry + memory** — tracks every project it translates (`projects/registry.json`) and keeps per-project notes (terminology decisions, quirks, run log) that each run reads and updates.
- **Portable** — no hardcoded paths, locales, or domains; everything concrete comes from config + the chosen specialization.

## Requirements

Claude Code or the Claude desktop app (Cowork). The skills and agents live in `.claude/` and are picked up automatically when Claude runs inside this folder (or when you point `translate --path` at another project).

## Install

Clone the repo and either run Claude from inside it, or copy the pieces into a target project:

```bash
git clone https://github.com/roshaw/claude-translation-agency.git
```

To use it against another project, copy `.claude/agents/`, `.claude/skills/`, and `specializations/` (plus a `translation.config.json`) into that project — or just run `translate --path <that project>` from here.

## Usage

```bash
# One-time setup: generate translation.config.json for a project (detects source lang, formats, targets)
/translate-init --path C:\Projects\MyApp

# Translate a whole folder into two languages; copies land under translations/de and translations/fr
/translate --path C:\Projects\MyApp --to de,fr

# A WordPress plugin's strings, technical domain, WP locale codes
/translate --path C:\Projects\my-plugin --domain technical --to de_DE,fr_FR

# Only what changed since the last run, editing an existing catalog in place
/translate --out catalog

# Everything, from scratch, in a marketing voice
/translate --full --domain marketing

# Scaffold a brand-new UI language, then fill it
/translate-add-locale pt-BR
/translate --full --to pt-BR
```

Flags compose. Every run ends with a report: a verdict, per-batch outcomes, flag counts by category, a mandatory completeness line per target language, and any open questions.

## The specialization setting

The translator's domain expertise is a **per-run setting**, not baked in. It decides the terminology the panel enforces, what stays verbatim, and what framing to preserve. Resolved in order (later wins): `--domain <name>` → `translation.config.json` → default `general`.

| Domain | For |
|---|---|
| `general` *(default)* | Everyday content — no special domain constraints. |
| `technical` | Software/dev material, API docs, error strings, WordPress theme/plugin strings. |
| `marketing` | Brand/campaign copy — transcreation, brand voice, punchy CTAs. |
| `legal` | Reference example — citations verbatim, terms of art, "reference not mandatory" framing. |

Add your own by dropping a `specializations/<name>.md` (skeleton in [`specializations/README.md`](specializations/README.md)) and running `/translate --domain <name>` — no code changes. A project glossary (config `glossary`) overrides any specialization on the terms it defines.

## Output layouts

Set by `--out` / `config.output.mode`:

- **`tree`** *(default)* — copies each source file to `<projectPath>/translations/<lang>/<original-relative-path>` and translates the copy, leaving originals untouched.
- **`inplace`** — writes a sibling `<name>.<lang>.<ext>` next to each source.
- **`catalog`** — edits the existing per-language catalog files in place (`messages.<lang>.ts`, `languages/<textdomain>-<locale>.po`, …).

## Configuration

**Where this file lives:** put `translation.config.json` at the **root of the project you are translating** — the folder that holds the source files and where the `translations/` output is written. It does **not** go in the Translation Agency toolkit folder. The copy shipped in this repo is only a template/default; copy it into your target project and edit it there (or skip the file entirely and pass values as CLI flags with `--path`).

For example, to translate an app at `C:\Projects\MyApp`, the file belongs at `C:\Projects\MyApp\translation.config.json`. When you run `/translate --path C:\Projects\MyApp`, the skill reads the config from that path's root and writes copies to `C:\Projects\MyApp\translations\<lang>\…`.

You don't have to write it by hand — run **`/translate-init --path <project>`** and it detects the source language, formats, and existing target languages, asks for the rest, and writes the file to the target project's root for you.

All fields are optional (each falls back to a default); CLI flags override the file for a single run:

```json
{
  "projectPath": "",
  "sourceLang": "en",
  "targetLangs": ["de", "fr", "es"],
  "specialization": "general",
  "glossary": "",
  "include": ["src/i18n/**", "locales/**", "content/**", "languages/**"],
  "exclude": ["**/node_modules/**", "**/dist/**", "translations/**"],
  "output": { "mode": "tree", "dir": "translations" },
  "verifyCmd": "",
  "buildCmd": "",
  "wordpress": { "textdomain": "", "makeJson": false, "makeMo": false }
}
```

## Project layout

```
translation-agency/
├── CLAUDE.md                     # project guide Claude reads on load
├── README.md                     # this file
├── LICENSE                       # MIT
├── CHANGELOG.md                  # Keep a Changelog + SemVer
├── VERSION                       # 0.1.0
├── translation.config.json       # default settings
├── .claude/
│   ├── agents/                   # translate-lead, translate-senior, translate-junior
│   └── skills/                   # translate-init/, translate/, translate-add-locale/
├── specializations/              # general, technical, marketing, legal (+ README)
└── projects/                     # registry.json + per-project notes.md memory (+ _template)
```

## Versioning

This project follows [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`. Bump PATCH for fixes, MINOR for new features (a new specialization or format), MAJOR for breaking changes to how skills or config work. Releases are tagged `vX.Y.Z` and recorded in [`CHANGELOG.md`](CHANGELOG.md). Current version: **0.1.0**.

## Contributing

Issues and pull requests welcome. Good first contributions: new `specializations/*.md` modules, additional file-format handling, and glossary tooling. Please add a changelog entry under `[Unreleased]` with your change.

## License

[MIT](LICENSE) © 2026 Rosti
