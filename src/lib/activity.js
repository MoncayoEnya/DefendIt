// Records what the student actually did each day, so Today's focus and the prep plan
// can tick themselves off automatically.
import { today } from './storage.js'

// keys: chapters, cards, match, typing, panel, breathing, drill, explain, slides, daily
export function logActivity(s, key, n = 1) {
  const d = today()
  const log = { ...(s.profile.activityLog || {}) }
  const day = { ...(log[d] || {}) }
  day[key] = (day[key] || 0) + n
  log[d] = day
  // keep about three months of history
  const keys = Object.keys(log).sort()
  while (keys.length > 100) delete log[keys.shift()]
  return { ...s, profile: { ...s.profile, activityLog: log } }
}

export function countsOn(state, date = today()) {
  return state.profile.activityLog?.[date] || {}
}

// Some goals are read from saved state instead of the daily log.
export function metricValue(state, task, date = today()) {
  if (task.metric === 'checklist') return Object.values(state.profile.checklist || {}).filter(Boolean).length
  return countsOn(state, date)[task.metric] || 0
}

export function taskDone(state, task, date = today()) {
  const manual = state.profile.focus?.date === date && state.profile.focus.done?.[task.id]
  return !!manual || metricValue(state, task, date) >= task.goal
}
