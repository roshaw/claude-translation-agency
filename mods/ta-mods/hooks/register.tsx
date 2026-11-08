import type { EngineInterface, Register } from 'claude-code'

import { coverageSection, statusText as coverageStatus } from './features/coverage'
import {
  buildGates,
  gatesApplicable,
  gatesBand,
  gatesSection,
  statusText as gatesStatus,
  type GatesView,
} from './features/gates'
import { loadPanel, panelBand, panelSection, statusText as panelStatus, type PanelView } from './features/panel'
import { loadCoverage, loadGateVerdicts, projectFs, type CoverageResult } from './shared/project'
import { setStatusSegment } from './shared/status'
import { paneHeader } from './shared/ui'

// One plugin, three features (Coverage, Panel, Gates), in ONE pane so the person
// never clicks between tabs. The features are stacked in a fixed order — Coverage,
// then Panel, then Gates — and Gates is shown ONLY when the project actually has
// gates. This file owns the single pane, the one band slot, and the per-plugin
// session/redraw hooks; each feature contributes a section renderer.

const PANE = 'ta-translation'
const TITLE = 'Translation'
const NO_CONFIG = 'No translation.config.json in this project. Run /translate-init first.'

type Collected = {
  cover: CoverageResult
  panelView: PanelView
  gates: GatesView
  showGates: boolean
}

/**
 * Loads every feature's view once per draw and refreshes the shared status line.
 * The Gates segment (like its section) only shows when the project has gates.
 */
async function collect($: EngineInterface): Promise<Collected> {
  const cover = await loadCoverage($)
  const panelView = await loadPanel($)
  const targetLangs = cover.config?.targetLangs ?? []
  const verdicts = await loadGateVerdicts(projectFs($), targetLangs)
  const gates = buildGates(cover.config, cover.langs, verdicts)
  const showGates = cover.config !== null && gatesApplicable(gates)

  setStatusSegment($, 'coverage', coverageStatus(cover))
  setStatusSegment($, 'panel', panelStatus(panelView))
  setStatusSegment($, 'gates', showGates ? gatesStatus(gates) : undefined)

  return { cover, panelView, gates, showGates }
}

export const register: Register = on => {
  // The single pane + slash command, opened once per session. One hook for the
  // whole plugin (the engine allows one unmatched hook per event), and deliberately
  // NOT gated on `isInteractive`: the desktop app runs with it false.
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'translation', description: 'Open the Translation pane (coverage, panel, gates)' })
    void $.ui.open({ id: PANE, title: TITLE })
    await collect($)

    return next(e)
  })

  // Redraw the pane around each turn. Registered once: the engine allows one
  // unmatched hook per event per plugin.
  on('prompt.submit', ($, e, next) => {
    $.ui.invalidate('ui.render')

    return next(e)
  })
  on('turn.complete', ($, e, next) => {
    $.ui.invalidate('ui.render')

    return next(e)
  })

  on('command.run', { command: 'translation' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'The Translation pane is open.' }
  })

  // One band slot above the prompt, composed here. Priority: a held gate (it blocks
  // delivery) outranks a running panel. Each builder returns a tree or null.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }
    const t = $.ui.resolve(e)
    const held = await gatesBand($, t)
    if (held !== null) {
      return held
    }
    const running = await panelBand($, t)
    if (running !== null) {
      return running
    }

    return next(e)
  })

  // The one pane: Coverage, then Panel, then Gates (only when applicable).
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { cover, panelView, gates, showGates } = await collect($)
    const t = $.ui.resolve(e)
    const { Box, Text } = t
    const columns = Math.max(10, e.props.bodyColumns - 4)

    if (cover.config === null) {
      return (
        <Box flexDirection="column" gap={1}>
          {paneHeader(t, TITLE)}
          <Text dimColor>{NO_CONFIG}</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1}>
        {coverageSection(t, cover, columns)}
        {panelSection(t, panelView)}
        {showGates ? gatesSection(t, gates) : null}
      </Box>
    )
  })
}
