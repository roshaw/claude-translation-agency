// Shared drawing pieces for every ta-mods feature (card, pill, meter, pane
// header, band, legend). Ported from the LayOff comeback-mods look. Each helper
// takes the element table from `$.ui.resolve(e)`, because elements are per surface.
//
// Motion: the same elements and animations for everyone; nothing here reads a
// motion preference. The terminal cannot animate, so it draws the static bar;
// that is a surface limit, not a preference.

import type { Elements, RenderChildren, RenderSurface } from 'claude-code'

export type UiTable = Elements[RenderSurface]

/** Meaning of a color. */
export type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'info' | 'violet'

export const COLORS = {
  text: '#e8e6e3',
  muted: '#9a978f',
  dim: '#6b6963',
  ok: '#6fbf73',
  warn: '#e0b04a',
  bad: '#e06c5a',
  info: '#6aa7e0',
  violet: '#a58be0',
  accent: '#d97757',
  track: '#2a2a2f',
  card: '#232327',
  line: '#2e2e33',
  warnLine: '#6b5524',
  badLine: '#7a3a30',
} as const

export function toneColor(tone: Tone): string {
  switch (tone) {
    case 'ok':
      return COLORS.ok
    case 'warn':
      return COLORS.warn
    case 'bad':
      return COLORS.bad
    case 'info':
      return COLORS.info
    case 'violet':
      return COLORS.violet
    default:
      return COLORS.muted
  }
}

/** Pane title row: bold title, dim note on the right (`3 langs`). */
export function paneHeader(t: UiTable, title: string, note?: string) {
  const { Box, Text } = t

  return (
    <Box justifyContent="space-between">
      <Text weight="semibold">{title}</Text>
      {note !== undefined ? <Text dimColor>{note}</Text> : null}
    </Box>
  )
}

/** A bordered card. `tone` tints the border for warn / bad. */
export function card(t: UiTable, tone: Tone, children: RenderChildren) {
  const { Box } = t
  const borderColor =
    tone === 'warn' ? COLORS.warnLine : tone === 'bad' ? COLORS.badLine : COLORS.line

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
      {children}
    </Box>
  )
}

/** A small label: `88%`, `source gap`. */
export function pill(t: UiTable, text: string, tone: Tone) {
  const { Text } = t

  return (
    <Text color={toneColor(tone)} weight="semibold">
      {text}
    </Text>
  )
}

/** A dim group label above a list. */
export function groupLabel(t: UiTable, text: string) {
  const { Text } = t

  return (
    <Text dimColor weight="semibold">
      {text}
    </Text>
  )
}

/** SMIL opacity pulse shared by every pulsing SVG. */
export const PULSE_SMIL =
  '<animate attributeName="opacity" values="1;0.45;1" dur="1.6s" repeatCount="indefinite"/>'

/**
 * A horizontal meter filled to `fraction` (0..1). On the graphical surfaces it
 * grows in and, at `bad`, pulses (SMIL). The terminal draws a plain filled bar.
 */
export function meter(t: UiTable, opts: { fraction: number; tone: Tone; columns: number }) {
  const { Box } = t
  const fraction = Math.max(0, Math.min(1, opts.fraction))
  const color = toneColor(opts.tone === 'neutral' ? 'ok' : opts.tone)

  if ('Svg' in t) {
    const { Svg } = t
    const fill = Math.round(fraction * 100)
    const pulse = opts.tone === 'bad' ? PULSE_SMIL : ''
    const source =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 8" preserveAspectRatio="none">` +
      `<rect width="100" height="8" rx="4" fill="${COLORS.track}"/>` +
      `<rect width="${fill}" height="8" rx="4" fill="${color}">` +
      `<animate attributeName="width" from="0" to="${fill}" dur="1.2s" fill="freeze"/>${pulse}</rect></svg>`

    return <Svg source={source} alt={`${fill}%`} width={Math.max(40, opts.columns * 8)} height={8} isInteractive />
  }

  const cells = Math.max(4, opts.columns)
  const filled = Math.round(fraction * cells)

  return (
    <Box width={cells} height={1} backgroundColor={COLORS.track}>
      <Box width={filled} height={1} backgroundColor={color} />
    </Box>
  )
}

/** Rows of colour swatch, label and a right-aligned dim value. */
export function legend(t: UiTable, rows: Array<{ tone: Tone; label: string; value: string }>) {
  const { Box, Text } = t

  return (
    <Box flexDirection="column">
      {rows.map(r => (
        <Box justifyContent="space-between" gap={1}>
          <Box gap={1}>
            <Text color={toneColor(r.tone)}>■</Text>
            <Text>{r.label}</Text>
          </Box>
          <Text dimColor>{r.value}</Text>
        </Box>
      ))}
    </Box>
  )
}

/**
 * The band above the prompt. Tint follows `tone`; `children` are Text nodes.
 * The fill is dark, so every Text inside must set an explicit light `color`
 * (COLORS.text / COLORS.muted / a tone color). Never leave it to the theme or
 * `dimColor`: in the light theme that gives dark text on dark fill.
 */
export function band(t: UiTable, tone: Tone, children: RenderChildren) {
  const { Box } = t
  const backgroundColor =
    tone === 'warn' ? '#3a2f17' : tone === 'bad' ? '#3a1d19' : tone === 'ok' ? '#16271a' : COLORS.card

  return (
    <Box backgroundColor={backgroundColor} paddingX={1} gap={1}>
      {children}
    </Box>
  )
}
