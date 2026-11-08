// Feature 6: Delivery gates — completeness + each project gate's verdict. Rendered
// as the third SECTION of the single Translation pane, but ONLY when the project
// actually has gates (configured in translation.config.json, or verdict files from
// a run). A project with no gates never shows this section. Also the band above
// the prompt when a gate holds a language back.
//
// Data: ../shared/project — completeness from the same catalog diff as Coverage;
// gate verdicts from the files a /translate run writes (.translate-gate/<lang>.json).
// Read-only.

import {
  loadCoverage,
  loadGateVerdicts,
  projectFs,
  type Config,
  type GateVerdict,
  type LangCoverage,
} from '../shared/project'
import { band, card, COLORS, paneHeader, pill, type Tone, type UiTable } from '../shared/ui'

const FOOTER = 'Gates run on the final output, after completeness, before build. An accept is reported as overridden.'

export type GateLang = {
  lang: string
  present: boolean
  complete: boolean
  gateFound: boolean
  gateStatus: 'pass' | 'fail' | 'unknown'
  findingCount: number
  firstIssue: string
  ship: boolean
  held: boolean
}

export type GatesView = {
  config: Config | null
  langs: GateLang[]
  configuredGates: string[]
  held: number
  ship: number
}

/** True when every planted gap class is clear for a language. */
export function isComplete(l: LangCoverage): boolean {
  return l.present && l.missing === 0 && l.empty === 0 && l.leftover === 0
}

/** Pure: fold coverage + gate verdicts into the per-language delivery view. */
export function buildGates(
  config: Config | null,
  cover: LangCoverage[],
  verdicts: GateVerdict[],
): GatesView {
  const byLang = new Map(verdicts.map(v => [v.lang, v]))
  const langs: GateLang[] = cover.map(l => {
    const v = byLang.get(l.lang)
    const complete = isComplete(l)
    const gateFound = v?.found ?? false
    const gateStatus = v?.status ?? 'unknown'
    const held = gateFound && gateStatus === 'fail'
    const ship = complete && !held && (!gateFound || gateStatus === 'pass')

    return {
      lang: l.lang,
      present: l.present,
      complete,
      gateFound,
      gateStatus,
      findingCount: v?.findingCount ?? 0,
      firstIssue: v?.firstIssue ?? '',
      ship,
      held,
    }
  })
  const configuredGates = (config?.gates ?? [])
    .map(g => (typeof g.name === 'string' ? g.name : ''))
    .filter(n => n !== '')

  return {
    config,
    langs,
    configuredGates,
    held: langs.filter(l => l.held).length,
    ship: langs.filter(l => l.ship).length,
  }
}

/**
 * Whether the Gates section applies to this project at all: it does only when the
 * project configures gates, or a run already wrote gate verdicts. Otherwise the
 * section (and its status segment) are not shown — Coverage already conveys
 * completeness, so there is nothing a gate-less project needs here.
 */
export function gatesApplicable(view: GatesView): boolean {
  return view.configuredGates.length > 0 || view.langs.some(l => l.gateFound)
}

export function statusText(view: GatesView): string | undefined {
  if (view.config === null || view.langs.length === 0 || !gatesApplicable(view)) {
    return undefined
  }

  return `gates: ${view.ship}/${view.langs.length}`
}

/** Loads coverage + verdicts and folds them; used by the band (the pane reuses its own load). */
export async function loadGates($: Parameters<typeof loadCoverage>[0]): Promise<GatesView> {
  const cover = await loadCoverage($)
  const langs = cover.config?.targetLangs ?? []
  const verdicts = await loadGateVerdicts(projectFs($), langs)

  return buildGates(cover.config, cover.langs, verdicts)
}

function statusPill(t: UiTable, l: GateLang) {
  if (l.held) {
    return pill(t, 'held', 'bad')
  }
  if (l.ship) {
    return pill(t, 'ship', 'ok')
  }

  return pill(t, l.present ? 'incomplete' : 'not scaffolded', 'warn')
}

function langCard(t: UiTable, l: GateLang) {
  const { Box, Text } = t
  const tone: Tone = l.held ? 'bad' : l.ship ? 'neutral' : 'warn'
  const completeMark = l.complete ? '✓ complete' : '✗ incomplete'
  const gateMark = !l.gateFound ? '— no gate verdict' : l.gateStatus === 'pass' ? '✓ gates' : '✗ gates'

  return card(
    t,
    tone,
    <Box flexDirection="column">
      <Box justifyContent="space-between" gap={1}>
        <Text weight="semibold">{l.lang}</Text>
        {statusPill(t, l)}
      </Box>
      <Text dimColor>{`${completeMark} · ${gateMark}`}</Text>
      {l.held && l.firstIssue !== '' ? (
        <Text color={COLORS.warn}>{`${l.firstIssue}${l.findingCount > 1 ? ` (+${l.findingCount - 1} more)` : ''}`}</Text>
      ) : null}
    </Box>,
  )
}

/** The Gates section of the Translation pane. Only render it when gatesApplicable(view). */
export function gatesSection(t: UiTable, view: GatesView) {
  const { Box, Text } = t

  return (
    <Box flexDirection="column" gap={1}>
      {paneHeader(t, 'Gates', `${view.ship}/${view.langs.length} ship`)}
      {view.langs.map(l => langCard(t, l))}
      <Text dimColor>
        {view.configuredGates.length === 0
          ? 'Gate verdicts from a past run — no gates currently configured.'
          : `Project gates: ${view.configuredGates.join(', ')}`}
      </Text>
      <Text dimColor>{FOOTER}</Text>
    </Box>
  )
}

/** The band above the prompt when a gate holds a language back; null otherwise. */
export async function gatesBand($: Parameters<typeof loadCoverage>[0], t: UiTable) {
  const view = await loadGates($)
  if (view.held === 0) {
    return null
  }
  const { Box, Text } = t
  const names = view.langs.filter(l => l.held).map(l => l.lang).join(', ')

  return band(
    t,
    'warn',
    <Box gap={1}>
      <Text color={COLORS.warn} weight="semibold">
        {`🚦 ${view.held} language held`}
      </Text>
      <Text color={COLORS.muted}>{`${names} — gate failed`}</Text>
    </Box>,
  )
}
