# ta-mods — Translation Agency mods

Claude Code **mods** for people running Translation Agency: **one pane** beside the
chat (plus a band above the prompt) showing the state of a translation run, read
locally from the project. Three features live in one plugin so the code that finds
the config and diffs the catalogs is written once.

Read-only: nothing here writes, sends or logs project data.

## The pane: one tab, three sections

The pane is titled **Translation**. Open/reopen it with `/translation`. It stacks,
in a fixed order:

1. **Coverage** — per-language completeness (the live form of `/translate-audit`):
   `translation.config.json` + the JSON message catalogs, diffed into the four gap
   classes shown inline per language (missing, source gap, empty, leftover).
2. **Panel** — the three-tier panel while a `/translate` run is in flight, from
   `$.agent.list()` filtered to the panel tiers (`translate-lead` / `-senior` /
   `-junior` / `-researcher`). Empty state when no run is active.
3. **Gates** — completeness + each project gate's verdict
   (`.translate-gate/<lang>.json`). **Shown only when the project actually has
   gates** (configured in the config, or verdict files from a past run). A project
   with no gates never renders this section.

A **band** above the prompt shows a held gate first, else a running panel, else
nothing. The **status line** carries a short segment per visible section.

(The numbering follows the six-mod mockup in the toolkit's `mod-mockups/`; 1, 2 and
6 are built here.)

## Layout

```
ta-mods/
  .claude-plugin/plugin.json     name "ta-mods"
  hooks/hooks.json               { "modules": ["./register.tsx"] }
  hooks/register.tsx             the single pane, the one band slot, and the per-plugin session/redraw hooks
  hooks/shared/project.ts        THE shared, read-only project reader (config, catalog walk, diff, gate verdicts)
  hooks/shared/ui.tsx            shared drawing: card, pill, meter, paneHeader, band, legend
  hooks/shared/status.ts         composes the one status-line slot from each section's segment
  hooks/features/<feature>.tsx   one file per feature: its view logic + a section renderer (no pane of its own)
  test/project.test.ts           deterministic tests of the pure logic (pinned to the eval-fixture gaps)
```

## Scope of this first cut

- **Catalog format:** JSON message catalogs (`en.json` / `de.json` style, nested
  keys flattened). This is what the toolkit's `examples/eval-fixture/` uses. `.po`,
  `.ts` catalogs and content trees are **not** read yet — such a project shows an
  empty state rather than a wrong number.
- **Project location:** the current working directory (where `translation.config.json`
  lives). An absolute `projectPath` pointing elsewhere is not followed yet.
- **Leftover heuristic:** a target value byte-identical to a non-empty source value
  is flagged as an untranslated leftover. Legitimately-shared tokens can trip this —
  it is a surfaced signal, not a gate.

## Load it

This is a function-hook plugin, loaded by Claude Code as a **plugin directory** — it
is deliberately **not** under `.claude/skills/` (that tree is generated from `.claude/`
and `npm test` expects a `SKILL.md` in every skill dir). Point Claude Code at this
folder one of two ways:

```
claude --plugin-dir mods/ta-mods
```

or set it for every session in the project:

```
# bash/zsh
export CLAUDE_CODE_PLUGIN_DIRS="$PWD/mods/ta-mods"
```
```
# PowerShell
$env:CLAUDE_CODE_PLUGIN_DIRS = "$PWD\mods\ta-mods"
```

Needs Claude Code with function-hook plugins (2.1.317 or newer). Once loaded, the
**Translation** pane opens on session start and the plugin hot-reloads when its files
change (edits apply when the turn that made them ends). To run it against a real
project, load it from that project's checkout (where its `translation.config.json`
lives), e.g. copy `mods/ta-mods/` in alongside the toolkit's `.claude/` folders.

## Develop and check

The engine lays this build's types into `.claude-plugin/types/` the first time it
loads the mod (git-ignored); then `tsc -p mods/ta-mods` type-checks against them.
Before the types are laid, type-check with the `tsconfig.json` recipe in the header of
the engine's bundled `claude-code.d.ts` (`"target": "es2023"`, `"jsx": "react"`,
`"jsxFactory": "h"`). The deterministic logic tests live in `test/project.test.ts`.
