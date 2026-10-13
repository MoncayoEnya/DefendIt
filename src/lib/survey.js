// Evaluation survey for your thesis "Results" chapter.
// Part B is the standard System Usability Scale (SUS, Brooke 1996).
// Part C rates DefendIt's own goals, grouped by ISO/IEC 25010 quality characteristics.

export const SCALE = [
  { v: 1, short: 'SD', label: 'Strongly disagree' },
  { v: 2, short: 'D', label: 'Disagree' },
  { v: 3, short: 'N', label: 'Neutral' },
  { v: 4, short: 'A', label: 'Agree' },
  { v: 5, short: 'SA', label: 'Strongly agree' },
]

export const SUS = [
  'I think that I would like to use this app frequently.',
  'I found the app unnecessarily complex.',
  'I thought the app was easy to use.',
  'I think that I would need the support of a technical person to be able to use this app.',
  'I found the various functions in this app were well integrated.',
  'I thought there was too much inconsistency in this app.',
  'I would imagine that most people would learn to use this app very quickly.',
  'I found the app very cumbersome to use.',
  'I felt very confident using the app.',
  'I needed to learn a lot of things before I could get going with this app.',
]

export const GROUPS = [
  {
    id: 'functional', name: 'Functional suitability', items: [
      ['f1', 'The study guide correctly summarized my thesis.'],
      ['f2', 'The panel questions were relevant to my study.'],
      ['f3', 'The AI feedback helped me improve my answers.'],
    ],
  },
  {
    id: 'usability', name: 'Usability', items: [
      ['u1', 'The screens are easy to read and understand.'],
      ['u2', 'I always knew what to do next.'],
    ],
  },
  {
    id: 'performance', name: 'Performance efficiency', items: [
      ['p1', 'The app responded quickly.'],
    ],
  },
  {
    id: 'reliability', name: 'Reliability', items: [
      ['r1', 'The app worked without errors.'],
    ],
  },
  {
    id: 'effectiveness', name: 'Effectiveness', items: [
      ['e1', 'DefendIt helped me prepare for my defense.'],
      ['e2', 'The games made studying more engaging.'],
      ['e3', 'I feel more confident about my defense after using DefendIt.'],
    ],
  },
]

export const ROLES = ['Student', 'Adviser or faculty', 'Panel member', 'Other']

export const allItemKeys = () => [...SUS.map((_, i) => `sus${i + 1}`), ...GROUPS.flatMap((g) => g.items.map(([k]) => k))]

// SUS score 0-100: odd items (score - 1), even items (5 - score), sum x 2.5
export function susScore(a) {
  let sum = 0
  for (let i = 1; i <= 10; i++) {
    const v = Number(a[`sus${i}`])
    if (!v) return null
    sum += i % 2 ? v - 1 : 5 - v
  }
  return sum * 2.5
}

// Adjective rating (Bangor, Kortum and Miller, 2009)
export function susAdjective(score) {
  if (score == null) return '-'
  if (score >= 85.5) return 'Excellent'
  if (score >= 71.4) return 'Good'
  if (score >= 50.9) return 'OK'
  if (score >= 35.7) return 'Poor'
  return 'Worst imaginable'
}

export function susAcceptability(score) {
  if (score == null) return '-'
  if (score >= 70) return 'Acceptable'
  if (score >= 50) return 'Marginal'
  return 'Not acceptable'
}

// Common 5-point Likert interpretation used in Philippine theses
export function interpret(mean) {
  if (mean == null || Number.isNaN(mean)) return '-'
  if (mean >= 4.21) return 'Strongly agree'
  if (mean >= 3.41) return 'Agree'
  if (mean >= 2.61) return 'Neutral'
  if (mean >= 1.81) return 'Disagree'
  return 'Strongly disagree'
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const sd = (xs) => {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100)

export function summarize(responses) {
  const rows = responses.map((r) => r.answers || r)
  const sus = rows.map(susScore).filter((x) => x != null)
  const items = {}
  for (const k of allItemKeys()) {
    const vals = rows.map((a) => Number(a[k])).filter(Boolean)
    items[k] = { mean: r2(mean(vals)), sd: r2(sd(vals)), n: vals.length, interpretation: interpret(mean(vals)) }
  }
  const groups = GROUPS.map((g) => {
    const vals = rows.flatMap((a) => g.items.map(([k]) => Number(a[k])).filter(Boolean))
    return { ...g, mean: r2(mean(vals)), interpretation: interpret(mean(vals)) }
  })
  const roles = Object.fromEntries(ROLES.map((r) => [r, rows.filter((a) => a.role === r).length]))
  const susMean = mean(sus)
  return {
    n: rows.length,
    sus: { mean: r2(susMean), sd: r2(sd(sus)), adjective: susAdjective(susMean), acceptability: susAcceptability(susMean), aboveAverage: susMean != null && susMean > 68 },
    items, groups, roles,
    liked: rows.map((a) => a.liked).filter(Boolean),
    improve: rows.map((a) => a.improve).filter(Boolean),
  }
}

export function toCsv(responses) {
  const keys = allItemKeys()
  const head = ['submitted_at', 'role', 'course', 'used_for_defense', ...keys, 'sus_score', 'liked', 'improve']
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = responses.map((r) => {
    const a = r.answers || r
    return [r.created_at || a.at || '', a.role, a.course, a.used, ...keys.map((k) => a[k] ?? ''), susScore(a) ?? '', a.liked, a.improve].map(q).join(',')
  })
  return [head.join(','), ...lines].join('\r\n')
}

export function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `EVAL-${s}`
}
