---
name: translate
description: Translate any project or set of files into one or more target languages using the three-tier translator panel (Lead → Senior/Junior with adversarial QA). Works on codebases (i18n message catalogs, WordPress .po/.pot/.json, MDX/HTML content trees) and standalone documents (Markdown, JSON, docx, txt, subtitles, CSV). Detects the source language and file formats, computes the translation scope (whole project, changed-since-last-run, or an explicit file/glob set), classifies each batch as low-risk (Junior) or domain-prose (Senior), and applies the domain SPECIALIZATION setting (default `general`; e.g. technical, marketing, legal). Runs one final verify/build at the end and writes a report. Use when the user says "translate this", "translate into <language>", "localize the project", "run the translation pass", "translate the WordPress strings", "translate these files", or "i18n sweep".
---

# translate

The single entry point for translating **anything** — a whole codebase's i18n, a WordPress
theme/plugin's gettext catalog, a folder of Markdown docs, a batch of JSON files, a subtitle
file — into **any** set of target languages. It drives the three-tier translator panel and
applies a domain **specialization** so terminology is right for the material.

## The panel (why three tiers)

- **Lead** (`translate-lead`, Opus) — orchestrates the run, dispatches each batch to a worker,
  and **adversarially reviews** every result against a fixed C1–C7 checklist before signing off.
  Runs the final blind-spot sweeps. Loads the specialization module so its terminology check is
  domain-aware.
- **Senior** (`translate-senior`, Sonnet) — translates domain-prose and any substantive surface.
  Spawned by the Lead, not directly by this skill.
- **Junior** (`translate-junior`, Haiku) — translates only low-risk UI chrome. Spawned by the Lead.

This skill computes the scope + per-batch tier classification, then spawns the **Lead once**; the
Lead handles all worker spawns and reviews. The single final build/verify runs here (Step 6).

## Invocation

```
/translate                         # translate the changed-since-last-run set into the configured targets
/translate --path <dir>            # point at a project/folder on disk, e.g. --path C:\Projects\MyApp
/translate <path>                  # shorthand for --path <path> (a folder) or --files <path> (a file/glob)
/translate --to <langs>            # e.g. --to de,fr,pt-BR  (overrides configured targets for this run)
/translate --from <lang>           # override the detected/configured source language
/translate --domain <name>         # specialization: general | technical | marketing | legal | <custom> (default from config, else general)
/translate --formality <f>         # register for the whole run: formal | informal | auto (overrides config.formality; default auto)
/translate --files <glob|paths>    # translate an explicit set (a folder, a glob, named files)
/translate --out <mode>            # output layout: inplace (default) | tree | catalog  (see Step 0.5)
/translate --full                  # translate the ENTIRE translatable surface, not just the diff
```

Arguments compose: `/translate --path C:\Projects\MyApp --to de,fr --domain technical`.

### Settings & the specialization setting

Configuration is resolved in this order (later wins):
1. `translation.config.json` at the project root (defaults — see below).
2. Any target-project convention file it points to.
3. Flags on this invocation.

`translation.config.json` (all fields optional):
```json
{
  "sourceLang": "en",
  "targetLangs": ["de", "fr", "es"],
  "specialization": "general",
  "formality": "auto",
  "glossary": "glossary.csv",
  "doNotTranslate": ["Colour/hex codes and size tokens like 42x2 are pass-through data — leave verbatim.", "Keep placeholders {name}, {id}, {remote} intact."],
  "include": ["src/i18n/**", "content/**", "languages/**"],
  "exclude": ["**/node_modules/**", "**/*.min.*"],
  "verifyCmd": "npx tsc --noEmit",
  "buildCmd": "",
  "creditInCommit": false,
  "wordpress": { "textdomain": "", "makeJson": false, "makeMo": false }
}
```

**Specialization is a per-run setting, not a hardcoded domain.** If the user names one
(`--domain technical`), use it. Otherwise use `translation.config.json → specialization`.
Otherwise default to **`general`**. The chosen module lives at `specializations/<name>.md` and is
passed to the Lead + Senior so their terminology (C2) and framing (C6) checks match the material.
If `--domain <name>` names a module that doesn't exist, list the available modules and ask which to
use (or offer to run `general`).

