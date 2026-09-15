# Phase 0 — Coupling inventory (line-level seam tags)

**Status:** complete. This is the substitution spec the generator (Phase 4) consumes.
Extends [`../../PORTING-PLAN.translation-agency.md`](../../PORTING-PLAN.translation-agency.md).

Every tool-specific reference in the 8 coupled files is tagged below to one of the six seams
(from the generic plan). Nothing outside these 8 files references the tool — the non-agent assets
(`specializations/*.md`, config + schema, `projects/`, `examples/`, `tests/eval-assert.mjs`,
housekeeping) are already tool-agnostic and are **not** touched by the port.

The 8 coupled files:

```
.claude/agents/translate-lead.md        (strong — orchestrator + adversarial QA)   303 lines
.claude/agents/translate-senior.md      (mid    — domain-prose translator)         225 lines
.claude/agents/translate-junior.md      (cheap  — low-risk chrome translator)      119 lines
.claude/agents/translate-researcher.md  (mid    — terminology research)            135 lines
.claude/skills/translate/SKILL.md                                                  579 lines
.claude/skills/translate-init/SKILL.md                                            149 lines
.claude/skills/translate-add-locale/SKILL.md                                       99 lines
.claude/skills/translate-audit/SKILL.md                                           238 lines
```

## Seam legend

| # | Seam | What varies per tool |
|---|------|----------------------|
| 1 | Frontmatter / manifest | YAML→TOML; field names; required keys |
| 2 | Spawn / delegation | how a parent agent invokes a child subagent |
| 3 | Tool names | `Agent`, `AskUserQuestion`, `WebSearch/WebFetch`, task tools vs each tool's equivalents |
| 4 | Entry point | slash-command / skill invocation + `.claude/…` self-reference paths |
| 5 | Model tiers | tier label (`strong/mid/cheap`) → concrete provider model ID |
| 6 | Task / todo primitives | `TaskCreate/Update/List/Get` vs a prose-checklist fallback |

> **Universal tools carry no seam.** `Read`, `Write`, `Edit`, `Grep`, `Glob`, `Bash` name the same
> capability in every target (per §"Tool names" of the companion plan). They stay literal in the
> shared body and are **not** substituted — only tools that actually differ across targets (seam 3)
> are tokenized. This is what keeps the substitution surface small and the Layer-1 round-trip safe.

---

## Actual tallies (grep-derived, refine the plan's estimates)

The companion plan estimated "~20 spawn/task refs, ~80 tool-name refs, ~107 model/path/slash refs."
The exact grep-derived counts:

| Seam | Count | How measured |
|------|-------|--------------|
| 1 — frontmatter blocks | 8 blocks | one per file (4 agents ×4 fields, 4 skills ×2 fields) |
| 2 — spawn tool-calls (code) | 6 | `Agent(…)` / "(Agent tool)" call sites |
| 3 — differ-per-tool tool names (body, excl. frontmatter) | 15 | `AskUserQuestion` ×8, `WebSearch`/`WebFetch` ×4, `Agent` prose ×1, `TaskCreate…` prose ×2 |
| 3 — tool names inside `tools:` frontmatter lists | 43 | lead 11 + senior 14 + junior 6 + researcher 12 |
| 4 — slash-command refs (`/translate*`) | 100 | 7 files (see table below) |
| 4 — `.claude/…` self-ref paths | 15 | Reference sections |
| 5 — `model:` frontmatter | 4 | one per agent |
| 5 — tier words in prose/description | ~13 | `Opus`/`Sonnet`/`Haiku` + `-tier` |
| 6 — task primitives (body prose) | 2 | senior:133, senior:206 |

Slash-command occurrences per file (seam 4):

```
translate-audit/SKILL.md   38
translate/SKILL.md         25
translate-add-locale       13
translate-init/SKILL.md    10
translate-lead.md           7
translate-junior.md         4
translate-researcher.md     3
translate-senior.md         0
= 100 total
```

---

## Seam 1 — Frontmatter (whole block per file)

The entire leading `---…---` block is generated per tool from per-unit metadata + the tool's
frontmatter template. Claude source values, for the round-trip baseline:

