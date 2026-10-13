// Everything is saved in the browser (free, no account needed).
const KEY = 'defendit:v1'

const defaults = {
  settings: { apiKey: '', model: 'gemini-2.5-flash', theme: 'system' },
  profile: { xp: 0, streak: 0, lastDay: '', best: {}, fillerHistory: [] },
  packs: [], // study packs made from uploaded files
  activeId: null,
  mastery: {}, // { [packId]: { [itemKey]: { box: 0-5, due: timestamp } } }
}

export function withDefaults(obj) {
  const d = structuredClone(defaults)
  if (!obj) return d
  return { ...d, ...obj, settings: { ...d.settings, ...obj.settings }, profile: { ...d.profile, ...obj.profile } }
}

export function load() {
  try {
    return withDefaults(JSON.parse(localStorage.getItem(KEY)))
  } catch {
    return withDefaults(null)
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked – app still works for this session */
  }
}

export const LEVELS = [
  { xp: 0, name: 'Freshman' },
  { xp: 150, name: 'Researcher' },
  { xp: 400, name: 'Data Wrangler' },
  { xp: 800, name: 'Defender' },
  { xp: 1500, name: 'Panel Slayer' },
  { xp: 2500, name: 'Thesis Legend' },
]

export function levelInfo(xp) {
  let i = 0
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++
  const cur = LEVELS[i]
  const next = LEVELS[i + 1]
  const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1
  return { level: i + 1, name: cur.name, next, pct }
}

// Local calendar date (YYYY-MM-DD), so a day starts at midnight where the student lives.
export function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Spaced repetition (Leitner boxes): wrong answers come back sooner.
const GAPS = [0, 1, 3, 7, 14, 30].map((d) => d * 86400000)
export function review(mastery, key, correct) {
  const cur = mastery[key] || { box: 0, due: 0 }
  const box = correct ? Math.min(cur.box + 1, 5) : 0
  return { ...mastery, [key]: { box, due: Date.now() + GAPS[box] } }
}

// Adds to a counter in profile.stats (returns a new state).
export function bumpStat(s, key, n = 1) {
  const st = { ...(s.profile.stats || {}) }
  st[key] = (st[key] || 0) + n
  return { ...s, profile: { ...s.profile, stats: st } }
}