## What this skill does NOT do

- **Push, or touch a protected branch.** It stages/edits files and (optionally) commits to the
  working branch; pushing and any deploy stay human.
- **Change source facts or add features.** The panel translates/repairs copy only — it never adds
  keys/components/logic, and never edits numbers, dates, names, or citations. A string missing
  because a *key* is missing is an implementation bug — flag it, don't paper over it.
- **Add a brand-new UI locale to a codebase from scratch.** That's the sibling `/translate-add-locale` skill
  (scaffold the language wiring), which then hands off here for the real translation.

---

## Bash discipline (HARD RULES — every step)

1. **Each command is its own Bash call.** Never chain with `&&`/`;`/`||`, never pipe with `|`,
   never `cd <dir> && …`, never cosmetic `echo` separators. Independent calls run in parallel in
   one message.
2. **No shell for output processing or control flow.** No `python -c`/`awk`/`jq`/`sed` pipelines,
   no `> /tmp/file && parse-back`, no heredocs for logic, no shell loops/branches. Iterate and
   branch in context — `Glob`/`Grep`/`Read` once, walk the result in your head. To check "does
   `<lang>/<file>` exist for every language?" → ONE `Glob` call; compare against the language set.
3. **File searches/counts use `Grep`/`Glob`**, never `grep | wc`, `ls | grep`, `find | head`,
   `git … | grep -c`.

The one legitimate `&&` is a HEREDOC commit at Step 7 (`git commit -m "$(cat <<'EOF' … EOF)"`) — a
single command with quoted content, not a chain.

---

## Step 0 — Preflight

1. **Locate the project root.** Resolve in this order:
   a. `--path <dir>` / a bare `<path>` argument (an absolute computer path like `C:\Projects\MyApp`
      is fine — accept it as given).
   b. Else, if the current folder has a `translation.config.json`, use the current folder.
   c. Else **offer a project picker** from the registry: read the toolkit's `projects/registry.json`
      (git-ignored/local — treat a **missing** file the same as an empty one).
      If it lists projects, AskUserQuestion "Which project should I translate?" with each registered
      project as an option (label = name, description = path + langs + last run), plus an "Other
      (enter a path)" path. If exactly one project is registered, offer it as the default. If the
      registry is empty, ask for a path, or suggest running `/translate-init` first to set one up.
   All scope globs (`include`/`exclude`, `--files`) are relative to the chosen root. Read that root's
   `translation.config.json`; if none exists, detect below and offer to write a starter config (or to
   run `/translate-init`) at the end.
1b. **Load project memory.** Read the toolkit's `projects/registry.json` and find the entry whose
   `path` matches this project root. If found, read its `projects/<slug>/notes.md` — the terminology
   decisions, do-not-translate list, format quirks, and "what done means here" are run context; pass
   the relevant parts to the Lead in its brief (as `project_conventions` alongside any in-project
   contract). **Collect the do-not-translate rules** from `config.doNotTranslate` plus any
   do-not-translate items in `notes.md`, and pass the merged list to the Lead as `do_not_translate`
   (the brief field in Step 3) — these are the manual pass-through/verbatim instructions the panel
   enforces. If there's **no** registry entry, note it — you'll offer to register the project at the
   end (Step 9), and continue this run using config + flags. (Setup via `/translate-init` is the
   normal way to register, but a `/translate` run on an unregistered project still works.)
2. **If the root is a git repo AND output mode is `inplace` (the default) or `catalog`:** these
   write into the working tree, so note the branch and any uncommitted changes (`git -C <root> status
   --porcelain`, one call). If dirty, list the files and ask whether to proceed, stash, or abort — so
   staging by name at Step 7 doesn't entangle unrelated WIP. A clean tree needs no prompt.
3. **Output mode `tree`** writes into a fresh `translations/<lang>/` subtree and never edits
   originals, so it needs no dirty-tree prompt even in a git repo. Plain non-git folders skip git
   entirely.

