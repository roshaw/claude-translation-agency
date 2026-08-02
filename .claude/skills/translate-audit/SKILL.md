---
name: translate-audit
description: Read-only COVERAGE audit across every existing language of a project — finds where translations are missing or incomplete and reports them per language, without changing anything. Builds the union of all keys/strings/pages present across all locales (including the source), then for each language lists what it is missing, which other languages DO have it, and how to fix it. Catches four gap classes: (1) a key present in some languages but absent in another target, (2) a key present in translations but MISSING FROM THE SOURCE language (an orphan / source gap the translator can't auto-fill), (3) present-but-empty values, and (4) present-but-untranslated leftovers (target value byte-identical to the source). Works on message catalogs (JSON/TS/.arb/YAML/.resx/.strings), gettext (.po/.pot), and mirrored content trees (MD/MDX/HTML), including per-language file coverage and stale source_hash. Produces a coverage matrix + a fix plan and points at /translate to close the gaps. Use when the user says "check for missing translations", "which languages are incomplete", "translation coverage", "audit the translations", "compare the languages", "what's missing in <lang>", "find untranslated strings", or "are all languages complete". Does NOT translate or edit any file — that is /translate.
---

# translate-audit

A **read-only completeness audit** for a multi-language project. It answers, per language, three
questions:

1. **What is missing?** — every key/string/page that exists somewhere in the project but not in this
   language.
2. **Where is it present?** — which other languages carry it (and, for a source gap, the value they
   carry), so you can see what the string should be.
3. **How do I fix it?** — a concrete next step for each gap class (usually a `/translate` invocation;
   for a source gap, a human decision).

It **never edits a file**. It reads the current state, compares languages against each other, and
writes a report. Fixing is `/translate`'s job — this skill just tells you exactly what to run.

> **Why a separate skill from `/translate`?** `/translate` has a completeness gate, but it only
> checks the languages *in its run scope* and only against the **source**. This audit is broader and
> symmetric: it compares **every** language against the **union of all languages**, so it also
> catches keys that exist in Bulgarian or German but are **missing from the source (English)** — a
> class `/translate` structurally can't surface, because it never adds keys to or edits the source.

## What this skill does NOT do

- **Translate or edit anything.** No file is written except the report. To close gaps, run
  `/translate` (this skill prints the exact command).
- **Add keys to the source, or "fix" a source gap.** It *flags* keys missing from the source (with
  the value other languages use) and leaves the decision to you — add it to the source, or delete the
  orphan from the other languages.
- **Judge translation quality.** It checks *presence/completeness*, not terminology or tone. A value
  that exists but is wrong is out of scope (that's `/translate`'s C1–C7 review).
- **Commit or push.**

## Invocation

```
/translate-audit                      # audit the configured/current project, all languages
/translate-audit --path <dir>         # point at a project, e.g. --path C:\Projects\MyApp
/translate-audit <path>               # shorthand for --path
/translate-audit --langs <a,b,...>    # restrict the audit to these languages (default: all present)
/translate-audit --format md|text     # report format (default md, written to a file + summarized in chat)
```

## Bash discipline (HARD RULES)

Same as the rest of the toolkit: **each command is its own Bash call** (no `&&`/`;`/`|`), **no shell
loops/branches or `awk`/`jq`/`sed` for logic**, and **file discovery/counts use `Glob`/`Grep`**, never
`ls | grep` / `find | head` / `grep | wc`. Build the key inventory by `Read`-ing each locale file and
comparing the sets **in your context** — not with a shell script.

## Step 0 — Resolve the project and its languages

1. **Project root** — resolve `--path` / bare `<path>` → that folder; else the current folder if it
   has a `translation.config.json`; else offer the registry picker (read the toolkit's
   `projects/registry.json` — treat a missing file as empty), same as `/translate` Step 0. Read the
   root's `translation.config.json` if present (for `sourceLang`, `include`/`exclude`, `wordpress`).
2. **Source language** — from `config.sourceLang`, else infer from the layout (`en.json`, `-en.po`,
   `en/`, `.en.md`). The source is one language in the matrix, but it is treated specially (see the
   source-gap class).
3. **All present languages** — detect **every** language the project already has (not just configured
   targets): the locale codes appearing in catalog filenames, `.po` locales, and content-tree
   folders/suffixes. This full set (source included) is the audit's universe. `--langs` narrows it.
4. **Formats present** — same detection table as `/translate` Step 1 (message catalogs, gettext,
   content trees). Record which formats to inventory.

## Step 1 — Build the per-language inventory

For each format, for each language, collect the set of translatable **units** and their values.
Use `Glob` to enumerate files and `Read` to load them; hold the sets in context.

- **Message catalogs** (`.json`/`.ts`/`.js`/`.arb`/`.yaml`/`.resx`/`.strings`): the unit is the
  **flattened dotted key path** (`nav.home`, `errors.required`). Record, per language: the key set and
  each key's value. Keep array indices in the path (`steps.0.title`) so array-length gaps show up.
- **gettext** (`.po`/`.pot`): the unit is the `msgid` (plus `msgctxt` if present). Record, per
  language: the msgid set and whether each `msgstr` (and every plural `msgstr[n]`) is filled or empty.
  A `.pot` template, if present, is the authoritative key universe for gettext.
- **Content trees** (`content/<lang>/**`, `*.<lang>.md`, mirrored MDX/HTML): the unit is the
  **logical page** (the source-relative path with the language stripped). Record, per language: which
  pages exist, and each page's `source_hash` (if the format stamps one).

## Step 2 — Compute the reference universe and classify each gap

The **reference universe** per format is the **union of units across all audited languages** — so a
key present in *any* language counts as "expected." For each unit × each language, classify:

- **`OK`** — present and non-empty (and, for a target, not a leftover). Not reported.
- **`MISSING_IN_TARGET`** — absent in this (non-source) language but present in the source. → the
  normal gap; `/translate` fills it.
- **`MISSING_IN_SOURCE`** — absent in the **source** language but present in ≥1 translation. This is
  the inversion: e.g. a key in `bg`/`de` that `en` doesn't have. `/translate` **cannot** fix it (it
  never edits or adds source keys). Flag it for a human decision and show the value(s) the other
  languages carry.
