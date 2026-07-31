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
| **Researcher** | `translate-researcher` | Sonnet | Optional pre-step: works out the correct vocabulary per language from the project's context + content, and writes a reusable glossary the panel translates against. |

The `translate` skill computes scope and per-batch tier, (optionally) runs the Researcher first, spawns the Lead **once**, and the Lead drives the workers and QA. One final verify/build runs at the end.

## Features

- **Any project, any files, any language** — codebase i18n *and* standalone documents.
- **Context-aware** — you describe what the product is; the translator uses it to pick the right *sense* of ambiguous words ("Book" = reserve vs. the object).
- **Terminology research** — an optional research pass builds a reusable per-language glossary before translating, so terms of art are correct and consistent.
- **Non-blocking uncertainty** — when unsure, the translator best-guesses and logs the question to an async queries file; it never turns you into an answer machine.
- **Domain specialization as a per-run setting** — `general` (default), `technical`, `marketing`, `legal`, or your own.
- **Broad format support** — JS/TS & JSON message catalogs, i18next/`.arb`, YAML, `.resx`, `.strings`; **WordPress / gettext** (`.pot`, `.po`, plurals, `msgctxt`, WP JSON); Markdown/MDX/HTML/XML/XLIFF content trees; `.docx`, `.txt`, subtitles (`.srt`/`.vtt`), CSV.
- **Flexible output** — write siblings next to each source (default), copy into an isolated `translations/<lang>/…` tree, or edit an existing per-language catalog in place. See [Output modes](#output-modes--what-each-does).
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

# Force a fresh terminology-research pass (rebuilds the glossary) before translating
/translate --to de --research

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

## Output modes — what each does

Set the output layout with `--out <mode>` or `config.output.mode`. All examples start from this
sample project and run `/translate --to de` (source language `en`):

```
MyApp/
├── src/i18n/en.json
├── content/en/home.md
└── docs/guide.md
```

### `inplace` — default

Writes each translation as a sibling **right next to its source**, swapping the language code in the
filename (`en.json` → `de.json`) or appending one when the name has no code (`guide.md` →
`guide.de.md`). Originals are never overwritten. Best when each language file is meant to live beside
its source (documents, catalogs).

```
MyApp/
├── src/i18n/en.json          ← untouched
├── src/i18n/de.json          ← NEW · German
├── content/en/home.md        ← untouched
├── content/en/home.de.md     ← NEW · German
├── docs/guide.md             ← untouched
└── docs/guide.de.md          ← NEW · German
```

### `tree` — isolated copies per language

Copies everything into a `translations/<lang>/` folder per language and translates the copies;
originals never change. Language codes in the path are rewritten to the target, so `en.json` lands
as `de.json` and a `content/en/…` segment becomes `content/de/…`.

```
MyApp/
├── src/i18n/en.json          ← untouched
├── content/en/home.md        ← untouched
├── docs/guide.md             ← untouched
└── translations/
    └── de/
        ├── src/i18n/de.json       ← en.json renamed → de.json · German
        ├── content/de/home.md     ← en/ segment → de/ · German
        └── docs/guide.md          ← no code in name, kept · German
```

### `catalog` — edit existing language files in place

For a codebase that **already** has a per-language layout. Edits the existing target files directly
(fills missing keys, fixes leftovers, corrects terminology) — no copies, no new tree. Starting from
a project that already has `de.json`:

```
MyApp/
└── src/i18n/
    ├── en.json               ← source, untouched
    └── de.json               ← EDITED in place: missing keys filled, leftovers fixed
```

When you don't pass `--out`, the default is `inplace` — except if the project already has a
per-language catalog/tree (a `de.json` next to `en.json`, or `messages.de.ts`), in which case it
auto-selects `catalog` so it edits the real build files instead of writing `de.de.json` siblings.

> These modes are one of three independent dials. **Output mode** (above) decides *where files go*;
> **scope** decides *what is translated* (default: only what changed since last run · `--files
> <glob>`: an explicit set · `--full`: everything); **domain** decides *how* (`--domain
> general|technical|marketing|legal`). A full command: `/translate --path C:\Projects\MyApp --to
> de,fr --full --domain technical`.

## Configuration

**Where this file lives:** put `translation.config.json` at the **root of the project you are translating** — the folder that holds the source files and where the `translations/` output is written. It does **not** go in the Translation Agency toolkit folder. The copy shipped in this repo is only a template/default; copy it into your target project and edit it there (or skip the file entirely and pass values as CLI flags with `--path`).

For example, to translate an app at `C:\Projects\MyApp`, the file belongs at `C:\Projects\MyApp\translation.config.json`. When you run `/translate --path C:\Projects\MyApp`, the skill reads the config from that path's root and writes copies to `C:\Projects\MyApp\translations\<lang>\…`.

You don't have to write it by hand — run **`/translate-init --path <project>`**, a guided step-by-step wizard that explains each option, captures the project's purpose/context, and writes the file (and registers the project) for you.

All fields are optional (each falls back to a default); CLI flags override the file for a single run:

```json
{
  "projectPath": "",
  "sourceLang": "en",
  "targetLangs": ["de", "fr", "es"],
  "specialization": "general",
  "context": "One or two sentences on what the product is and who it's for.",
  "research": "first-run",
  "queries": "report",
  "glossary": "",
  "include": ["src/i18n/**", "locales/**", "content/**", "languages/**"],
  "exclude": ["**/node_modules/**", "**/dist/**", "translations/**"],
  "output": { "mode": "inplace", "dir": "translations" },
  "verifyCmd": "",
  "buildCmd": "",
  "wordpress": { "textdomain": "", "makeJson": false, "makeMo": false }
}
```

`context` is the highest-leverage field — it's what lets the translator pick the right sense of a
word. `research` controls the terminology-glossary pass (`first-run` builds it once per language then
reuses it; `always` re-runs it; `off` disables). `queries` controls uncertainty handling (`report`
logs questions to an async file without interrupting you; `high-stakes` also asks interactively for a
few legal/medical/financial terms; `off` best-guesses silently). See
[Context, research & questions](#context-research--questions).

## Context, research & questions

Three features exist so the translator produces the *right words for your product*, not generic
dictionary output — and so getting there doesn't turn you into an answer machine.

**Context.** You describe, in a sentence or two, what the product is and who it's for. That single
input is what disambiguates polysemous words: in a hotel-booking app "Book" is *reserve*, "Register"
is *sign up*, "Order" is a *purchase* — a fact no dictionary can supply. The wizard asks for it; it
lives in `config.context` (inline or a `translation-context.md` file) and reaches every agent on
every run.

**Terminology research.** Before translating, the `translate-researcher` agent reads your context and
a sample of the real content, determines the correct term of art for each target language (researching
*in* that language, not English), and writes `projects/<slug>/glossary.csv`. The panel then translates
against that glossary, so terminology is correct and consistent across the whole project. By default
(`research: first-run`) it runs once per language and the glossary is reused after that; `--research`
forces a refresh. You can edit the glossary by hand — research never overwrites your rows.

**Questions, handled asynchronously.** When the translator is genuinely unsure about a string, it does
**not** stop and ask. It makes a best-guess translation *and* appends the question — its assumption and
what it needs to know — to `projects/<slug>/queries-<date>.md`. You skim that file whenever it suits
you; answering (by editing the glossary or notes) settles the item so it's never raised again. This is
the default (`queries: report`). If you'd rather be asked live for the riskiest terms, `high-stakes`
adds interactive prompts for legal/medical/financial vocabulary only; `off` skips the file entirely.

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
│   ├── agents/                   # translate-lead, -senior, -junior, -researcher
│   └── skills/                   # translate-init/, translate/, translate-add-locale/
├── specializations/              # general, technical, marketing, legal (+ README)
└── projects/                     # registry.json + per-project notes.md / glossary.csv / queries (+ _template)
```

## Versioning

This project follows [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`. Bump PATCH for fixes, MINOR for new features (a new specialization or format), MAJOR for breaking changes to how skills or config work. Releases are tagged `vX.Y.Z` and recorded in [`CHANGELOG.md`](CHANGELOG.md). Current version: **0.1.0**.

## Contributing

Issues and pull requests welcome. Good first contributions: new `specializations/*.md` modules, additional file-format handling, and glossary tooling. Please add a changelog entry under `[Unreleased]` with your change.

## Disclaimer

**Translations produced by this tool are generated by AI (large language models), not by
professional human translators.** Although the panel enforces quality checks — leftover detection,
terminology consistency, placeholder and markup preservation, and adversarial review — AI output can
still contain errors, mistranslations, omissions, awkward phrasing, or terminology and legal
inaccuracies, and it may not reflect local conventions, regulations, or cultural nuance.

The output is provided **"as is", without warranty of any kind, and you use it at your own risk.**
You are responsible for reviewing and validating any translation before you rely on it, publish it,
or ship it — **especially for legal, medical, financial, safety-critical, or otherwise high-stakes
content, where review and sign-off by a qualified human translator or subject-matter expert is
strongly recommended.** Nothing produced by this tool constitutes professional translation, legal,
medical, or financial advice.

To the maximum extent permitted by law, the authors and contributors accept no liability for any
loss or damage arising from the use of this software or its output. See the [LICENSE](LICENSE) for
the full warranty disclaimer and limitation of liability.

## License

[MIT](LICENSE) © 2026 Rosti