| File | Lines | `name` | `model` (→ tier) | `tools` |
|------|-------|--------|------------------|---------|
| translate-lead.md | 1–6 | translate-lead | `opus` → **strong** | Read, Edit, Grep, Glob, Bash, **Agent**, **AskUserQuestion**, **TaskCreate, TaskUpdate, TaskList, TaskGet** |
| translate-senior.md | 1–6 | translate-senior | `sonnet` → **mid** | Read, Write, Edit, Glob, Grep, Bash, **WebSearch, WebFetch**, **Agent**, **AskUserQuestion**, **TaskCreate, TaskUpdate, TaskList, TaskGet** |
| translate-junior.md | 1–6 | translate-junior | `haiku` → **cheap** | Read, Edit, Grep, Glob, Bash |
| translate-researcher.md | 1–6 | translate-researcher | `sonnet` → **mid** | Read, Grep, Glob, **WebSearch, WebFetch**, Write, Edit, Bash, **TaskCreate, TaskUpdate, TaskList, TaskGet** |
| translate/SKILL.md | 1–4 | translate | — | — (skill: name + description only) |
| translate-init/SKILL.md | 1–4 | translate-init | — | — |
| translate-add-locale/SKILL.md | 1–4 | translate-add-locale | — | — |
| translate-audit/SKILL.md | 1–4 | translate-audit | — | — |

Bold tool names in the `tools:` lists are seam-3 (differ per tool); the rest are universal.
`description:` frontmatter also contains tier words (seam 5) — see Seam 5.

---

## Seam 2 — Spawn / delegation (the heart of the panel)

Concrete tool-call sites — the strings that must render per tool (Agent tool call ↔ `@name`
delegation ↔ "spawn `<name>`"):

| File:line | Snippet | Spawns |
|-----------|---------|--------|
| translate-lead.md:111–118 | `Agent({ subagent_type: "translate-junior" \| "translate-senior", prompt: … })` | junior/senior |
| translate-lead.md:213 | `…back via Agent({subagent_type: "translate-senior", …})` | senior |
| translate-senior.md:204 | `**\`Agent\`** — delegate … sweep to the Explore subagent` | Explore (generic) |
| translate/SKILL.md:274 | `spawn ONE \`translate-researcher\` (Agent tool)` | researcher |
| translate/SKILL.md:286 | `Agent({ subagent_type: "translate-lead", prompt: <brief> })` | lead |
| translate-audit/SKILL.md:186 | `One \`Agent({ subagent_type: "translate-lead" })\`` | lead (audit mode) |

