# Phase 6 — OpenAI Codex CLI port notes (and a plan-correcting finding)

## Finding: Codex has no native spawnable subagents

The companion plan (`PORTING-PLAN.translation-agency.md`) assumed Codex would be "just a TOML
transform" — `.codex/agents/*.toml` with `name/description/developer_instructions/model/sandbox_mode`
and name-based spawning. **That format does not exist in Codex CLI (verified Sept 2026).** Codex's
actual customization primitives are:

- **`config.toml` `[profiles]`** — named bundles of `model` / `sandbox_mode` / `approval_policy`,
  activated explicitly (`codex --profile <name>` or `CODEX_PROFILE`).
- **`AGENTS.md`** — persistent project instructions (root or nested).
- **`[agents] max_threads` / `max_depth`** — coarse parallelism controls, but **no syntax for one
  named agent to spawn another with its own system prompt.**

Sources: majesticlabs.dev Codex config guide, shipyard.build Codex cheatsheet, codex.danielvaughan.com
official-docs mirror (all Sept 2026).

**Consequence:** the panel's core design — writer ≠ reviewer, three cheap/expensive tiers spawned and
QA'd automatically — **cannot be expressed natively on Codex today.** This is a genuine seam the
six-seam model didn't anticipate: *"target lacks spawnable subagents."*

## What we emit for Codex (honest mapping, real primitives)

Rather than fabricate a `.codex/agents/*.toml` format Codex can't load, the generator emits:

1. **`.codex/config.toml`** — generated from `tiers.json`: `[profiles.strong|mid|cheap]` mapping the
   panel tiers to Codex models + `sandbox_mode = "workspace-write"`. This is a real, directly-usable
   Codex artifact.
2. **`.codex/agents/<name>.md`** — the same authored bodies (single source), with TOML `+++`
   frontmatter (`name`/`description`/`model`/`sandbox_mode`) and Codex seam substitutions applied.
   These are **per-role instruction docs**, not auto-spawned agents. They are used one of two ways:
   - **Manual multi-pass:** a human runs the panel by hand — `codex --profile mid` pointed at
     `translate-senior.md` to translate, then `codex --profile strong` at `translate-lead.md` to
     review — preserving writer≠reviewer across two explicit passes.
   - **External orchestrator:** a wrapper script drives the passes and switches profiles.

## Seam substitutions (adapters/codex.json)

- **Paths (seam 4):** `.claude/agents/` → `.codex/agents/`; each skill SKILL.md → `.codex/agents/<x>.md`.
- **Spawn (seam 2):** `Agent({ subagent_type: … })` → `hand off to the agent ({ agent: … })` — worded
  as a hand-off because there is no automatic spawn.
- **Model prose (seam 5b):** Codex uses GPT models, so "Opus/Sonnet/Haiku" would be wrong — neutralized
  to tier words ("strong-tier"/"mid tier"/"cheap tier") in the **body**.
- **Tool names (seam 3):** `WebSearch`/`WebFetch` → prose; `TaskCreate…` → "a task checklist";
  `AskUserQuestion` → "an interactive question".

## Known limitations / refinements

- **`description` frontmatter keeps Claude tier words** ("Opus-tier") — body prose is neutralized but
  the metadata description is not (it's informational). Cosmetic; fix by neutralizing the description
  in the codex renderer if it matters.
- **No automatic panel.** The writer≠reviewer guarantee is manual on Codex (two profile passes). If/
  when Codex ships real subagents, revisit for an OpenCode-style automatic port.
- **Model IDs** (`gpt-5`, `gpt-5-mini`, `gpt-5-nano`) are placeholders — re-verify at port time.
- **Layer 5 (live run)** on Codex against `examples/eval-fixture/` is the pre-release manual step, and
  for Codex it exercises the manual two-pass flow, not an automatic spawn.
