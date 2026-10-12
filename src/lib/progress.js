// All readiness / progress numbers are calculated from what the student actually did.
import { today } from './storage.js'

const clamp01 = (n) => Math.max(0, Math.min(1, n))

export function packProgress(state, pack) {
  if (!pack) return null
  const m = state.mastery[pack.id] || {}
  const sectionsRead = (pack.readSections || []).length
  const termKeys = Object.keys(m).filter((k) => k.startsWith('t'))
  const termsReviewed = termKeys.length
  const termsMastered = termKeys.filter((k) => m[k].box >= 3).length
  const typingSessions = pack.typingSessions || 0
  const panelSessions = pack.panelSessions || 0
  const panelBest = pack.panelBest || 0
  return {
    sections: { done: sectionsRead, total: pack.sections.length },
    terms: { reviewed: termsReviewed, mastered: termsMastered, total: pack.terms.length },
    typing: { done: typingSessions, goal: 5 },
    panel: { sessions: panelSessions, best: panelBest },
  }
}

export function readiness(state, pack) {
  const p = packProgress(state, pack)
  const c = state.profile.confidence || {}
  const checklist = Object.values(state.profile.checklist || {}).filter(Boolean).length

  const knowledge = p
    ? clamp01(0.4 * (p.sections.done / Math.max(p.sections.total, 1)) + 0.6 * ((p.terms.mastered + p.terms.reviewed * 0.25) / Math.max(p.terms.total, 1)))
    : 0
  const practice = p ? clamp01(0.6 * (p.panel.best / 10) + 0.4 * (p.typing.done / p.typing.goal)) : 0
  const confidence = clamp01(0.5 * ((c.drills || 0) / 5) + 0.2 * ((c.breaths || 0) / 3) + 0.3 * (checklist / 10))
  const overall = 0.4 * knowledge + 0.35 * practice + 0.25 * confidence
  const pct = (x) => Math.round(x * 100)
  return { overall: pct(overall), knowledge: pct(knowledge), practice: pct(practice), confidence: pct(confidence) }
}

export const FOCUS_TASKS = [
  { id: 'method', label: 'Review your methodology', to: 'guide' },
  { id: 'terms', label: 'Practice 5 key terms', to: 'cards' },
  { id: 'panel', label: 'Answer one panel question', to: 'panel' },
]

export function focusDone(state) {
  const f = state.profile.focus
  return f?.date === today() ? f.done || {} : {}
}