## Step 0.5 — Resolve the output layout

Resolve `--out`, else `config.output.mode`, else default **`inplace`**:

- **`inplace`** (default): write each translation as a sibling next to its source. If the source
  filename encodes the source language, **swap that code** for the target (`en.json` → `de.json`,
  `messages.en.ts` → `messages.de.ts`, in the same folder); otherwise append the code before the
  extension (`guide.md` → `guide.de.md`). Originals are never overwritten (the target is a different
  filename). Good for document and catalog sets where each language file lives beside its source.
- **`tree`** (the right choice when you want translated copies isolated from the originals): for each
  target language, **copy** every in-scope source file to
  `<root>/<config.output.dir>/<lang>/<relative-path>` (default dir `translations`, so
  `<root>/translations/de/…`), then translate the **copy in place**. Originals are never touched.
  Always add `<dir>/**` to `exclude` so a re-run doesn't translate its own output. Do the copy with
  `Read`+`Write` (or a single `cp` Bash call per file — no chaining); create parent dirs as needed.
  The Lead/Senior then edit the copied files.
  - **Rewrite the source-language code in the path to the target language** as you copy — otherwise
    you'd leave `en.json` sitting inside a `de/` folder. Rewrite an exact language-code **filename
    stem/suffix** and an exact **path segment**, only where it stands alone as the language code
    (never inside another word like `content` or `engine`):
    - `en.json` → `de.json`; `messages.en.ts` → `messages.de.ts`; `guide.en.md` → `guide.de.md`
    - a `…/en/…` path segment → `…/de/…` (e.g. `content/en/home.md` → `content/de/home.md`)
    - `strings-en.xml` / `app-en.strings` → `strings-de.xml` / `app-de.strings`
    - WordPress: `<textdomain>-en_US.po` → `<textdomain>-de_DE.po` (use the target's WP locale form)
    A file whose name carries **no** language code (e.g. `guide.md`, `README.md`) keeps its name —
    the parent `<lang>/` folder already marks the language. Record, per copied file, both the target
    path (renamed) and the source path it came from, so the workers read the source and write the
    renamed copy.
- **`catalog`**: for an existing i18n message-catalog project, edit the per-language files that
  already exist (`messages.<lang>.ts`, `locales/<lang>.json`, `languages/<textdomain>-<locale>.po`)
  in place — fill missing keys, fix leftovers, correct terminology; don't create copies. This is the
  mode for a codebase whose language files are already wired into the build.

When `--out` isn't given, use `config.output.mode`, else the default **`inplace`** — with one
smart exception: if the project **already has a per-language catalog/tree** (e.g. `de.json` already
sits next to `en.json`, or `messages.de.ts` exists), prefer **`catalog`** so you edit the real files
the build uses instead of writing `de.de.json` siblings. State which mode you chose in Step 9.

## Step 1 — Detect source language, formats, and the translatable surface

Use `Glob`/`Grep`/`Read` (never shell loops). Determine:

- **Source language.** From config `sourceLang`, else `--from`, else infer from the file layout
  (`messages.en.ts`, `en/`, `-en.po`, `.en.md`) or a quick content sample. Confirm via
  AskUserQuestion only if genuinely ambiguous.
- **Target languages.** From `--to`, else config `targetLangs`, else (for an existing i18n tree)
  every non-source language already present, else ask.
- **Formats present**, and how each fans out:

  | Format | Detect | Fan-out shape |
  |---|---|---|
  | JS/TS message catalog | `messages.<lang>.ts`, `locales/<lang>.json` | one file per language, mirrored keys |
  | JSON / `.arb` / i18next | `<lang>.json`, `translation.json` | one file per language |
  | **WordPress gettext** | `languages/*.pot`, `*-<locale>.po` | `.pot` template → one `<textdomain>-<locale>.po` per language |
  | **WordPress JSON** | `*-<locale>-<md5>.json` | regenerated from the `.po` (see Step 6) |
  | `.po` / `.pot` (generic gettext) | `*.po`, `*.pot` | one `.po` per language from the `.pot` |
  | Markdown / MDX tree | `content/en/**`, `*.en.md` | one file per language, mirrored path |
  | HTML / XML / XLIFF | `*.html`, `*.xlf` | `<target>` filled per language |
  | Subtitles | `*.srt`, `*.vtt` | one file per language |
  | Spreadsheet / CSV | `*.csv`, `*.xlsx` | designated text columns per language |
  | Standalone docs | `*.md`, `*.docx`, `*.txt` | one output file per language |

  Record the detected formats; the Lead/Senior apply the matching file-format rules.

- **Scope:**
  - `--full` → the entire translatable surface: **every target language × every translatable
    file.** Never silently narrow it to one language/file. This is the expensive, from-scratch or
    drift-catching case.
  - `--files`/`<path>` → exactly that set (× the target languages).
  - **Default (incremental)** → what changed since the last run. In a git repo, that's
    `<marker>..HEAD` committed *and* uncommitted, where the marker is the untracked file
    `.translate-last-review` at the project root (`git -C <repo> diff --name-only <base>` +
    `git -C <repo> ls-files --others --exclude-standard`, two parallel calls). No marker (first
    run) or stale SHA → default the base to `HEAD` (review only uncommitted work); if the tree is
    also clean, tell the user and offer `--full` or a base ref. For non-git sets, "incremental"
    isn't available — translate `--files`/whole folder.
  - **Fan-out completeness (don't rely on the diff alone).** For mirrored-tree formats (Markdown/
    MDX/HTML/`.po`), a plain diff only surfaces a *changed source*. Adding a new target language
    changes no existing source file, so also include every `(language, file)` where the source
    exists but the target is **missing or carries a stale `source_hash`**. Derive this with one
    `Glob` per format and compare the returned target list against the language set in context.
    This is what makes a run after `/translate-add-locale` fill the new language's whole existing page set.

- **If the translatable set is empty** (nothing changed, or only non-translatable files): say so in
  one line, skip the panel and the commit, and still advance the marker (Step 8) so this range
  isn't re-scanned.

## Step 2 — Order into batches and classify each tier

Split the translatable set into ordered batches of **at most 3 files each**, one target language
per batch. **In `tree` and `inplace` modes the batch's files are the renamed target paths the skill pre-created**
(the copy under `translations/<lang>/…` for `tree`, or the sibling next to the source for `inplace`),
with the matching source path recorded so the worker reads the source and overwrites the copy. In
`catalog` mode the files are the existing per-language files. Order deterministically (by format,
then path) so a restart is reproducible. A
fan-out source (an MDX/HTML/`.po` template that produces one output per language) counts as **one
batch item per (source, language)** — never split one source's languages across batches
arbitrarily; keep a source's set together where practical.

Classify each batch's `suggested_tier`:
- **Domain-prose surfaces** (documents, marketing/legal/medical copy, MDX/HTML bodies, message
  values with substantive strings) → **Senior**.
- **Message-catalog batches** → inspect the diff. If every touched entry is pure chrome (nav,
  footer, buttons, generic errors, format fields) with no domain term / citation / identity token →
  **Junior**. Otherwise → **Senior**. A brand-new/entirely-untranslated file → **Senior** regardless.
- Fail-safe: anything ambiguous → **Senior**.

## Step 2.5 — Terminology research (conditional)

Decide whether to run the `translate-researcher` before translating. Run it when **any** holds:
- `--research` was passed (force a refresh), OR
- `config.research` is `always`, OR
- `config.research` is `first-run` (default) AND this project/target-language pair has **no glossary
  yet** (no `projects/<slug>/glossary.csv`, or it lacks rows for a target language in scope).

Skip it when `config.research` is `off`, or when `first-run` and a glossary already covers every
target language (reuse the saved glossary — research is a once-per-language cost, not per-run).

When running it, spawn ONE `translate-researcher` (Agent tool) with a brief: `project_root`, `slug`,
the `context` (from `config.context` — inline text or the contents of the file it points to),
`source_lang`, `target_langs`, `specialization_path`, `glossary_path` (`projects/<slug>/glossary.csv`),
`queries_path` (`projects/<slug>/queries-<date>.md`), a **content_sample** (you pick the high-signal
files — headings, catalogs, nav/labels — not the whole surface), and `formats`. It writes/merges the
glossary and logs low-confidence terms to the queries file, then returns a summary. Pass the resulting
`glossary_path` to the Lead in Step 3. If the researcher can't resolve a language at all, note it and
continue — the panel still runs against the specialization.

## Step 3 — Spawn the Lead once

```
Agent({ subagent_type: "translate-lead", prompt: <brief> })
```

Brief:
```
run_id: <e.g. tr-2026-07-31-1>
mode: incremental | full | files
project_root: <absolute path, e.g. C:\Projects\MyApp>
output_mode: tree | inplace | catalog
output_dir: translations            # for tree mode
source_lang: <lang>
target_langs: [<...>]
specialization: <name>
specialization_path: specializations/<name>.md
context: <config.context — inline text or the contents of translation-context.md; the product's
          purpose/audience/register, so the panel picks the right sense of each word>
formality: { <lang>: formal | informal | auto, ... }   # resolved PER target language (see below)
do_not_translate: [<config.doNotTranslate rules, verbatim — the manual pass-through/verbatim
          instructions the panel must treat as absolute and add to the C1/C3 exempt list>]
glossary_path: projects/<slug>/glossary.csv    # the research pass's output (or config.glossary)
queries_mode: report | high-stakes | off       # from config.queries (default report)
queries_path: projects/<slug>/queries-<date>.md
project_conventions: <target project's CLAUDE.md / i18n contract path, or "">
verify_cmd: <config.verifyCmd or "">
batch_list:
  - id: B1
    files: [<target path to edit — the copy in tree mode>]
    source_files: [<the source path to read from>]   # tree/inplace: differs from files
    target_lang: <lang>
    suggested_tier: Junior | Senior
    diff_keys_touched: [<...>]   # for incremental code batches
  - ...
report_path: .translate-report-<run_id>.json
```

**Resolve `formality` per target language before building the brief.** For each target language,
pick its register in this order (later wins): the `--formality <formal|informal|auto>` flag (global —
applies to every language this run) → `config.formality` (if it's a string, that value for every
language; if it's an object, `config.formality[<lang>]`, else `config.formality.default`, else
`auto`) → `auto`. Pass the result as the `formality` map in the brief (one entry per target
language). `auto` — the default and the meaning when the field is absent — tells the panel to use the
language's conventional register for this product/context (today's behavior), so an absent/`auto`
setting changes nothing. Where a language has no T–V distinction (e.g. English), `formal`/`informal`
is interpreted as overall tone, never a forced construct.

