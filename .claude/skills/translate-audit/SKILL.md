---
name: translate-audit
description: Read-only audit across every existing language of a project. Two modes. DEFAULT (coverage) finds where translations are missing or incomplete — it builds the union of all keys/strings/pages present across all locales (including the source), then for each language lists what it is missing, which other languages DO have it, and how to fix it. Catches four gap classes: (1) a key present in some languages but absent in another target, (2) a key present in translations but MISSING FROM THE SOURCE language (an orphan / source gap the translator can't auto-fill), (3) present-but-empty values, and (4) present-but-untranslated leftovers (target value byte-identical to the source). DEEP mode (--deep) additionally judges QUALITY: it spawns the translate-lead to run the C1–C7 review over the EXISTING translations (domain-aware, using the specialization + glossary) and reports polish opportunities — weak terminology (C2), machine-translation stiffness / wrong register (C6), and parallel-copy drift (C7) — plus correctness bugs, each with a must-fix/polish severity and a suggested rewrite. Still read-only by default; --fix hands the flagged files to /translate to apply. Works on message catalogs (JSON/TS/.arb/YAML/.resx/.strings), gettext (.po/.pot), and mirrored content trees (MD/MDX/HTML), including per-language file coverage and stale source_hash. Produces a coverage matrix (+ a quality report in deep mode) and a fix plan. Use when the user says "check for missing translations", "which languages are incomplete", "translation coverage", "audit the translations", "check translation quality", "can the translations be polished", "review the existing translations", "compare the languages", "what's missing in <lang>", "find untranslated strings", or "are all languages complete". Does NOT edit any file itself — fixing is /translate's job.
---

# translate-audit

A **read-only audit** for a multi-language project, in two modes:

- **Coverage** (default) — *is anything missing?* A cheap, deterministic set comparison across every
  language. No agents, no LLM cost. Answers, per language: **what is missing**, **where it is present**
  (which other languages carry it, and the value — so you can see what it should be), and **how to fix
  it**.
- **Quality** (`--deep`) — *is what's there any good?* Spawns the `translate-lead` to run its C1–C7
  review over the **existing** translations and report **polish opportunities** (weak terminology,
  machine-translation stiffness, register/parity drift) plus correctness bugs, each with a severity and
  a suggested rewrite. This mode costs tokens (it reads and LLM-reviews content), so it is **scoped/
  sampled by default** — see "Deep mode" below.

It **never edits a file itself** — both modes only read and report (deep mode's `--fix` hands the
flagged files to `/translate`, which does the writing). Fixing is always `/translate`'s job; this skill
tells you exactly what to run.

> **Why a separate skill from `/translate`?** `/translate` has a completeness gate, but it only
> checks the languages *in its run scope* and only against the **source**. This audit is broader and
> symmetric: it compares **every** language against the **union of all languages**, so it also
> catches keys that exist in Bulgarian or German but are **missing from the source (English)** — a
> class `/translate` structurally can't surface, because it never adds keys to or edits the source.

## What this skill does NOT do

- **Translate or edit anything.** No file is written except the report(s). To close gaps or apply
  polish, run `/translate` (this skill prints the exact command; `--deep --fix` invokes it for you).
- **Add keys to the source, or "fix" a source gap.** It *flags* keys missing from the source (with
  the value other languages use) and leaves the decision to you — add it to the source, or delete the
  orphan from the other languages.
- **Judge quality in the default (coverage) mode.** Coverage checks *presence/completeness* only.
  Quality judgment happens **only in `--deep`**, and even then the skill reports; it does not rewrite.
- **Commit or push.**

## Invocation

```
/translate-audit                      # COVERAGE audit, configured/current project, all languages (cheap)
/translate-audit --path <dir>         # point at a project, e.g. --path C:\Projects\MyApp
/translate-audit <path>               # shorthand for --path
/translate-audit --langs <a,b,...>    # restrict to these languages (default: all present)
/translate-audit --format md|text     # report format (default md, written to a file + summarized in chat)

/translate-audit --deep               # + QUALITY review of existing translations (spawns the Lead; costs tokens)
/translate-audit --deep --sample <N>  # deep-review N high-signal strings per language (default 40)
/translate-audit --deep --files <glob># deep-review exactly this set instead of a sample
/translate-audit --deep --domain <d>  # domain lens for the quality review (default: config, else general)
/translate-audit --deep --fix         # after the report, hand the flagged files to /translate to apply
```
Flags compose: `--deep --langs de,fr --sample 60`. `--sample`, `--fix`, and `--domain` apply to `--deep` only.

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

## Step 5 — Deep mode (`--deep`): quality review of existing translations

Runs **only** when `--deep` is passed. The coverage pass (Steps 1–4) always runs first — gaps are
context for the quality read, and there's no point deep-reviewing a string that's missing. This mode
**spawns the `translate-lead`** to judge the translations that *do* exist, so it costs tokens and is
deliberately **scoped**.

**5a — Pick the scope (sampled by default).** Deep review sends real content through an LLM reviewer,
so never silently deep-review a whole large project:
- `--files <glob>` → review exactly that set.
- else `--sample <N>` (default **40**) → per audited language, select N **high-signal** units — the
  substantive ones (domain prose, message *values* with real sentences, headings, marketing/legal/
  financial copy, longer `.po` entries), **not** pure chrome (nav/buttons) or identity tokens. Prefer
  units that differ across languages (more likely to carry quality variance). Spread across files.
- `--langs` narrows which languages are reviewed (default: all non-source present languages).
- Always **state the sample** in the report ("deep-reviewed 40 / 612 units in `de`") — no silent
  truncation. If the user wants everything, tell them the rough size and let them pass `--files '**'`.

**5b — Load the domain lens** (so C2/C6 aren't generic): resolve the specialization (`--domain`, else
`config.specialization`, else `general`) → `specializations/<name>.md`; the `config.glossary` /
`projects/<slug>/glossary.csv`; and `config.context`. A quality review without these is just
dictionary opinion.

**5c — Spawn the Lead in review-only (audit) mode.** One `Agent({ subagent_type: "translate-lead" })`
with a brief that sets `mode: audit` and lists the scoped `review_items` (each: source_file,
target_file, target_lang, and the keys/sections in scope), plus `specialization_path`, `glossary_path`,
`context`, and `do_not_translate`. In `audit` mode the Lead does **not** spawn workers and does **not**
translate — it treats each **existing target value as the candidate**, runs **C1–C7** against the
source, and returns findings with a **severity**:
- **must-fix** — correctness: C1 leftover, C3 identity-token drift, C4 dropped/renamed placeholder,
  C5 broken markup.
- **polish** — quality: C2 a better term of art exists, C6 machine-translation stiffness / wrong
  register / unnatural phrasing, C7 parallel-copy drift.
Each finding carries: `file · key/line · category · severity · current value · suggested rewrite ·
confidence`. The Lead applies **nothing** (read-only), and its per-batch cycle cap / cost rules apply.

**5d — Write the quality report** `translation-quality-<date>.md` (separate from the coverage report),
and summarize in chat. Structure: header (scope actually reviewed, sample size, domain, glossary
used); a **per-language quality summary** (must-fix count / polish count); then **per-language,
per-file findings**, must-fix first, then polish — each with current value → suggested rewrite and the
one-line reason. End with the fix plan.

**5e — Fix handoff.**
- Default (no `--fix`): print the command to apply — `/translate --files <the flagged files> --domain
  <d>` — and stop. The panel's own C1–C7 pass will apply the improvements and re-review.
- `--fix`: invoke `/translate` on the flagged files, passing the quality report path so the panel
  uses the findings as a targeted correction list (it still re-reviews and owns the write + verify +
  commit decision). Deep-audit never edits files directly — `/translate` does.

If deep review finds **no** must-fix and **no** polish items in scope, say so:
`✅ Deep review (N units, M languages): no quality issues found in scope.`

## Notes

- **This skill never edits files.** Coverage is pure read. Deep mode reads + LLM-reviews and writes
  only its report; even `--deep --fix` doesn't edit here — it *invokes `/translate`*, which owns the
  write, verify, and commit decision. "Just fix it too" = the `--fix` handoff, not an inline edit.
- **Deep mode costs tokens; coverage doesn't.** Default coverage is free/deterministic. Reach for
  `--deep` when you want a quality read, and keep it scoped (`--sample`/`--files`/`--langs`).
- **The source is a language in the matrix, but special.** Coverage % for the source is informational;
  the meaningful source finding is the `MISSING_IN_SOURCE` set. Never propose auto-editing the source.
- **Report files are disposable.** `translation-coverage-<date>.md` and (deep) `translation-quality-<date>.md`
  are snapshots; add them to the project's ignore file if the user doesn't want them tracked (offer,
  don't assume).
- **Large projects:** enumerate with `Glob` per format and read locale files once each; compare sets
  in context. Don't re-read the same file per language.

## Reference

- Fix the gaps / apply polish: `/translate` (`.claude/skills/translate/SKILL.md`) — fills
  missing/empty/leftover/stale and re-reviews quality.
- Deep-mode reviewer: `.claude/agents/translate-lead.md` — run in `mode: audit` (review-only, C1–C7
  over existing translations, no worker spawns, no edits).
- Add a whole new language first: `/translate-add-locale`.
- Config (source lang, scope, specialization, glossary, doNotTranslate): `translation.config.json`.
- Registry / per-project memory: `projects/registry.json`, `projects/<slug>/notes.md`.