- **`EMPTY`** — the key/msgstr exists but the value is empty/whitespace. → `/translate` fills it.
- **`LEFTOVER`** — a **target** value byte-identical to the source value and containing ≥3
  source-language letters, i.e. never translated. (Skip the legitimately-shared exempt classes:
  brands, numbers, code, URLs, citations, and anything a project glossary `lang=*` row or
  `config.doNotTranslate` rule covers — a match there is *correct*, not a leftover.) → `/translate`
  fixes it.
- **`ORPHAN`** — a key present in **only one** language (and not the source). Often a stale/renamed
  key or a not-yet-propagated addition. Report it under the owning language so you can decide keep vs
  delete.

For **content trees**, add:
- **`MISSING_FILE`** — a source page with no counterpart file in a language. → `/translate` (or
  `/translate-add-locale` if the whole language is new).
- **`STALE`** — the counterpart exists but its `source_hash` ≠ `sha256(current source)` (compute the
  hash with one plain `sha256sum` Bash call per file). → `/translate` re-translates it.

## Step 3 — Assemble the report

Write the report (default a Markdown file `translation-coverage-<date>.md` at the project root; also
print a tight summary to chat). Structure:

1. **Header** — project, source language, languages audited, formats, date.
2. **Coverage matrix** — one row per language: units present / total-in-universe, percentage, and gap
   counts by class. Sort worst-covered first. Example:

   ```
   Language   Coverage   Missing  Empty  Leftover  Orphan
   en (src)   612 / 640    —        —      —         —      ⚠ 28 keys exist only in translations (source gaps)
   de         628 / 640    12       0      0         3
   bg         640 / 640     0       0      2         0
   fr         590 / 640    50       6      0         0
   ```

3. **Per-language detail** — for each language, the missing/empty/leftover/orphan units, each with:
   `key/path`, the gap class, **present-in** `[langs]`, and (for `MISSING_IN_SOURCE`/orphans) the
   value the other language carries. Group by file so a fix maps to one place.
4. **Source gaps (needs your decision)** — the `MISSING_IN_SOURCE` set called out separately, since
   `/translate` won't touch it. For each: the key, which languages have it, and their value(s), with
   the two options (add to source, or delete the orphan from the other languages).
5. **Fix plan** — the concrete commands, e.g.:
   - Fill the normal gaps in every language: `/translate --full`
   - Fill just one language: `/translate --full --to fr`
   - Fix only specific files: `/translate --files src/i18n/fr.json,content/fr/**`
   - Content-tree staleness: `/translate` (it re-translates stale `source_hash` pages automatically).
   - Source gaps: no command — add the key to `<source file>` (value shown) then `/translate`, or
     remove the orphan key from the languages listed.

## Step 4 — Summarize in chat + point to the fix

Print: the coverage matrix, the total gap counts by class, the count of source gaps (highlighted,
since they need a human), and the top fix command. End with the report file path. Do **not** run
`/translate` yourself — offer it as the next step.

If **every** language is at 100% with no empties, leftovers, orphans, or source gaps, say so plainly:
`✅ All N languages complete — no coverage gaps found.`

## Notes

- **Read-only, always.** If asked to "just fix it too," do the audit, then hand off to `/translate`
  (a separate, explicit step) — never edit files inside this skill.
- **The source is a language in the matrix, but special.** Coverage % for the source is informational;
  the meaningful source finding is the `MISSING_IN_SOURCE` set. Never propose auto-editing the source.
- **Report file is disposable.** `translation-coverage-<date>.md` is a snapshot; add it to the
  project's ignore file if the user doesn't want it tracked (offer, don't assume).
- **Large projects:** enumerate with `Glob` per format and read locale files once each; compare sets
  in context. Don't re-read the same file per language.

## Reference

- Fix the gaps: `/translate` (`.claude/skills/translate/SKILL.md`) — fills missing/empty/leftover/stale.
- Add a whole new language first: `/translate-add-locale`.
- Config (source lang, scope, glossary, doNotTranslate): `translation.config.json`.
- Registry / per-project memory: `projects/registry.json`, `projects/<slug>/notes.md`.