(In `tree`/`inplace` mode you copy each source file to its **renamed** target path **before** spawning
the Lead, so `files` already exist as source-language copies for the workers to overwrite. In
`catalog` mode `files` and `source_files` are the existing per-language and source-language catalog
files.)

The Lead confirms/overrides each tier, spawns the workers, reviews against C1–C7, inline-fixes
small correction sets (returns large ones to Senior, cycle-cap 2), runs the final sweeps, writes
`report_path`, and returns. You do **not** drive batch-by-batch or spawn Senior/Junior yourself.

## Step 4 — Watchdog

- Lead returns successfully → Step 5.
- Lead surfaces `NEEDS ATTENTION` (a worker pool was unavailable across retries) → STOP, do not
  commit, do not advance the marker, surface to the user.
- The Lead spawn itself dies (API overload) → respawn once with the same brief; dies again → STOP
  and surface.

## Step 5 — Read the Lead's report

- `i18n OK` / `i18n OK — N corrections applied` → Step 6.
- `i18n NEEDS ATTENTION` → STOP. Print the open questions; do not commit; leave the marker unadvanced.

## Step 6 — Final verify / build (this skill owns it — runs once)

- If `verifyCmd` is set, the workers already ran it per batch and the Lead confirmed it stayed
  green — **trust the report** for that; don't re-run it per file.
