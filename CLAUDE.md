# Translation Agency

**Version 0.2.0** · MIT licensed · [SemVer](https://semver.org) + [CHANGELOG.md](CHANGELOG.md)

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

Before the panel runs, an optional fourth agent — **Researcher** (`.claude/agents/translate-researcher.md`,
Sonnet) — works out the correct vocabulary for the material (per language) from the project's context
and a content sample, and writes a reusable glossary the panel translates against. See "Context &
terminology research" below.

## The skills

- **`/translate-init`** — `.claude/skills/translate-init/SKILL.md`. A **guided, step-by-step wizard**
  that builds `translation.config.json`: it detects what it can (source language, formats, existing
  languages), then walks you through each option one at a time with a plain-language explanation —
  including the project's **purpose/context**, target languages, specialization, output layout, and
  the research/uncertainty preferences — and registers the folder as a tracked project. Run once per
  project before the first translate.
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

## Context & terminology research

Two features make the translator pick the *right words* for the specific product, not generic
dictionary ones:

- **Context** (`config.context`) — a short description of what the product is, who it's for, and its
  register. This is the sense-disambiguator: it's what tells the translator that in a hotel-booking
  app "Book" means *reserve* (not the object) and "Register" means *sign up* (not a cash register).
  `/translate-init` asks for it; it's stored in the config and the project's `notes.md`, and passed
  to every agent on every run.
- **Terminology research** (`config.research`, the `translate-researcher` agent) — before translating,
  a research pass reads the context + a content sample, works out the correct term of art per target
  language (researching *in* the target language), and writes `projects/<slug>/glossary.csv`. The
  panel treats that glossary as the terminology authority. Default `first-run` researches once per
  language then reuses the glossary; `--research` forces a refresh; `always` re-researches every run;
  `off` disables it. You can hand-edit the glossary — research never overwrites human rows.

**Uncertainty is handled asynchronously** (`config.queries`, default `report`): when the translator is
genuinely unsure about a string, it makes a best guess *and* logs the question — its assumption and
what it needs to know — to `projects/<slug>/queries-<date>.md`, without interrupting the run. You
review that file whenever you want; answering (by editing the glossary or notes) settles it for next
time. `high-stakes` additionally asks interactively for a few legal/medical/financial terms; `off`
skips the queries file.

## Supported inputs & formats

Codebase i18n and standalone files alike:

- **Message catalogs** — JS/TS (`messages.<lang>.ts`), JSON / i18next / `.arb`, YAML, `.resx`, `.strings`.
- **WordPress / gettext** — `.pot` templates, `.po` catalogs (with `msgctxt`, plurals, `printf`
  args), and the Jed-format WP JSON; `.mo`/JSON compiled from the `.po` by the pipeline.
- **Content trees** — Markdown / MDX / HTML / XML / XLIFF (per-language mirrored files, with a
  `source_hash` staleness stamp).
- **Documents** — Markdown, `.docx`, `.txt`, subtitles (`.srt`/`.vtt`), CSV / spreadsheets.

## Where translations are written (output layout)

Set by `--out` / `config.output.mode` (see the README "Output modes" section for before/after trees):

- **`inplace`** *(default)* — writes each translation as a sibling next to its source, swapping the
  language code in the name (`en.json` → `de.json`) or appending one (`guide.md` → `guide.de.md`).
  Originals untouched.
- **`tree`** — copies every file into `<projectPath>/translations/<lang>/` (rewriting language codes
  in the path, so `src/i18n/en.json` → `translations/de/src/i18n/de.json`) and translates the copies;
  originals untouched. Use when you want the translations isolated from the source.
- **`catalog`** — edits the existing per-language files in place (`messages.<lang>.ts`, `de.json`,
  `.po`), for a codebase that already has a language layout.

When `--out` isn't given: `inplace`, unless a per-language catalog/tree already exists → then
`catalog`.

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
`context` (the product's purpose — inline or a `translation-context.md` path), `research`
(`first-run`|`always`|`off`), `queries` (`report`|`high-stakes`|`off`), `glossary`, `include`/`exclude`,
`output.mode`, `verifyCmd`/`buildCmd`, and a `wordpress` block (`textdomain`, `makeMo`, `makeJson`).
Command-line flags override the config for a single run.

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
├── VERSION                       # 0.2.0
├── .gitignore
├── translation.config.json      # default settings (source/target langs, specialization, output, formats)
├── .claude/
│   ├── agents/
│   │   ├── translate-lead.md       # Opus — orchestrator + adversarial QA (C1–C7)
│   │   ├── translate-senior.md     # Sonnet — domain-prose translator
│   │   ├── translate-junior.md     # Haiku — low-risk chrome translator
│   │   └── translate-researcher.md # Sonnet — terminology research → glossary
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
    └── <slug>/                   # created per project
        ├── notes.md              # per-project memory (purpose/context, decisions, run log)
        ├── glossary.csv          # run glossary (research pass writes; you can edit)
        └── queries-<date>.md     # async uncertainty log for your review
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
