# Eval fixture — behavioral test for the translator panel & coverage audit

This is a tiny JSON message-catalog project with **planted defects** and an **answer key**
([`EXPECTED.md`](EXPECTED.md)). It exists to answer a question the deterministic Tier-1 suite
(`npm test`) cannot: **does the LLM layer — the translator panel and the coverage audit — actually
catch and fix the defects it's supposed to?**

## Two tiers, and what each proves

| Tier | What runs | Deterministic? | Costs tokens? | When |
|------|-----------|----------------|---------------|------|
| **Tier 1** | `npm test` → `tests/check.mjs` | Yes — pure Node, offline | No | Every commit / CI |
| **Tier 2** | The LLM evals below (A + B) | **No** — LLM behavior | **Yes** | **Pre-release**, by hand |

Tier 1 already proves the **assertion harness itself** bites, with no tokens: `tests/check.mjs` runs
`tests/eval-assert.mjs` against both the defective `locales/de.json` (must flag every planted class)
and the clean `expected-good/locales/de.json` (must report 0). That's the deterministic teeth. The
evals below then spend tokens to check the **actual agents** against the same fixture.

> ⚠️ **Evals A and B are non-deterministic and cost tokens. They are a pre-release confidence check,
> not a per-commit gate.** Do not wire them into `npm test` or CI.

## The fixture

```
examples/eval-fixture/
├── translation.config.json          # en → de, technical, formal, glossary.csv
├── glossary.csv                     # sign in → anmelden (de)
├── locales/
│   ├── en.json                      # SOURCE (10 keys)
│   └── de.json                      # DEFECTIVE target — 7 planted defects, one per key
├── expected-good/locales/de.json    # a fully CORRECT de translation (self-test baseline)
├── panel-output/locales/de.json     # correct target using the separable form "melden Sie sich an"
├── EXPECTED.md                      # ANSWER KEY — every defect, its class, and the fix
└── README.md                        # this file
```

The 7 planted defects (full detail + fixes in [`EXPECTED.md`](EXPECTED.md)): **LEFTOVER** (C1),
**DROPPED PLACEHOLDER** (C4), **WRONG TERM** (C2), **FORMALITY VIOLATION** (C6), **MISSING KEY**,
**EMPTY VALUE**, and **MISSING-IN-SOURCE** (the last three are coverage classes).

## Eval A — coverage audit (cheap)

Checks that `/translate-audit` finds the **coverage** defects without touching a file.

1. Run:

       /translate-audit --path examples/eval-fixture

2. Cross-check the coverage report against [`EXPECTED.md`](EXPECTED.md). It must identify:
   - **MISSING KEY** — `actions.confirm` present in `en.json`, absent from `de.json`.
   - **EMPTY VALUE** — `nav.settings` is `""` in `de.json`.
   - **LEFTOVER** — `errors.notFound` in `de.json` is byte-identical to the English source.
   - **MISSING-IN-SOURCE** — `auth.rememberMe` exists in `de.json` but **not** in `en.json`. This
     one **must be called out as a source gap** (an orphan `/translate` cannot auto-fill), not as a
     normal missing-in-target row.

A pass is: all four are reported, and the missing-in-source one is correctly framed as a source gap.

## Eval B — translator panel (costs tokens)

Checks that a real `/translate` run **fixes** the panel-class defects (C1/C2/C4/C6). Because
`/translate` writes files, run it on a **copy** so the checked-in fixture stays defective.

1. Copy the fixture to a temp dir (PowerShell):

       Copy-Item -Recurse examples/eval-fixture "$env:TEMP/eval-run"

2. Translate the copy from scratch:

       /translate --full --path "$env:TEMP/eval-run"

3. Re-run the deterministic assertion on the panel's output, using the **original** source + glossary
   as the yardstick. Pass `--ignore-source-gaps` so the assertion grades only what the panel is
   responsible for (the source→target direction):

       node tests/eval-assert.mjs "$env:TEMP/eval-run/locales/de.json" examples/eval-fixture/locales/en.json examples/eval-fixture/glossary.csv --formality formal --ignore-source-gaps

**Expected: exactly `0 violations`** — i.e. the panel fixed the leftover (C1), restored the
`{username}` placeholder (C4), corrected `einloggen → anmelden` (C2, in whichever surface form —
the natural separable `"melden Sie sich an"` is accepted), and used formal register (C6). Any
remaining violation is a **real panel miss** — open it against [`EXPECTED.md`](EXPECTED.md) and
investigate.

**On the source gap:** the panel will **not** invent — nor is it a failure that it preserves — the
**missing-in-source** key (`auth.rememberMe`, present in the target but absent from `en.json`). That
is a documented **human-decision class**, surfaced by **Eval A** (and by the panel's own
open-questions), not a panel miss. `--ignore-source-gaps` excludes exactly that class from the count,
which is why the expectation above is a clean `0`. (Omit the flag and the same run reports the one
`missing-in-source` orphan — that path is what the Tier-1 self-test exercises.)

## Why the split

The assertion script encodes the pass/fail post-conditions **once**, deterministically. Tier 1 uses it
to prove the script is correct (good→0, bad→all-classes) for free. Tier 2 reuses the exact same script
to grade the live agents. So the expensive LLM eval never argues about *what* counts as a defect — that's
already pinned down and continuously tested — it only measures whether the agents cleared the bar.
