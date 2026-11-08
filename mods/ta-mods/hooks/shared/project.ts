// Shared, READ-ONLY access to the translation project for every ta-mods feature.
// Nothing here writes, sends or logs project data. Features call `loadCoverage`
// or `loadGates` and never re-implement finding the config or diffing catalogs.
//
// The project is the current working directory: `translation.config.json` at the
// root (the same file /translate reads), plus the JSON message catalogs under it.
// Scope for this first cut: JSON message catalogs (en.json / de.json style), the
// most common surface and the one the eval-fixture uses. Other formats (.po, .ts,
// content trees) are not read yet, so a project with only those shows an empty
// state rather than a wrong number.

/** The part of `$.fs` this module needs; `$.fs` satisfies it structurally. */
export type ProjectFs = {
  list: (path?: string) => Promise<Array<{ name: string; kind: string }>>
  read: (path: string) => Promise<string | { base64: string }>
}

/**
 * Wraps `$.fs` for the helpers below. The engine forbids passing `$.fs` itself
 * around as a value (it must be spelled `$.fs.list(...)` at each call), so this
 * is the one place that spells the two calls out. Features pass their `$`.
 */
export function projectFs($: {
  fs: {
    list: (path?: string) => Promise<Array<{ name: string; kind: string }>>
    read: (path: string) => Promise<string | { base64: string }>
  }
}): ProjectFs {
  return {
    list: path => $.fs.list(path),
    read: path => $.fs.read(path),
  }
}

export type Config = {
  sourceLang: string
  targetLangs: string[]
  specialization: string | string[]
  gates: Array<{ name?: string }>
  output: { mode?: string; dir?: string }
}

/** Reads a file as text; null when missing or not text. */
export async function readText(fs: ProjectFs, path: string): Promise<string | null> {
  try {
    const got = await fs.read(path)

    return typeof got === 'string' ? got : null
  } catch {
    return null
  }
}

async function readJsonFile(fs: ProjectFs, path: string): Promise<unknown | null> {
  const text = await readText(fs, path)
  if (text === null) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * The project's `translation.config.json` (valid JSON — the `$comment_*` keys are
 * plain string values). Null when it is absent or unreadable. Defaults mirror the
 * toolkit: sourceLang `en`, specialization `general`.
 */
export async function findConfig(fs: ProjectFs): Promise<Config | null> {
  const raw = (await readJsonFile(fs, 'translation.config.json')) as Record<string, unknown> | null
  if (raw === null || typeof raw !== 'object') {
    return null
  }
  const targetLangs = Array.isArray(raw.targetLangs)
    ? (raw.targetLangs as unknown[]).filter((l): l is string => typeof l === 'string')
    : []
  const gates = Array.isArray(raw.gates) ? (raw.gates as Array<{ name?: string }>) : []
  const output = (raw.output as { mode?: string; dir?: string }) ?? {}

  return {
    sourceLang: typeof raw.sourceLang === 'string' ? raw.sourceLang : 'en',
    targetLangs,
    specialization:
      typeof raw.specialization === 'string' || Array.isArray(raw.specialization)
        ? (raw.specialization as string | string[])
        : 'general',
    gates,
    output,
  }
}

// ---------------------------------------------------------------- catalogs

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  'translations',
])
const MAX_DEPTH = 5

/** Nested JSON object -> flat `{ 'a.b.c': stringValue }`, leaf STRINGS only. */
export function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (typeof v === 'string') {
        out[key] = v
      } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(out, flatten(v, key))
      }
      // numbers / booleans / arrays are not catalog copy and are ignored.
    }
  }

  return out
}

export type CatalogDiff = {
  total: number
  translated: number
  /** Source keys absent from the target. */
  missing: string[]
  /** Target values that are empty strings. */
  empty: string[]
  /** Target values byte-identical to the non-empty source (untranslated). */
  leftover: string[]
  /** Keys in the target but absent from the source (`/translate` can't fill these). */
  sourceGaps: string[]
}

/** Pure: diff one source catalog against one target catalog. */
export function diffCatalog(
  source: Record<string, string>,
  target: Record<string, string>,
): CatalogDiff {
  const srcKeys = Object.keys(source)
  const missing: string[] = []
  const empty: string[] = []
  const leftover: string[] = []
  let translated = 0

  for (const k of srcKeys) {
    if (!(k in target)) {
      missing.push(k)
      continue
    }
    const tv = target[k] ?? ''
    const sv = source[k] ?? ''
    if (tv.trim() === '') {
      empty.push(k)
    } else if (tv === sv && sv.trim() !== '') {
      leftover.push(k)
    } else {
      translated++
    }
  }

  const sourceGaps = Object.keys(target).filter(k => !(k in source))

  return { total: srcKeys.length, translated, missing, empty, leftover, sourceGaps }
}

/** Per-language coverage, aggregated across every catalog group in the project. */
export type LangCoverage = {
  lang: string
  /** False when no `<lang>.json` sits beside any source catalog (not scaffolded). */
  present: boolean
  total: number
  translated: number
  missing: number
  empty: number
  leftover: number
  /** Up to a few sample source-gap keys (dir-qualified), for the "needs you" card. */
  sourceGaps: string[]
  sourceGapCount: number
  /** translated / total as a percent, or null when the language is not present. */
  pct: number | null
}

export type CoverageResult = {
  config: Config | null
  /** True once at least one `<sourceLang>.json` + `<lang>.json` pair was diffed. */
  hasCatalogs: boolean
  sourceLang: string
  langs: LangCoverage[]
}

