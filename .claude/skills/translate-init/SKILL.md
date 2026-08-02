---
name: translate-init
description: Guided, step-by-step builder for a project's translation.config.json — the setup step before /translate. Walks the operator through every option ONE AT A TIME with a plain-language explanation of what it does and what to fill, pre-filling smart defaults it detects from the project (source language, formats, existing target languages). Captures the project's PURPOSE/CONTEXT (what the product is, so the translator picks the right sense of each word), the target languages, domain specialization, output layout, and the research/uncertainty preferences. Writes the config at the project's root and registers the folder as a tracked project. Use when the user says "set up translation for this project", "create the translation config", "configure translations", "initialize translation", "build the config step by step", or before a first /translate run on a project with no config.
---

# translate-init

A **guided wizard** that builds `translation.config.json` at the **root of the project being
translated** (the target project — the folder with the source files) and registers that folder as a
tracked project. It asks about each option one step at a time, explaining what the option does and
what to put, and pre-fills what it can detect. Run it once per project, then run `/translate`.

> **Placement is the whole point.** The file goes in the **target project**, not in the Translation
> Agency toolkit folder. Pointing at `C:\Projects\MyApp` writes `C:\Projects\MyApp\translation.config.json`.

## Invocation

```
/translate-init                    # set up the current folder as the target project
/translate-init --path <dir>       # set up a specific project, e.g. --path C:\Projects\MyApp
/translate-init <path>             # shorthand for --path
```

## Step 0 — Resolve the target project root

`--path` / bare `<path>` → that folder; else the current directory (accept an absolute computer path
as given). This root is where the config is written. If a `translation.config.json` **already
exists**, read it and offer to update it (its current values become the defaults) — never silently
clobber.

## Step 1 — Detect, so defaults are pre-filled (don't ask what you can infer)

