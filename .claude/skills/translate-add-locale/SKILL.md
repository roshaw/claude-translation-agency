---
name: translate-add-locale
description: Scaffold a brand-new interface LANGUAGE (locale) end-to-end in a codebase so the build goes green with source-language placeholders, then hand off to /translate for the real translation. Wires the locale into the type/registry (locale list, HTML lang, OG locale), clones the message catalog to a new <locale> file, mirrors any per-context copy files and content-tree pages as placeholders, adds the metadata (native name, flag, number format), the routes, the build config (locales + sitemap), and the language switcher. Use when the user wants to add a new UI language ("add German", "add pt-BR", "implement a new locale", "add a WordPress language"). NOT for translating existing copy (that is /translate) and NOT for adding a data/content entity. The argument is the language/locale code, not a country code — Greek is `el` (not `gr`), Czech is `cs` (not `cz`).
---

# translate-add-locale

A thin orchestrator for adding **one interface language** to a codebase. The mechanical
scaffolding is delegated to the general-purpose Agent; this skill resolves the locale metadata,
sanity-checks it isn't a country code, hands off a clean brief, then points at `/translate` for the
real work.

> **"Scaffolded" ≠ "done."** The scaffold makes the build go green and the UI render in the new
> locale, but every string is still a source-language **placeholder**. The locale is **not done**
> until `/translate --full --to <locale>` fills it and the completeness gate confirms zero
> leftovers. The scaffold step reports `🟡 SCAFFOLDED — NOT DONE` until then.

## What this skill does NOT do

- **Translate.** It clones the source language into the new locale's files as placeholders. Real
  translation + terminology audit is `/translate`'s job, run right after (Step 4 hand-off). Do not
  hand-translate here and do not spawn the translator panel inline.
- **Add a data/content entity** (a new product, country, article). A new *language* is not a new
  *entity*.
- **Change source facts, numbers, or references.**
- **Commit or push.** Stop on the working branch and let the human commit.

## Language code vs country code (read first)

The argument is the **language/locale code**, never a country code. They diverge often: Greek is
`el` (not `gr`), Czech `cs` (not `cz`), Ukrainian `uk` (not `ua`). Regional variants use BCP-47 /
WP form as the project already uses them (`pt-BR` / `pt_BR`, `zh-Hans`, `en-GB`). If the user says
"add GR", confirm they mean the Greek **language** (`el`), not a Greece entity. **RTL check:** if
the language is right-to-left (`ar`, `he`, `fa`, `ur`), flag it — the scaffold does not handle
`dir="rtl"`, mirrored layout, or font subsetting; those need design work before the locale ships.

## Invocation

```
/translate-add-locale <locale>            # e.g. /translate-add-locale el   or   /translate-add-locale pt-BR
```
If no locale arg, ask once (AskUserQuestion) for the code and the language's native name.

## Step 1 — Resolve the locale metadata

Gather once (from a standard locale table; use AskUserQuestion only if you can't determine them):

| Field | Example (Greek) |
|---|---|
| Locale code (as the project spells it) | `el` |
| BCP-47 (HTML lang) | `el-GR` |
| OG / WP locale | `el_GR` |
| Native name | `Ελληνικά` |
| Flag / label (if the UI uses one) | 🇬🇷 |
| Decimal separator | `,` |
| Thousands group | `.` |
| Plural-Forms (for gettext/`.po`) | `nplurals=2; plural=(n != 1);` |

## Step 2 — Detect the wiring and brief the worker

First discover how *this* project registers a locale (don't assume a layout) — `Glob`/`Grep` for
the locale list, the message-catalog naming, the routes/build config, and the language switcher.
Then hand a general-purpose Agent a brief listing every surface to touch:

- Add the locale to the **type union / locale registry** (locale list, HTML-lang map, OG-locale map).
- **Clone the message catalog** to the new `<locale>` file (JS/TS/JSON) — or, for **WordPress**, copy
  `languages/<textdomain>.pot` to `languages/<textdomain>-<locale>.po` and set its `Language:` +
  `Plural-Forms:` header (leave every `msgstr` empty for `/translate` to fill).
- **Mirror per-context copy files and content-tree pages** (MDX/HTML/`.po`) as source-language
  placeholders so routes resolve and the build is green.
- Add **metadata** (native name, flag, number-format fields) wherever the project keeps it.
- Add **routes / build config** (locales array, sitemap, hreflang) and the **language switcher entry**.
- Run the project's type/build gate; report red/green.
- Quantify the **placeholder backlog** (how many strings/files still read source-language) so
  `/translate` knows the size of the job.

The worker returns: status `🟡 SCAFFOLDED — NOT DONE (<N> placeholders owed)`, the files
created/edited, the gate result, and the backlog count.

## Step 3 — Relay the worker's summary

Print it as-is — status, backlog, files, gate result. Don't editorialize.

## Step 4 — Hand off to /translate

Tell the user (and, if they confirm, invoke it): the locale is scaffolded but every string is a
placeholder. Run:
```
/translate --full --to <locale> --domain <the project's specialization>
```
to fill it. The completeness gate in `/translate` confirms the locale adds zero leftovers before
it's considered done.

## Reference

- Translation half: `/translate` skill (drives the Lead → Senior/Junior panel).
- Panel agents: `.claude/agents/translate-lead.md`, `translate-senior.md`, `translate-junior.md`.
- Config: `translation.config.json` (the project's source/target langs + specialization).
