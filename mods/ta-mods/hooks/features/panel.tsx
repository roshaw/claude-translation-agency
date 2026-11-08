// Feature 2: Translator panel (live) — the three-tier panel while a /translate
// run is in flight. Rendered as the second SECTION of the single Translation pane
// (see register.tsx), and as the band above the prompt while a run is active.
//
// Data: `$.agent.list()`, filtered to the panel agent types (translate-lead,
// translate-senior, translate-junior, translate-researcher). Read-only: it
// observes the run, it does not drive it. Empty state when no run is active.

import type { AgentInfo } from 'claude-code'

import { band, card, COLORS, paneHeader, pill, type Tone, type UiTable } from '../shared/ui'

const EMPTY_TEXT = 'No translation run active. Start one with /translate and the panel appears here.'

const TIERS: Record<string, { label: string; tone: Tone }> = {
  'translate-lead': { label: 'lead', tone: 'violet' },
  'translate-senior': { label: 'senior', tone: 'info' },
  'translate-junior': { label: 'junior', tone: 'ok' },
  'translate-researcher': { label: 'researcher', tone: 'warn' },
}

export type PanelAgent = {
  id: string
  type: string
  label: string
  tone: Tone
  running: boolean
  description: string
}

export type PanelView = {
  agents: PanelAgent[]
  running: number
}

/** Pure: the engine's agent list -> the panel agents, panel tiers only. */
export function buildPanel(list: AgentInfo[]): PanelView {
  const agents: PanelAgent[] = []
  for (const a of list) {
    const tier = TIERS[a.type]
    if (tier === undefined) {
      continue
    }
    agents.push({
      id: a.id,
      type: a.type,
      label: tier.label,
      tone: tier.tone,
      running: a.status === 'running',
      description: a.description ?? '',
    })
  }
  agents.sort((x, y) => (x.running === y.running ? x.label.localeCompare(y.label) : x.running ? -1 : 1))

  return { agents, running: agents.filter(a => a.running).length }
}

export function statusText(view: PanelView): string | undefined {
  if (view.agents.length === 0) {
    return undefined
  }

  return `panel: ${view.running}/${view.agents.length}`
}

export async function loadPanel($: { agent: { list: () => Promise<AgentInfo[]> } }): Promise<PanelView> {
  let list: AgentInfo[]
  try {
    list = await $.agent.list()
  } catch {
    list = []
  }

  return buildPanel(list)
}

function agentCard(t: UiTable, a: PanelAgent) {
  const { Box, Text } = t

  return card(
    t,
    'neutral',
    <Box flexDirection="column">
      <Box justifyContent="space-between" gap={1}>
        <Box gap={1}>
          <Text color={a.running ? COLORS.accent : COLORS.dim}>{a.running ? '●' : '○'}</Text>
          {pill(t, a.label, a.tone)}
        </Box>
        <Text dimColor>{a.running ? 'running' : 'idle'}</Text>
      </Box>
      {a.description !== '' ? <Text dimColor>{a.description}</Text> : null}
    </Box>,
  )
}

/** The Panel section of the Translation pane. */
export function panelSection(t: UiTable, view: PanelView) {
  const { Box, Text } = t

  return (
    <Box flexDirection="column" gap={1}>
      {paneHeader(t, 'Panel', view.agents.length === 0 ? undefined : `${view.agents.length} active`)}
      {view.agents.length === 0 ? (
        <Text dimColor>{EMPTY_TEXT}</Text>
      ) : (
        <Box flexDirection="column" gap={1}>
          {view.agents.map(a => agentCard(t, a))}
        </Box>
      )}
    </Box>
  )
}

/** The band above the prompt while a run is active; null to show nothing. */
export async function panelBand($: { agent: { list: () => Promise<AgentInfo[]> } }, t: UiTable) {
  const view = await loadPanel($)
  if (view.running === 0) {
    return null
  }
  const { Box, Text } = t

  return band(
    t,
    'neutral',
    <Box gap={1}>
      <Text color={COLORS.accent} weight="semibold">
        ● Panel running
      </Text>
      <Text color={COLORS.muted}>{`${view.running} of ${view.agents.length} agent(s) working`}</Text>
    </Box>,
  )
}
