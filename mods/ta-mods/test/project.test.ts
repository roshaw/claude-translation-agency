import { expect, test } from 'claude-code/testing'

import { buildGates, isComplete } from '../hooks/features/gates'
import { buildPanel } from '../hooks/features/panel'
import { diffCatalog, flatten, type Config, type GateVerdict, type LangCoverage } from '../hooks/shared/project'

// The eval-fixture catalogs (en = source, de = defective) carry exactly one of
// each planted gap class. These pin the diff to that answer key, with no LLM.
const EN = {
  app: { title: 'Task Manager', tagline: 'Organize your work' },
  auth: { signInPrompt: 'Please sign in to continue', welcome: 'Welcome back, {username}!', signOut: 'Sign out' },
  nav: { dashboard: 'Dashboard', settings: 'Settings' },
  errors: { notFound: 'The page was not found', saveFailed: 'Could not save your changes' },
  actions: { confirm: 'Confirm' },
}
const DE = {
  app: { title: 'Aufgabenverwaltung', tagline: 'Organisieren Sie Ihre Arbeit' },
  auth: { signInPrompt: 'Bitte zum Fortfahren einloggen.', welcome: 'Willkommen zurück!', signOut: 'Abmelden', rememberMe: 'Angemeldet bleiben' },
  nav: { dashboard: 'Übersicht', settings: '' },
  errors: { notFound: 'The page was not found', saveFailed: 'Deine Änderungen konnten nicht gespeichert werden' },
}

test('flatten keeps only leaf strings, dot-joined', () => {
  const flat = flatten(EN)
  expect(flat['app.title']).toBe('Task Manager')
  expect(flat['auth.welcome']).toBe('Welcome back, {username}!')
  expect(Object.keys(flat).length).toBe(10)
})

test('diffCatalog finds one of each planted gap class', () => {
  const d = diffCatalog(flatten(EN), flatten(DE))
  expect(d.total).toBe(10)
  expect(d.translated).toBe(7)
  expect(d.missing).toEqual(['actions.confirm'])
  expect(d.empty).toEqual(['nav.settings'])
  expect(d.leftover).toEqual(['errors.notFound'])
  expect(d.sourceGaps).toEqual(['auth.rememberMe'])
})

test('a fully-translated catalog is complete', () => {
  const l: LangCoverage = {
    lang: 'de', present: true, total: 10, translated: 10,
    missing: 0, empty: 0, leftover: 0, sourceGaps: [], sourceGapCount: 0, pct: 100,
  }
  expect(isComplete(l)).toBe(true)
})

test('buildPanel keeps only panel tiers and counts running', () => {
  const view = buildPanel([
    { id: '1', type: 'translate-senior', status: 'running', description: 'ja prose' } as never,
    { id: '2', type: 'translate-lead', status: 'running', description: 'QA batch 4' } as never,
    { id: '3', type: 'general-purpose', status: 'running', description: 'unrelated' } as never,
    { id: '4', type: 'translate-junior', status: 'idle', description: 'chrome' } as never,
  ])
  expect(view.agents.length).toBe(3)
  expect(view.running).toBe(2)
  expect(view.agents.every(a => a.type.startsWith('translate-'))).toBe(true)
})

test('buildGates: incomplete lang with a failing gate is held; a clean+passing lang ships', () => {
  const config: Config = { sourceLang: 'en', targetLangs: ['de', 'fr'], specialization: 'technical', gates: [{ name: 'readability' }], output: {} }
  const cover: LangCoverage[] = [
    { lang: 'de', present: true, total: 10, translated: 7, missing: 1, empty: 1, leftover: 1, sourceGaps: [], sourceGapCount: 0, pct: 70 },
    { lang: 'fr', present: true, total: 10, translated: 10, missing: 0, empty: 0, leftover: 0, sourceGaps: [], sourceGapCount: 0, pct: 100 },
  ]
  const verdicts: GateVerdict[] = [
    { lang: 'de', found: true, status: 'fail', findingCount: 2, firstIssue: 'above grade target' },
    { lang: 'fr', found: true, status: 'pass', findingCount: 0, firstIssue: '' },
  ]
  const view = buildGates(config, cover, verdicts)
  const de = view.langs.find(l => l.lang === 'de')!
  const fr = view.langs.find(l => l.lang === 'fr')!
  expect(de.held).toBe(true)
  expect(de.ship).toBe(false)
  expect(fr.ship).toBe(true)
  expect(view.held).toBe(1)
  expect(view.configuredGates).toEqual(['readability'])
})
