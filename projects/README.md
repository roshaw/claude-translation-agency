# Projects registry & memory

This folder is the Translation Agency's record of **every project it translates** — a machine-
readable index plus a human-readable memory file per project. It lets any future run answer "what
projects am I working with, and what do I already know about this one?" without re-deriving it.

**This data is LOCAL, not committed.** `registry.json` and every `<slug>/` folder are git-ignored
(see the repo `.gitignore`) — they hold private, project-specific data (client names, local paths,
terminology, notes) that must not land in this public toolkit repo, and keeping them out also stops
every `init`/`translate` run from showing up as a diff. The toolkit ships only `_template/` and this
README; the skills recreate `registry.json` and the per-project folders locally as you use them. If
you want a project's memory to travel between your own machines, sync the `projects/<slug>/` folder
yourself (e.g. a private repo or file sync) — don't commit it here.

## Layout

```
projects/
├── registry.json         # LOCAL index of all projects (paths, langs, specialization, status, last run) — git-ignored
├── _template/
│   └── notes.md          # copied to projects/<slug>/notes.md for a new project (tracked)
└── <slug>/               # LOCAL, git-ignored — one folder per project (slug = kebab-case of the project name)
    ├── notes.md          # per-project memory (purpose/context, decisions, quirks, run log)
    ├── glossary.csv      # the run glossary — written by the research pass, editable by you
    └── queries-<date>.md # async uncertainty log — the translator's questions for you to review
```

### `glossary.csv`

Columns: `source,lang,term,context,confidence,source,notes`. Written and updated by the
`translate-researcher` agent (the research pass) and consumed by the translator panel as the
authority on terminology. **You can edit it** — human rows are never overwritten by research. A row
with `lang=*` marks a do-not-translate term. It overrides the domain specialization on any term it
defines.

### `queries-<date>.md`

Where the translator logs strings it was genuinely unsure about — its best-guess rendering plus the
question it would ask — **without interrupting the run**. Review it whenever you want; answer by
editing `glossary.csv` or `notes.md`, and the next run treats it as settled. This is the async
alternative to being asked questions mid-translation.

## `registry.json`

An index array; each entry:

```json
{
  "slug": "myapp",
  "name": "MyApp",
  "path": "C:\\Projects\\MyApp",
  "sourceLang": "en",
  "targetLangs": ["de", "fr"],
  "specialization": "technical",
  "outputMode": "tree",
  "status": "active",
  "addedAt": "2026-07-31",
  "lastRunAt": "",
  "notes": "projects/myapp/notes.md"
}
```

`status`: `active` | `paused` | `done`. `lastRunAt` is stamped by `/translate` after each pass.

## Who maintains it

- **`/translate-init`** — when it sets up a project, it adds a registry entry and creates
  `projects/<slug>/notes.md` from the template (unless one already exists).
- **`/translate`** — at the **start** of a run it looks the project up by path, and if found reads
  `notes.md` for context (terminology decisions, quirks, what "done" means here). At the **end** it
  updates `lastRunAt` / `status` in the registry and appends a run-log line to `notes.md`.
- **You** — hand-edit either file anytime; both are plain text/JSON.

## Per-project memory (`notes.md`)

The durable knowledge about a project that isn't obvious from its files: which languages and why,
the chosen specialization and any glossary decisions, terminology calls made during review, format
quirks, what to leave verbatim, known issues, and a dated run log. Keep it tight — it's read at the
start of every run, so it should be the *decisions*, not a transcript.
