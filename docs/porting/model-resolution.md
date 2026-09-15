# Dynamic model resolution (seam 5)

Model IDs drift and depend on what each operator actually has access to, so they are **not**
hardcoded. `tiers.json` maps the panel's tiers (`strong` = Lead/QA, `mid` = Senior/Researcher,
`cheap` = Junior) to a concrete model **per tool**, and [`tools/resolve-models.mjs`](../../tools/resolve-models.mjs)
(`npm run models`) fills it from the tool's *actually-available* models.

This is separate from the generator on purpose — resolution is an interactive/operator step (it may
run a discovery command), while `npm run build:agents` stays deterministic and headless. The Claude
column is intrinsic (`opus`/`sonnet`/`haiku`, read from each agent's `.claude/` frontmatter) and isn't
resolved here.

## Commands

```bash
npm run models -- --check                       # show the current tier→model map for every tool + gaps
npm run models -- <tool>                         # LIST the tool's available models (via its discovery cmd)
npm run models -- <tool> --cmd "<command>"       #   ...from a custom discovery command
npm run models -- <tool> --file <path>           #   ...from a file (one model id per line)
npm run models -- <tool> strong=<id> mid=<id> cheap=<id>   # WRITE the choices into tiers.json
npm run models -- <tool> --clear                 # UNRESOLVE all tiers → agents inherit the tool's default
```

## Unresolved tiers inherit the tool's default

A tier whose model is `null`/absent in `tiers.json` is **unresolved**. The generator then **omits
`model:`** from that agent and leaves a `# tier: <tier> — model unresolved; inherits …` annotation, so
the agent uses whatever default the tool is configured with. This is what makes a generated tree work
**before** you pin any IDs (and avoids shipping stale/placeholder IDs). Pin real per-tier models later
with the `set` form to regain the panel's cheap/expensive tiering. The Layer-2 lint enforces the
contract both ways: a resolved tier **must** pin the matching model; an unresolved tier **must** omit
it. `--clear <tool>` sets every tier for a tool back to unresolved.

(With npm, the `--` passes the args through to the script; calling `node tools/resolve-models.mjs …`
directly needs no `--`.)

## How discovery works

- Each adapter may declare a `modelsCommand` (OpenCode: `"opencode models"`). `npm run models <tool>`
  runs it and extracts the model ids from stdout.
- If the tool isn't on `PATH` (e.g. OpenCode Desktop ships `opencode-cli.exe` under
  `~/AppData/Local/opencode/`), pass the full path with `--cmd`:

      node tools/resolve-models.mjs opencode --cmd "$HOME/AppData/Local/opencode/opencode-cli.exe models --pure"

- No discovery command (Codex/Copilot don't have one wired) → list the models yourself and pass them
  with the `set` form, or `--file`.

## Typical flow

1. **Auth the provider** in the tool first (otherwise discovery only shows free/anonymous models —
   e.g. OpenCode with no credentials lists only `opencode/*-free` models).
2. `npm run models -- <tool>` to see what's available.
3. `npm run models -- <tool> strong=<id> mid=<id> cheap=<id>` to write the mapping.
4. `npm run build:agents` to regenerate that tool's tree with the resolved models.
5. `npm test` (Layer 2 lint asserts each agent's frontmatter model matches `tiers.json`).

## Notes

- `set` rewrites `tiers.json` as normalized JSON (content preserved; the `$comment`/`prose` keys are
  kept). Re-run `build:agents` afterward so the trees pick up the new ids.
- The values shipped in `tiers.json` for non-Claude tools are **starting placeholders** — resolve them
  against your own access before a real (Layer 5) run.