function join(dir: string, name: string): string {
  return dir === '' ? name : `${dir}/${name}`
}

/** Collects every `*.json` path under the project, depth-limited, skipping heavy dirs. */
async function walkJson(fs: ProjectFs, dir: string, depth: number, acc: string[]): Promise<void> {
  if (depth > MAX_DEPTH) {
    return
  }
  let entries: Array<{ name: string; kind: string }>
  try {
    entries = await fs.list(dir === '' ? undefined : dir)
  } catch {
    return
  }
  for (const e of entries) {
    if (e.kind === 'dir') {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) {
        continue
      }
      await walkJson(fs, join(dir, e.name), depth + 1, acc)
    } else if (e.kind === 'file' && e.name.endsWith('.json')) {
      acc.push(join(dir, e.name))
    }
  }
}

/**
 * The one call the coverage and gates features make: find the config, scan for
 * JSON catalog groups (a directory holding `<sourceLang>.json`), and diff each
 * target language against the source. Read-only; null config => empty result.
 */
export async function loadCoverage($: Parameters<typeof projectFs>[0]): Promise<CoverageResult> {
  const fs = projectFs($)
  const config = await findConfig(fs)
  if (config === null) {
    return { config: null, hasCatalogs: false, sourceLang: 'en', langs: [] }
  }
  const sourceLang = config.sourceLang
  const paths: string[] = []
  await walkJson(fs, '', 0, paths)

  // Group basenames by directory.
  const byDir = new Map<string, Set<string>>()
  for (const p of paths) {
    const slash = p.lastIndexOf('/')
    const dir = slash < 0 ? '' : p.slice(0, slash)
    const base = slash < 0 ? p : p.slice(slash + 1)
    if (!byDir.has(dir)) {
      byDir.set(dir, new Set())
    }
    byDir.get(dir)!.add(base)
  }

  type Agg = {
    present: boolean
    total: number
    translated: number
    missing: number
    empty: number
    leftover: number
    sourceGaps: string[]
    sourceGapCount: number
  }
  const agg = new Map<string, Agg>()
  for (const lang of config.targetLangs) {
    agg.set(lang, {
      present: false,
      total: 0,
      translated: 0,
      missing: 0,
      empty: 0,
      leftover: 0,
      sourceGaps: [],
      sourceGapCount: 0,
    })
  }

  let hasCatalogs = false
  for (const [dir, bases] of byDir) {
    if (!bases.has(`${sourceLang}.json`)) {
      continue
    }
    const sourceObj = await readJsonFile(fs, join(dir, `${sourceLang}.json`))
    const sourceFlat = flatten(sourceObj)
    if (Object.keys(sourceFlat).length === 0) {
      continue
    }
    for (const lang of config.targetLangs) {
      if (!bases.has(`${lang}.json`)) {
        continue
      }
      const targetObj = await readJsonFile(fs, join(dir, `${lang}.json`))
      if (targetObj === null) {
        continue
      }
      hasCatalogs = true
      const d = diffCatalog(sourceFlat, flatten(targetObj))
      const a = agg.get(lang)!
      a.present = true
      a.total += d.total
      a.translated += d.translated
      a.missing += d.missing.length
      a.empty += d.empty.length
      a.leftover += d.leftover.length
      a.sourceGapCount += d.sourceGaps.length
      for (const k of d.sourceGaps) {
        if (a.sourceGaps.length < 6) {
          a.sourceGaps.push(join(dir, k))
        }
      }
    }
  }

  const langs: LangCoverage[] = config.targetLangs.map(lang => {
    const a = agg.get(lang)!

    return {
      lang,
      present: a.present,
      total: a.total,
      translated: a.translated,
      missing: a.missing,
      empty: a.empty,
      leftover: a.leftover,
      sourceGaps: a.sourceGaps,
      sourceGapCount: a.sourceGapCount,
      pct: a.present && a.total > 0 ? Math.round((a.translated / a.total) * 100) : a.present ? 100 : null,
    }
  })

  return { config, hasCatalogs, sourceLang, langs }
}

// ---------------------------------------------------------------- gates

export type GateVerdict = {
  lang: string
  /** Verdict file `.translate-gate/<lang>.json` present and parsed. */
  found: boolean
  status: 'pass' | 'fail' | 'unknown'
  findingCount: number
  /** First finding's issue text, for the card. */
  firstIssue: string
}

/** Reads the per-language gate verdicts written by a /translate run (Step 6.7). */
export async function loadGateVerdicts(
  fs: ProjectFs,
  langs: string[],
): Promise<GateVerdict[]> {
  const out: GateVerdict[] = []
  for (const lang of langs) {
    const raw = (await readJsonFile(fs, `.translate-gate/${lang}.json`)) as
      | { status?: string; findings?: Array<{ issue?: string }> }
      | null
    if (raw === null) {
      out.push({ lang, found: false, status: 'unknown', findingCount: 0, firstIssue: '' })
      continue
    }
    const findings = Array.isArray(raw.findings) ? raw.findings : []
    out.push({
      lang,
      found: true,
      status: raw.status === 'pass' ? 'pass' : raw.status === 'fail' ? 'fail' : 'unknown',
      findingCount: findings.length,
      firstIssue: typeof findings[0]?.issue === 'string' ? findings[0]!.issue! : '',
    })
  }

  return out
}
