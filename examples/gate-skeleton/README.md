# Gate skeleton (project side)

A reference **project gate** for the Translation Agency `gates` feature. Copy this into the project you
translate, replace the one TODO with your real check (plagiarism, readability, brand compliance, …),
and point `translation.config.json → gates` at it. The toolkit runs it after the translator panel
signs off and drives refine / retry / revert from what it returns.

See the `/translate` **Step 6.7 — Project gates** and CLAUDE.md **"Project gates"** for the full
contract. A gate lives in the **target project**, not in this toolkit.

## The contract

A gate does ONE thing: inspect the run's output files and emit a **findings verdict** JSON — written to
`{out}` (default `.translate-gate/{lang}.json`) or printed to stdout:

```json
{
  "status": "pass",
  "disposition": "refine",
  "findings": [
    {
      "file": "translations/de/article-1.md",
      "passage": "…the flagged text…",
      "issue": "92% similar to source X",
      "suggestion": "rephrase to reduce overlap; keep meaning"
    }
  ]
}
```

- **`status`** (required) — `"pass"` or `"fail"`. This is the only field the toolkit *needs*.
- **`disposition`** (optional) — the gate's recommendation (`refine` | `retry` | `revert`). The
  operator's `onFail` config wins; this is just a hint shown at the prompt.
- **`findings`** (required on fail) — one entry per problem. `file` + `passage` + `issue` +
  `suggestion` power both the operator prompt and the `refine` remediation constraints. Include a
  concrete `suggestion` — that is what the translator acts on.

The check itself is entirely yours; the toolkit is format-agnostic about *how* you decide pass/fail.

## Wire it up

Two ways to run a gate — a shell command (portable, headless-safe) or a project skill (Claude-only,
can reason). This skeleton is the **command** form:

```jsonc
// translation.config.json in your project
"gates": [
  {
    "name": "plagiarism",
    "run": "node examples/gate-skeleton/gate.mjs --lang {lang} --out {out} --files {files}",
    "onFail": "ask",        // ask (default) | refine | retry | revert
    "maxRetries": 2,
    "fallback": "revert"    // used when 'ask' can't prompt (headless) or retries run out
  }
]
```

For a **skill** gate instead, drop the check into `.claude/skills/<name>/SKILL.md` in your project and
use `"skill": "<name>"` (with optional `"with": { … }`) in place of `"run"`.