- Run the project's `buildCmd` once if set (e.g. `npm run build`) as one Bash call — must exit clean.
- **WordPress post-processing** (if `wordpress.makeMo` / `wordpress.makeJson`): after the `.po`
  files are translated, compile artifacts as single Bash calls — `wp i18n make-mo languages` (or
  `msgfmt`) for `.mo`, `wp i18n make-json languages --no-purge` for the JS/Gutenberg JSON. If WP-CLI
  isn't available, say so and deliver the `.po` files (the user can compile on their side).
- For standalone-document runs, "build" = whatever produces the deliverable (e.g. render the
  translated Markdown to `.docx` via the docx skill if the user asked for that format).
- **STOP and surface, do not commit, if** the report flags a broken source file, a suspicious
  number/date, an inline hard-coded string that should be a key, or any open question that hit the
  cycle cap. Those go back to the user; the marker stays put.

## Step 6.5 — Completeness done-gate (runs every pass)

Before finishing, positively confirm coverage — don't assume it. For each target language, verify
every translatable file that has a source counterpart now exists and is not byte-identical
placeholder. For mirrored-tree/`.po` formats, one `Glob` per format compared against the language
set catches missing target files; for catalogs, the Lead's leftover sweep covers placeholders.
- **`--full`** → any incomplete `(language, file)` is IN SCOPE: build it into more batches and loop
  Step 3→6 until clean, or report `NEEDS ATTENTION` with the exact missing list (and don't advance
  the marker). A `--full` run must never finish with a silent gap.
