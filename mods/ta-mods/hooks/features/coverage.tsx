// Feature 1: Coverage — per-language completeness, the live form of
// /translate-audit. Rendered as the first SECTION of the single Translation pane
// (see register.tsx); this file owns the view logic and its drawing, not a pane.
//
// Data: translation.config.json + the project's JSON message catalogs, diffed in
// ../shared/project (read-only). Scored on the four gap classes shown inline per
// language: missing-in-target, source gap, empty, leftover.

import { type CoverageResult, type LangCoverage } from '../shared/project'
import { COLORS, meter, paneHeader, pill, type Tone, type UiTable } from '../shared/ui'

const NO_CATALOGS = 'No JSON message catalogs found yet. (This first cut reads <lang>.json catalogs.)'
const FOOTER = 'Read-only audit. Run /translate to fill the gaps.'

/** Colour the percent by how done the language is. */
export function pctTone(pct: number | null): Tone {
  if (pct === null) {
    return 'info'
  }
  if (pct >= 100) {
    return 'ok'
  }

  return pct >= 80 ? 'warn' : 'bad'
}

export function pctText(l: LangCoverage): string {
  return l.pct === null ? 'not scaffolded' : `${l.pct}%`
}

/** The status-line segment: each target language and its percent. */
export function statusText(result: CoverageResult): string | undefined {
  if (result.config === null || result.langs.length === 0) {
    return undefined
  }

  return result.langs
    .slice(0, 4)
    .map(l => `${l.lang} ${l.pct === null ? '—' : `${l.pct}%`}`)
    .join(' · ')
}

function gapPills(t: UiTable, l: LangCoverage) {
  const { Box, Text } = t
  const bits: Array<{ text: string; tone: Tone }> = []
  if (l.missing > 0) {
    bits.push({ text: `${l.missing} missing`, tone: 'bad' })
  }
  if (l.empty > 0) {
    bits.push({ text: `${l.empty} empty`, tone: 'warn' })
  }
  if (l.leftover > 0) {
    bits.push({ text: `${l.leftover} leftover`, tone: 'warn' })
  }
  if (l.sourceGapCount > 0) {
    bits.push({ text: `${l.sourceGapCount} source gap`, tone: 'info' })
  }
  if (bits.length === 0) {
    return <Text color={COLORS.ok}>complete</Text>
  }

  return <Box gap={1}>{bits.map(b => pill(t, b.text, b.tone))}</Box>
}

function langRow(t: UiTable, l: LangCoverage, columns: number) {
  const { Box, Text } = t
  const tone = pctTone(l.pct)

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between" gap={1}>
        <Box gap={1}>
          <Text weight="semibold">{l.lang}</Text>
          {pill(t, pctText(l), tone)}
        </Box>
        {l.present ? <Text dimColor>{`${l.translated}/${l.total}`}</Text> : null}
      </Box>
      {l.present ? meter(t, { fraction: l.pct === null ? 0 : l.pct / 100, tone, columns }) : null}
      {gapPills(t, l)}
    </Box>
  )
}

/** The Coverage section of the Translation pane. Assumes a config exists. */
export function coverageSection(t: UiTable, result: CoverageResult, columns: number) {
  const { Box, Text } = t

  return (
    <Box flexDirection="column" gap={1}>
      {paneHeader(t, 'Coverage', `${result.langs.length} langs`)}
      {!result.hasCatalogs ? <Text dimColor>{NO_CATALOGS}</Text> : null}
      {result.hasCatalogs ? (
        <Box flexDirection="column" gap={1}>
          {result.langs.map(l => langRow(t, l, columns))}
          <Text dimColor>{FOOTER}</Text>
        </Box>
      ) : null}
    </Box>
  )
}
