# <Project name> — translation notes

> Per-project memory. Read at the start of every `/translate` run. Keep it to durable **decisions**,
> not a transcript. Reference the registry entry in `../registry.json`.

## Purpose / context
<One or two sentences: what this product IS and who it's for. This is what lets the translator pick
the right SENSE of ambiguous words — e.g. "a hotel-booking app for travelers" → "Book" = reserve,
"Register" = sign up. Mirrors the config `context` field. The more specific, the better the terms.>

## Overview
- **Path:** `<C:\Projects\...>`
- **Source language:** `<en>`
- **Target languages:** `<de, fr, ...>` — <why this set, if notable>
- **Specialization:** `<general | technical | marketing | legal | custom>`
- **Output mode:** `<inplace | tree | catalog>`
- **Research:** `<first-run | always | off>` · **Queries:** `<report | high-stakes | off>`
- **What "done" means here:** <e.g. build green + every target has no leftovers>

## Formats & surfaces
- <e.g. JS/TS message catalogs under src/i18n; WordPress .po under languages/; MDX under content/>
- <files/globs to include or exclude beyond the config>

## Terminology & do-not-translate decisions
- <term> → <target rendering> (<source/why>)
- Verbatim / never translate: <brand names, product terms, identifiers, citations>
- Glossary: `glossary.csv` present? <yes/no> — <what it covers>
- Pass-through rules: <free-form "leave this verbatim" instructions — colour/size tokens, raw user
  text, named placeholders. The durable ones belong in `config.doNotTranslate`; items listed here
  are merged into the run's do-not-translate list too.>

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