- **Incremental/`--files`** → legitimately scoped; don't block on out-of-scope gaps, but **surface
  every still-incomplete language prominently** in the Step 9 report (e.g. `⚠ Still partial (not in
  this run's scope): pt-BR — 12 content files missing. Run /translate --full to clear.`).

## Step 7 — Commit or deliver

The translated files are already written on disk (in `tree` mode under
`<root>/translations/<lang>/…`; in `inplace`/`catalog` mode at their target paths). Then:

- **`tree` mode** (the point-at-a-path case): the output subtree is the deliverable. Tell the user
  where it is (`<root>/translations/<lang>/`). If the root is a git repo and the user wants it
  tracked, offer to stage the `translations/` subtree by name and commit (never `git add -A`); it's
  a fresh subtree so it won't entangle WIP. If the session reached this project over the device
  bridge, the files were written on the user's disk directly (device paths) — confirm the location;
  otherwise deliver key outputs via SendUserFile.
- **`inplace` / `catalog` mode in a git repo, files changed:** show `git -C <root> status` and
  `git -C <root> diff` (two parallel calls). **Stage by name — never `git add -A`/`.`** — only the
  files the panel wrote (the report lists them; skip pre-existing WIP the user excluded). Commit with
  a HEREDOC, repo-conventional message (scope `i18n` or the dominant language code). **If
  `config.creditInCommit` is `true`**, append an attribution trailer as the last line of the commit
  message: `Translated-with: Translation Agency <version> (https://github.com/roshaw/claude-translation-agency)`
  (read `<version>` from the toolkit's `VERSION` file). If `creditInCommit` is falsy (the default),
  add **no** trailer. Never write attribution into the translated files themselves. Pre-commit hook
  fails → fix the cause, re-stage, NEW commit — never `--amend`/`--no-verify`. Do NOT push.
- **Non-git set:** the outputs are on disk; deliver each via SendUserFile so the user can download them.

## Step 8 — Advance the marker (git incremental runs)

After a successful commit (or a no-op pass), write the current HEAD to `.translate-last-review` at
the project root so the next run starts clean:
```bash
git -C <repo> rev-parse HEAD
```
(then `printf 'commit=%s\nreviewed=%s\n' <sha> <iso-date> > <repo>/.translate-last-review` as one
call). Do NOT advance if the run blocked (Step 6 STOP) or a `--full` run left a language incomplete
(Step 6.5 NEEDS ATTENTION). Add `.translate-last-review` and `.translate-report-*.json` to the
project's ignore file if not already ignored.

## Step 8.5 — Update project memory

Maintain the toolkit's registry + per-project memory so the next run benefits:
- In `projects/registry.json` (git-ignored/local — create it as `{ "version": 1, "projects": [] }`
  if missing), set the project's `lastRunAt` to today (`date` Bash call) and adjust `status` if it
  changed. If the project had **no** entry, offer to add one now (same shape as `/translate-init`
  Step 3.5) and create `projects/<slug>/notes.md` from the template.
- Append one line to the top of the `notes.md` **Run log**: `<date> — <scope> → <verdict>
  (<languages>, <n> fixes)`. If the run made a durable decision (a terminology call, a new
  do-not-translate item, a format quirk discovered), add it to the relevant notes section — keep it
  to decisions, not a transcript.
Skip only if the user explicitly asked not to use project memory.

## Step 9 — Report

Print a tight summary from the Lead's report + gates + commit:
- **Verdict**, **Specialization** used, **Source → Targets**, **Scope** (base→HEAD / full / files, N files).
- **Panel routing**: K Junior / M Senior batches; any tier overrides the Lead applied.
- **Per-batch outcomes** (condensed): ACCEPTED / ACCEPTED WITH N INLINE FIXES / RETURNED+re-reviewed / OPEN QUESTION.
- **Sweeps** S1/S2/S3 totals (or n-a for plain text).
- **Flags by category** C1–C7 + S1–S3.
- **Completeness gate** (MANDATORY line, even on a clean run — state "all target languages complete"
  positively, or `⚠ Still partial: <lang> — <what's missing>`).
- **Terminology research**: ran (N terms — X high / Y medium / Z low confidence) / reused saved
  glossary / skipped (state which). Glossary: `projects/<slug>/glossary.csv`.
- **Queries (async, non-blocking)**: N items logged to `projects/<slug>/queries-<date>.md` for your
  review whenever you want — or "none". Never block the run on these.
- **Open questions** to the user (cycle-capped residuals, broken source, suspicious data).
- **Gates**: verify / build result.
- **Commit** `<hash> <subject>` (not pushed) or "delivered N files" / "no changes".
- **Marker** advanced/left.

Always end the report with these two footer lines, verbatim:
1. **Attribution (always present, every run — not configurable):**
   `Translated with Translation Agency <version> — https://github.com/roshaw/claude-translation-agency`
   (read `<version>` from the toolkit's `VERSION` file). This credits the tool in the operator-facing
   report only; it is independent of `config.creditInCommit`, which controls whether the same credit
   also appears as a commit trailer (Step 7).
2. **Disclaimer** (point-of-use reminder, not optional): `⚠ AI-generated translation — review before
   publishing; human sign-off recommended for legal/medical/financial/safety-critical content.` If the
   run's specialization is a high-stakes / safety-critical domain — `legal`, `banking`, or `medical`,
   or any custom module of comparable stakes (health, financial, legal, safety) — make it a full
   sentence and bold it, since the stakes are higher.

## Reference

- Panel: `.claude/agents/translate-lead.md` (Lead), `translate-senior.md` (Senior),
  `translate-junior.md` (Junior). Terminology research: `translate-researcher.md`.
- Per-project glossary + queries: `projects/<slug>/glossary.csv`, `projects/<slug>/queries-<date>.md`.
- Specializations: `specializations/<name>.md` (default `general.md`); how they work:
  `specializations/README.md`.
- Config: `translation.config.json` (source/target langs, specialization, formats, verify/build).
- Siblings: `/translate-init` (generate a project's config + register it), `/translate-add-locale` (scaffold a
  brand-new UI language into a codebase, then hand off here), `/translate-audit` (read-only coverage
  audit — which languages are missing what, and how to fix it).
- Projects registry + per-project memory: `projects/registry.json`, `projects/<slug>/notes.md`
  (contract in `projects/README.md`).
- Marker (untracked, per-machine): `.translate-last-review`.
