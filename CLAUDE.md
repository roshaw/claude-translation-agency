# Translation Agency

**Version 0.1.0** · MIT licensed · [SemVer](https://semver.org) + [CHANGELOG.md](CHANGELOG.md)

A reusable, project-agnostic translation system: ready-to-use **skills** and **agents** that
translate **any project or set of files into any language**, with a domain **specialization** you
choose per run (or leave at the `general` default).

It was extracted and generalized from a production legal-fee-calculator localization pipeline
(`Tarifo.net`), whose three-tier translator panel and adversarial-QA design proved out over many
real passes. The Tarifo-specific hardwiring (its file layout, its legal domain, its git/deploy
rules) has been lifted out into settings, so the same machinery now works on a WordPress plugin, a
folder of Markdown docs, a React app's i18n, or a batch of JSON files.

## The model: a three-tier translator panel

Every translation run is orchestrated by a panel of three agents, mirroring a real localization
agency (worker → senior → lead), because a single-writer flow reliably leaks a known set of errors
(source-language leftovers, wrong terminology, dropped placeholders, broken markup, and the writer's
own "looks clean to me" blind spots). Splitting **writing** from **adversarial review** is what
catches them.

- **Lead** — `.claude/agents/translate-lead.md` (Opus). Project manager. Spawned once per run;
  plans batches, dispatches each to a worker, and **adversarially reviews** every result against a
  fixed C1–C7 checklist before signing off. Runs final blind-spot sweeps. Loads the run's
  specialization so its terminology check is domain-aware. Not a translator itself.
- **Senior** — `.claude/agents/translate-senior.md` (Sonnet). Translates domain-prose and any
  substantive surface (documents, marketing/legal/technical copy, message values, MDX/HTML,
  WordPress `.po`). Spawned by the Lead.
- **Junior** — `.claude/agents/translate-junior.md` (Haiku). Translates only low-risk UI chrome
  (nav, buttons, footer, generic errors). Cheap by design; escalates anything domain-critical to the
  Senior. Spawned by the Lead.

The skill computes scope + per-batch tier, spawns the **Lead once**, and the Lead handles all worker
spawns and reviews. The single final build/verify runs in the skill.

## The skills

- **`/translate-init`** — `.claude/skills/translate-init/SKILL.md`. Setup step: point it at a
  project and it detects the source language, formats, and existing target languages, asks for the
  targets / specialization / output layout, and writes a ready `translation.config.json` at that
  project's root. Run once per project before the first translate.
- **`/translate`** — `.claude/skills/translate/SKILL.md`. The main entry point. Detects the source
  language and file formats, computes scope (changed-since-last-run, an explicit file/glob set, or
  the whole surface), classifies batches, drives the panel, runs one final verify/build, and
  delivers or commits. Works on codebases **and** standalone documents.
- **`/translate-add-locale`** — `.claude/skills/translate-add-locale/SKILL.md`. Scaffolds a brand-new UI language into a
  codebase (registry, catalog clone, routes, switcher) so the build goes green with placeholders,
  then hands off to `/translate` to fill it.

## The specialization setting (choose the domain, or leave it default)

The translator's domain expertise is a **per-run setting**, not baked in. It decides the terminology
the panel enforces, what stays verbatim, and what framing to preserve.

Pick one, resolved in this order (later wins): `/translate --domain <name>` → `translation.config.json
→ specialization` → default **`general`**.

Seeded presets (in `specializations/`):

| Domain | For |
|---|---|
| `general` *(default)* | Everyday content — no special domain constraints. |
| `technical` | Software/dev material, API docs, error strings, WordPress theme/plugin strings. |
| `marketing` | Brand/campaign copy — transcreation, brand voice, punchy CTAs. |
| `legal` | Reference example (the domain this was extracted from) — citations verbatim, terms of art, "reference not mandatory" framing. |

**Add your own** by dropping a `specializations/<name>.md` (skeleton in `specializations/README.md`)
and running `/translate --domain <name>` — no code changes. A project **glossary** (config
`glossary`) overrides any specialization on the specific terms it defines.

## Supported inputs & formats

Codebase i18n and standalone files alike:

- **Message catalogs** — JS/TS (`messages.<lang>.ts`), JSON / i18next / `.arb`, YAML, `.resx`, `.strings`.
- **WordPress / gettext** — `.pot` templates, `.po` catalogs (with `msgctxt`, plurals, `printf`
  args), and the Jed-format WP JSON; `.mo`/JSON compiled from the `.po` by the pipeline.
- **Content trees** — Markdown / MDX / HTML / XML / XLIFF (per-language mirrored files, with a
  `source_hash` staleness stamp).
- **Documents** — Markdown, `.docx`, `.txt`, subtitles (`.srt`/`.vtt`), CSV / spreadsheets.

## Where translations are written (output layout)

Set by `--out` / `config.output.mode`:

- **`tree`** *(default; the "point at a path" mode)* — copies each source file to
  `<projectPath>/translations/<lang>/<original-relative-path>` and translates the **copy**, leaving
  originals untouched. So `/translate --path C:\Projects\MyApp --to de,fr` produces
  `C:\Projects\MyApp\translations\de\…` and `…\translations\fr\…`.
- **`inplace`** — writes a sibling `<name>.<lang>.<ext>` next to each source.
- **`catalog`** — edits the existing per-language catalog files in place (`messages.<lang>.ts`,
  `languages/<textdomain>-<locale>.po`, …), for a codebase that already has a language tree.

## Quick start

1. **Point at what to translate.** Either pass a path — `/translate --path C:\Projects\MyApp` — or
   drop a `translation.config.json` in the project (copy the template at the repo root and edit
   `sourceLang`, `targetLangs`, `specialization`, `include`).
2. **Run it.**
   - Whole folder into two languages, copies under `translations/`:
     `/translate --path C:\Projects\MyApp --to de,fr`
   - A WordPress plugin's strings, technical domain:
     `/translate --path C:\Projects\my-plugin --domain technical --to de_DE,fr_FR`
   - Just the changed strings since last run (codebase in place):
     `/translate --out catalog`
   - Everything, from scratch, marketing voice:
     `/translate --full --domain marketing`
   - A new UI language end-to-end: `/translate-add-locale pt-BR` → then `/translate --full --to pt-BR`.
3. **Review the report.** Every run ends with a verdict, per-batch outcomes, flag counts by
   category, a mandatory completeness line per target language, and any open questions for you.

## Projects registry & memory

The toolkit keeps a record of **every project it translates**, versioned in this repo under
`projects/`:

- `projects/registry.json` — the index: each project's path, source/target languages,
  specialization, output mode, status, and last-run date.
- `projects/<slug>/notes.md` — per-project **memory**: terminology decisions, do-not-translate
  items, format quirks, what "done" means for that project, and a dated run log.
- `projects/<slug>/glossary.csv` — optional per-project glossary (overrides the specialization).

`/translate-init` adds a project (registry entry + notes from the template). `/translate` reads a
project's notes at the **start** of a run for context and updates `lastRunAt` + appends to the run
log at the **end**. Contract: `projects/README.md`. To see what projects are in flight, read
`projects/registry.json`.

## Configuration

`translation.config.json` lives at the root of the **project being translated** (the target project
that holds the source files and receives the `translations/` output) — **not** in this toolkit
folder. The copy in this repo is a template: copy it into the target project and edit it there, or
omit it and pass values as CLI flags with `--path`. So to translate `C:\Projects\MyApp`, the file
belongs at `C:\Projects\MyApp\translation.config.json`.

All fields optional. Key fields: `projectPath`, `sourceLang`, `targetLangs`, `specialization`,
`glossary`, `include`/`exclude`, `output.mode`, `verifyCmd`/`buildCmd`, and a `wordpress` block
(`textdomain`, `makeMo`, `makeJson`). Command-line flags override the config for a single run.

## Guarantees the panel enforces (every run, every language)

- **Zero source-language leftovers** — no target string left identical to the source (outside
  legitimately-shared tokens like brands, numbers, code, citations).
- **Identity verbatim** — numbers, dates, currencies, code, identifiers, URLs, and (in `legal`)
  citations stay byte-identical.
- **Placeholders & markup preserved** — every `{token}`/`%s`/ICU var survives name-identical; tags,
  components, and block structure stay parallel; only values are translated.
- **Right terminology & framing** — the specialization's term of art and stance, not a literal
  calque; machine-translation stiffness corrected toward natural phrasing.
- **Completeness gate** — a `--full` run never finishes with a silent gap; an incremental run
  surfaces every still-partial language.
- **Never changes source facts, never touches the source files, never pushes.** It translates copy;
  it doesn't add keys, edit numbers, or deploy.

## Layout

```
Translation Agency/
├── CLAUDE.md                     # this file
├── README.md                     # GitHub landing page
├── LICENSE                       # MIT
├── CHANGELOG.md                  # Keep a Changelog + SemVer
├── VERSION                       # 0.1.0
├── .gitignore
├── translation.config.json      # default settings (source/target langs, specialization, output, formats)
├── .claude/
│   ├── agents/
│   │   ├── translate-lead.md   # Opus — orchestrator + adversarial QA (C1–C7)
│   │   ├── translate-senior.md  # Sonnet — domain-prose translator
│   │   └── translate-junior.md  # Haiku — low-risk chrome translator
│   └── skills/
│       ├── translate-init/SKILL.md # generate a project's translation.config.json
│       ├── translate/SKILL.md    # the main translation pass
│       └── translate-add-locale/SKILL.md   # scaffold a new UI language, then hand off
├── specializations/
│   ├── README.md                 # how specializations work + how to add one
│   ├── general.md                # default
│   ├── technical.md
│   ├── marketing.md
│   └── legal.md                  # ported reference example
└── projects/
    ├── README.md                 # registry + memory contract
    ├── registry.json             # index of every project translated
    └── <slug>/notes.md           # per-project memory (created per project)
```

## Notes on portability

- The agents and skills reference **no** Tarifo-specific paths, locales, or domains — everything
  concrete comes from `translation.config.json`, the chosen specialization, and an optional target-
  project convention file (its own `CLAUDE.md` / i18n contract) that the panel reads when pointed at
  it.
- To use this against a project, either run `/translate --path <that project>` from here, or copy
  the `.claude/agents`, `.claude/skills`, and `specializations/` folders (plus a
  `translation.config.json`) into that project.
- These skills/agents are files on disk. To make them installable **account skills** in the Claude
  app, package a skill's folder as a `.skill` and save it from the delivered file (see the app's
  skill settings) — the on-disk copies here are the source of truth you edit.