Using `Glob`/`Grep`/`Read` (never shell loops), infer: **source language** (`messages.en.ts`, `en/`,
`.en.md`, `-en.po`, or a content sample; default `en`); **existing target languages** already present;
**formats** present (JS/TS or JSON catalogs, WordPress `.pot`/`.po`, i18next/`.arb`, MD/MDX/HTML
trees, subtitles, CSV); a likely **`include`** set (where translatable files actually live); a
**verify command** (`npx tsc --noEmit` if there's a `tsconfig`); and any **WordPress text domain**.
Print a short "here's what I found" summary before asking anything.

## Step 2 — Walk the operator through each option (the guided part)

Ask about the settings **one at a time**, each with a one-line explanation of what it controls and
what to enter, and the detected value pre-filled as the default. Use AskUserQuestion (batching a few
related ones per screen is fine), but always include the explanation so the operator understands the
choice. If the session is unattended, skip the prompts, use detected defaults + `general` +
`inplace` + `first-run` research + `report` queries, and state the assumptions.

Cover, in order:

1. **Project purpose / context** — *"In one or two sentences, what is this product and who is it
   for? This is the single most useful thing you can give the translator: it decides the right sense
   of ambiguous words. e.g. 'A hotel-booking web app for travelers' tells the translator that 'Book'
   means reserve, not a physical book; 'Register' means sign up, not a cash register."* Free text.
   If they give a lot, offer to save it as a `translation-context.md` in the project and point the
   config `context` at that file; otherwise store the sentence inline in `context`.
1b. **Do-not-translate rules** — *"Anything that looks like copy but should be left exactly as-is?
   The panel already keeps numbers, code, URLs, and citations verbatim — this is for project-specific
   pass-through only: e.g. 'colour/hex codes and size tokens like `42x2` are data, not copy', 'raw
   handwritten-text field values are pass-through', 'keep placeholders `{name}`, `{id}`, `{remote}`
   intact'. One plain rule per line; leave empty if none."* Free text → `doNotTranslate` array. Skip
   for an unattended run (default `[]`).
2. **Target languages** — *"Which languages should we translate INTO? Use language codes like `de`,
   `fr`, `pt-BR`, or WordPress form `de_DE`."* Default = detected set; free-text to add.
2b. **Formality (register)** — *"Many languages force a formal-or-informal way of addressing the
   reader — German du/Sie, French tu/vous, Spanish tú/usted, Japanese politeness levels. How should
   the translator address the reader?"* Options: `auto` (default — *"use each language's conventional
   register for this kind of product; leave it to the translator"*), `formal` (*"polite/formal
   address everywhere — Sie, vous, usted"*), `informal` (*"familiar/casual address everywhere — du,
   tu, tú"*). Offer answering **once for all languages** (writes a single string), or **per language**
   if they want different registers for different targets (writes an object like
   `{ "default": "formal", "de": "informal" }`). For languages with no T–V distinction (e.g.
   English) this just nudges overall tone. Skip for an unattended run (default `"auto"`).
3. **Source language** — *"What language is the original content in?"* Default = detected; only ask
   if detection was unsure.
4. **Domain specialization** — *"Which domain profile should the translator use? It sets the
   terminology, what stays verbatim, and the tone."* Options = the modules in the toolkit's
   `specializations/` folder (`general` default, `technical`, `marketing`, `legal`, + any custom),
   each with its one-line purpose.
5. **Output layout** — *"Where should translated files go?"* Options with plain explanations:
   `inplace` (default — *"a sibling next to each source, e.g. `en.json` → `de.json`; originals
   untouched"*), `tree` (*"copies into a `translations/<lang>/` folder per language; originals
   untouched"*), `catalog` (*"edit the existing per-language files in place — pick this if the
   project already has `de.json`/`messages.de.ts`"*). Recommend `catalog` if an existing per-language
   layout was detected, else `inplace`.
6. **Terminology research** — *"Before translating, should a research pass work out the correct
   vocabulary for your material (per language) and save a reusable glossary?"* Options: `first-run`
   (default — *"research once per language, then reuse the glossary; refresh anytime with
   `--research`"*), `always` (*"re-research every run — highest quality, higher cost"*), `off`.
7. **Uncertainty handling** — *"When the translator is genuinely unsure about a string, what should
   it do?"* Options: `report` (default — *"never interrupts you: it makes a best guess and logs the
   uncertainty to a queries file you review whenever you want"*), `high-stakes` (*"also ask you
   directly for a few legal/medical/financial terms"*), `off` (*"best guess, no queries file"*).
8. **Verify / build commands** — *"Any command to check the translated files compile (run per batch),
   or to build once at the end?"* Default = detected verify, empty build. Optional.

## Step 3 — Write the config

Write `translation.config.json` at the project root, using the repo template's shape and keeping the
explanatory `$comment_*` keys. Fill: `sourceLang`, `targetLangs`, `specialization`, `context` (inline
or the `translation-context.md` path), `formality` (the string `"auto"`/`"formal"`/`"informal"`, or a
per-language object if they chose that), `doNotTranslate` (the pass-through rules, or `[]`), `research`,
`queries`, `output.mode`, `include`/`exclude`
(always add the output dir + `translations/**` to `exclude`), `verifyCmd`/`buildCmd`, and the
`wordpress` block only if gettext files were detected. Leave `projectPath` `""` (the config lives in
the project it configures). Point `glossary` at `projects/<slug>/glossary.csv` (the research pass
fills it).

## Step 3.5 — Register the project in the Translation Agency

So `/translate` can list and remember it:

1. In the toolkit's `projects/registry.json`, add (or update, matching by `path`) an entry. **The
   registry and the per-project folders are git-ignored (local only)** — if `projects/registry.json`
   doesn't exist yet (fresh checkout), create it first as `{ "version": 1, "projects": [] }`, then add:
   ```json
   { "slug": "myapp", "name": "MyApp", "path": "<abs path>", "sourceLang": "<...>",
     "targetLangs": ["<...>"], "specialization": "<...>", "outputMode": "<...>",
     "status": "active", "addedAt": "<YYYY-MM-DD>", "lastRunAt": "", "notes": "projects/myapp/notes.md" }
   ```
   Get the date from one `date` Bash call (don't invent it).
2. Create `projects/<slug>/notes.md` from `projects/_template/notes.md`, filling the Overview +
   **Purpose / context** with what the operator gave. If it already exists, leave it.
3. Create an empty `projects/<slug>/glossary.csv` with the header
   `source,lang,term,context,confidence,source,notes` so the first research pass has somewhere to write.

See `projects/README.md` for the registry + memory contract.

## Step 4 — Offer the git-ignore additions

If the target is a git repo, offer to append `.translate-last-review`, `.translate-report-*.json`
(and, if they don't want to commit outputs, `translations/`) to its `.gitignore`. Confirm first.

## Step 5 — Report + next step

Show the config path, the context captured, the registry entry, and `projects/<slug>/notes.md`. Give
a compact settings summary, then:
```
/translate --path <project root>
```
(or just `/translate` from inside the project). Note that any setting is overridable per run with a
flag, and that the first run will auto-research terminology (if `research: first-run`) and write the
glossary.

## Reference

- Config schema + placement: `translation.config.json` template and `CLAUDE.md` → Configuration.
- Specializations: `specializations/` (default `general`); `specializations/README.md`.
- Research agent: `.claude/agents/translate-researcher.md`. Registry/memory: `projects/README.md`.
- The pass this sets up: `/translate`.
