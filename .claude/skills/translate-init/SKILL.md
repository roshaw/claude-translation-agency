---
name: translate-init
description: Create a translation.config.json for a project — the setup step before /translate. Point it at a target project (a path or the current folder), and it detects the source language, the file formats present, and any existing target languages, asks for the target languages / domain specialization / output layout (pre-filling detected defaults), then writes a ready-to-use translation.config.json at that project's root. Use when the user says "set up translation for this project", "create the translation config", "initialize translation", "configure translations", or before a first /translate run on a project that has no config yet.
---

# translate-init

Scaffolds a `translation.config.json` at the **root of the project being translated** (the target
project — the folder holding the source files, where the `translations/` output lands), so the user
doesn't have to hand-write it. This is the setup counterpart to `/translate`: run it once per
project, then run `/translate`.

> **Placement is the whole point.** The file goes in the **target project**, not in the Translation
> Agency toolkit folder. If the user is pointing at `C:\Projects\MyApp`, the file is written to
> `C:\Projects\MyApp\translation.config.json`.

## Invocation

```
/translate-init                    # set up the current folder as the target project
/translate-init --path <dir>       # set up a specific project, e.g. --path C:\Projects\MyApp
/translate-init <path>             # shorthand for --path
```

## Step 0 — Resolve the target project root

`--path` / bare `<path>` → that folder. Else the current directory. Accept an absolute computer
path as given. This root is where the config will be written. If a `translation.config.json`
**already exists** there, read it, tell the user, and offer to update it (merge new answers) rather
than overwrite — never silently clobber an existing config.

## Step 1 — Detect (don't ask what you can infer)

Using `Glob`/`Grep`/`Read` (never shell loops), inspect the project and infer defaults:

- **Source language** — from the layout (`messages.en.ts`, `en/`, `-en.po`, `.en.md`) or a content
  sample. Default `en` if unclear.
- **Existing target languages** — every non-source language already present in an i18n tree / `.po`
  set / content tree. These become the default `targetLangs` (the user can add more).
- **Formats present** — JS/TS or JSON catalogs, WordPress gettext (`.pot`/`.po`), i18next/`.arb`,
  Markdown/MDX/HTML trees, subtitles, CSV, docs (see the format table in `/translate`). This informs
  `include` globs and whether to show the `wordpress` block.
- **A likely `include` set** — the directories where translatable files actually live (e.g.
  `src/i18n/**`, `content/**`, `languages/**`), rather than the whole repo.
- **A verify command** — if it's a JS/TS project with a `tsconfig`, suggest `npx tsc --noEmit`;
  otherwise leave empty.
- **WordPress text domain** — if `.pot`/`.po` are found, read the text domain from the filenames /
  headers.

Summarize what you detected in one short block before asking anything.

## Step 2 — Ask only what you can't infer (one AskUserQuestion round)

Pre-fill detected values as the default option. Ask for:

1. **Target languages** — confirm the detected set and/or add more (free-text codes accepted, e.g.
   `de, fr, pt-BR`, or WP form `de_DE`).
2. **Specialization** — `general` (default), `technical`, `marketing`, `legal`, or a custom module
   name. List the modules found in the toolkit's `specializations/` folder as the options.
3. **Output layout** — `tree` (default; copies to `translations/<lang>/…`, originals untouched),
   `inplace` (siblings `<name>.<lang>.<ext>`), or `catalog` (edit existing per-language files in
   place). Recommend `catalog` when an existing per-language i18n tree was detected, else `tree`.

If the session is unattended, skip the questions and use the detected defaults + `general` +
`tree`, and state the assumptions in the summary.

## Step 3 — Write the config

Write `translation.config.json` at the target project root. Include the resolved values and keep the
explanatory `$comment_*` keys (they're valid JSON and help the next human). Use the repo template as
the shape — set `projectPath` to `""` when the config lives inside the project it configures (it's
implied), or to the absolute path if the user prefers to keep the config elsewhere. Only enable the
`wordpress` block if gettext files were detected.

Set `include`/`exclude` to the detected surfaces (always add the output dir — `translations/**` — to
`exclude` so a re-run doesn't translate its own output).

## Step 3.5 — Register the project in the Translation Agency

Record the project in the toolkit's registry so future runs know it exists and carry memory about it:

1. Read `projects/registry.json`. If an entry with the same `path` exists, update it (don't
   duplicate); otherwise append a new entry with a kebab-case `slug` of the project name:
   ```json
   { "slug": "myapp", "name": "MyApp", "path": "<abs path>", "sourceLang": "<...>",
     "targetLangs": ["<...>"], "specialization": "<...>", "outputMode": "<...>",
     "status": "active", "addedAt": "<YYYY-MM-DD>", "lastRunAt": "", "notes": "projects/myapp/notes.md" }
   ```
   Get today's date from one `date` Bash call (don't invent it).
2. Create `projects/<slug>/notes.md` from `projects/_template/notes.md`, filling the Overview block
   with the resolved settings. If it already exists, leave it (don't overwrite accumulated memory).
3. Optionally create an empty `projects/<slug>/glossary.csv` if the user wants a project glossary,
   and point the config's `glossary` field at it.

See `projects/README.md` for the registry + memory contract.

## Step 4 — Offer the git-ignore additions

If the target is a git repo, offer to append the run markers to its `.gitignore`
(`.translate-last-review`, `.translate-report-*.json`, and — if the user doesn't want to commit
outputs — `translations/`). Don't edit `.gitignore` without confirming.

## Step 5 — Report + next step

Show the written config path, the registry entry added, and the `projects/<slug>/notes.md` created.
Give a compact summary of the settings, then the next step:
```
/translate --path <project root>
```
(or just `/translate` if they'll run it from inside the project). Mention that any setting can be
overridden per run with a flag without editing the file.

## Reference

- The config schema + placement rules: the repo's `translation.config.json` template and `CLAUDE.md`
  → Configuration.
- Specialization modules: `specializations/` (default `general`); how they work:
  `specializations/README.md`.
- The pass this sets up: `/translate` skill.
