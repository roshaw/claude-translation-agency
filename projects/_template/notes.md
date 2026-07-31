# <Project name> — translation notes

> Per-project memory. Read at the start of every `/translate` run. Keep it to durable **decisions**,
> not a transcript. Reference the registry entry in `../registry.json`.

## Overview
- **Path:** `<C:\Projects\...>`
- **Source language:** `<en>`
- **Target languages:** `<de, fr, ...>` — <why this set, if notable>
- **Specialization:** `<general | technical | marketing | legal | custom>`
- **Output mode:** `<tree | inplace | catalog>`
- **What "done" means here:** <e.g. probe/build green + every target has no leftovers>

## Formats & surfaces
- <e.g. JS/TS message catalogs under src/i18n; WordPress .po under languages/; MDX under content/>
- <files/globs to include or exclude beyond the config>

## Terminology & do-not-translate decisions
- <term> → <target rendering> (<source/why>)
- Verbatim / never translate: <brand names, product terms, identifiers, citations>
- Glossary: `glossary.csv` present? <yes/no> — <what it covers>

## Framing / tone
- <register, formality (formal vs informal "you"), brand voice notes, domain framing traps>

## Quirks & gotchas
- <anything that has bitten a run before — a file that isn't a real surface, a placeholder syntax, a
  format field to leave alone, a language that needs special plural handling>

## Open issues
- <unresolved questions, strings flagged back to the user, impl gaps not yet fixed>

## Run log
<!-- newest first; one line per run -->
- <YYYY-MM-DD> — <scope> → <verdict> (<languages touched>, <n> fixes). <notes>
