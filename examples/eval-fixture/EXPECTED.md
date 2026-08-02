# Answer key — planted defects in `locales/de.json`

This is the **ground truth** for the Tier-2 behavioral eval. `locales/en.json` is the source;
`locales/de.json` is the deliberately-defective German target. Exactly **7 defects** are planted,
**one per key** so each is isolated and independently detectable. Every other key is correctly
translated (formal register, placeholders intact, glossary term used) so the defects stand out.

`expected-good/locales/de.json` is a fully correct translation of the same source — used to prove the
deterministic assertion script reports **0 violations** on a clean target.

| # | Class | C-code | Key path | Bad value in `de.json` | What a correct fix looks like |
|---|-------|--------|----------|------------------------|-------------------------------|
| 1 | LEFTOVER | C1 | `errors.notFound` | `"The page was not found"` (byte-identical to the English source) | Translate it: `"Die Seite wurde nicht gefunden"` |
| 2 | DROPPED PLACEHOLDER | C4 | `auth.welcome` | `"Willkommen zurück!"` — the `{username}` placeholder present in the source was dropped | Restore the placeholder: `"Willkommen zurück, {username}!"` |
| 3 | WRONG TERM | C2 | `auth.signInPrompt` | `"Bitte zum Fortfahren einloggen."` — uses `einloggen`, contradicting the glossary | Use the glossary term `anmelden`: `"Bitte zum Fortfahren anmelden."` |
| 4 | FORMALITY VIOLATION | C6 | `errors.saveFailed` | `"Deine Änderungen konnten nicht gespeichert werden"` — informal `Deine` where formal (Sie/Ihre) is required | Use the formal possessive: `"Ihre Änderungen konnten nicht gespeichert werden"` |
| 5 | MISSING KEY | coverage (missing-in-target) | `actions.confirm` | *(key absent from `de.json`)* | Add the key: `"actions.confirm": "Bestätigen"` |
| 6 | EMPTY VALUE | coverage (empty) | `nav.settings` | `""` | Fill it: `"Einstellungen"` |
| 7 | MISSING-IN-SOURCE | coverage (source gap) | `auth.rememberMe` | `"Angemeldet bleiben"` — key exists in `de.json` but **not** in `en.json` | Human decision: either add `auth.rememberMe` to the source `en.json`, or delete the orphan from `de.json`. The panel cannot auto-fill it — it is a documented human-decision class. |

## Notes

- The glossary (`glossary.csv`) defines `sign in → anmelden` (de). Defect #3 is only detectable
  because the source value `auth.signInPrompt` contains the source term "sign in" and the correct
  target must contain the glossary term "anmelden".
- The glossary `term` cell lists the **accepted surface forms** of the term, `|`-separated:
  `anmelden|melden * an`. The wrong-term check in `tests/eval-assert.mjs` passes if **any** form
  appears (whitespace-tolerant, `*` = intervening words, word-anchored). So both the literal lemma
  (`"Bitte zum Fortfahren anmelden."`) **and** the natural separable-verb rendering
  (`"Bitte melden Sie sich an, um fortzufahren."`, see `panel-output/locales/de.json`) are accepted,
  while the wrong verb `einloggen` — and the antonym `abmelden` (sign-out) — are correctly rejected.
- Defects #5 (MISSING KEY), #6 (EMPTY), #1 (LEFTOVER), and #7 (MISSING-IN-SOURCE) are exactly the
  four gap classes the **coverage** audit (`/translate-audit`) reports. #7 must be called out as a
  **source gap**, not a target gap.
- Defects #1–#4 (LEFTOVER, DROPPED PLACEHOLDER, WRONG TERM, FORMALITY) are the C1/C4/C2/C6 classes the
  **translator panel** (`/translate`) is expected to fix in place.