Supporting **prose** that describes the spawn relationship (not a call site, but names the mechanism —
review when authoring the shared body so it reads tool-neutrally): lead:8 ("The `/translate` skill
spawns you **once**"), senior:10 ("The **translate-lead** (Opus) spawns you"), junior:8 ("The
**translate-lead** spawns you once per batch"), researcher (spawned-by prose in description),
translate/SKILL.md:15–24 (panel description "Spawned by the Lead").

---

## Seam 3 — Tool names that differ per tool (body)

Universal tools (`Read/Write/Edit/Grep/Glob/Bash`) are **not** listed — they stay literal.

| Tool | Occurrences (file:line) |
|------|--------------------------|
| `AskUserQuestion` | lead:63 · senior:205 · translate:131, 200, 444 · translate-init:43 · translate-add-locale:42, 46 |
| `WebSearch` / `WebFetch` | senior:203 · researcher:74 (+ frontmatter lists senior:4, researcher:4) |
| `Agent` (named as a tool in prose) | senior:204 (see also Seam 2 call sites) |
| `TaskCreate/Update/List/Get` (prose) | senior:133, 206 (see Seam 6) |

The senior "Tools and how to use them" section (senior:198–206) enumerates several tools as a bullet
list — each bullet is a seam-3 anchor for tools that differ, universal ones left as-is.

---

## Seam 4 — Entry point (slash commands + self-reference paths)

### 4a — Slash commands (`/translate`, `/translate-init`, `/translate-add-locale`, `/translate-audit`)

100 occurrences across 7 files (per-file counts in the tally table). These are both the **invocation**
recipe (how a human starts a run — differs: Claude `/name` skill vs OpenCode/Codex/Copilot command or
prompt) and **cross-references** between skills in prose. Substitution renders the tool's own
invocation syntax; a plain in-prose mention of a sibling renders as that tool's command name.

Highest-density spots: the `## Invocation` fenced block in each skill (translate:28–40,
translate-init:18–22, translate-add-locale:39–41, translate-audit:43–55) and the audit fix-plan
commands (translate-audit:146–152, 205–210).

### 4b — `.claude/…` self-reference paths (Reference sections)

| File:line | Snippet |
|-----------|---------|
| translate-lead.md:301–303 | `.claude/agents/translate-senior.md`, `…junior.md`, `.claude/skills/translate/SKILL.md` |
| translate-senior.md (Reference) | panel agent paths |
| translate-junior.md:117–119 | `.claude/agents/translate-senior.md`, `…lead.md`, `.claude/skills/translate/SKILL.md` |
| translate-researcher.md:134–135 | `.claude/agents/translate-senior.md`, `…lead.md`, `.claude/skills/translate/SKILL.md` |
| translate/SKILL.md:568–569 | `.claude/agents/translate-lead.md` (Lead), `translate-senior.md`, `translate-junior.md` |
| translate-init/SKILL.md:148 | `.claude/agents/translate-researcher.md` |
| translate-add-locale/SKILL.md:98 | `.claude/agents/translate-lead.md`, `translate-senior.md`, `translate-junior.md` |
| translate-audit/SKILL.md:232, 234 | `.claude/skills/translate/SKILL.md`, `.claude/agents/translate-lead.md` |

Render as the target tool's agent/command path (`.opencode/agent/…`, `.codex/agents/….toml`, etc.).

---

## Seam 5 — Model tiers

### 5a — `model:` frontmatter (also part of Seam 1)

| File:line | Value | Tier |
|-----------|-------|------|
| translate-lead.md:5 | `opus` | strong |
| translate-senior.md:5 | `sonnet` | mid |
| translate-junior.md:5 | `haiku` | cheap |
| translate-researcher.md:5 | `sonnet` | mid |

### 5b — Tier words in prose + description

| File:line | Snippet |
|-----------|---------|
| translate-lead.md:3 (desc), 8 | "Opus-tier project manager" |
| translate-senior.md:3 (desc), 10 | "the **translate-lead** (Opus) spawns you" |
| translate-junior.md:3 (desc), 8 | "the Haiku-tier worker" |
| translate/SKILL.md:15, 19, 21 | "(`translate-lead`, Opus)", "(`translate-senior`, Sonnet)", "(`translate-junior`, Haiku)" |

Author the shared body with **tier labels** (strong/mid/cheap) tokenized; each adapter renders the
concrete model word. Claude adapter renders `Opus/Sonnet/Haiku` (prose) and `opus/sonnet/haiku`
(frontmatter) — note the case difference between prose and the `model:` field.

---

## Seam 6 — Task / todo primitives

| File:line | Snippet | Note |
|-----------|---------|------|
| translate-senior.md:133 | "Use `TaskCreate` to lay out the pass…" | body |
| translate-senior.md:206 | "`TaskCreate` / `TaskUpdate` / `TaskList` / `TaskGet` — track the per-file/per-language pass." | body |
| (frontmatter) lead:4, senior:4, researcher:4 | `TaskCreate, TaskUpdate, TaskList, TaskGet` in `tools:` | Seam 1/3 |

Junior does **not** use task tools (chrome batches are single-shot). For a target tool without task
primitives, render as a prose-checklist fallback and drop them from the frontmatter tool list.

---

## Substitution-token plan (feeds Phase 1)

Proposed seam tokens for the shared body (round-trip-verified against Claude in Phase 1):

| Token | Seam | Claude render |
|-------|------|---------------|
| `{{SPAWN:<agent> …}}` | 2 | `Agent({ subagent_type: "<agent>", … })` |
| `{{TOOL:ask}}` | 3 | `AskUserQuestion` |
| `{{TOOL:websearch}}` / `{{TOOL:webfetch}}` | 3 | `WebSearch` / `WebFetch` |
| `{{TOOL:agent}}` | 3 | `Agent` |
| `{{TASK:*}}` | 6 | `TaskCreate` / `TaskUpdate` / `TaskList` / `TaskGet` |
| `{{CMD:<skill>}}` | 4 | `/<skill>` |
| `{{PATH:agent:<name>}}` / `{{PATH:skill:<name>}}` | 4 | `.claude/agents/<name>.md` / `.claude/skills/<name>/SKILL.md` |
| `{{TIER:strong\|mid\|cheap}}` (prose) | 5 | `Opus` / `Sonnet` / `Haiku` |
| frontmatter | 1,5,3,6 | rebuilt from per-unit metadata + adapter template |

`Read/Write/Edit/Grep/Glob/Bash` — **no token** (universal). Order substitutions longest-first so
`/translate-audit` is replaced before `/translate`, and `translate-lead` before `translate`.

**Exit test for Phase 0 (met):** re-running the seam greps accounts for 100% of tool-specific
references; every hit above is tagged to a seam. No reference lives outside these 8 files.
