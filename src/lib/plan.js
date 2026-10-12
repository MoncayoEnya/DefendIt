// Defense countdown: turns the days until the defense into a day-by-day prep plan.
// The plan is calculated (not stored), so it adapts if the date or the thesis changes.
import { today } from './storage.js'
import { chapterScores } from './chapters.js'

const DAY = 86400000
const toDate = (iso) => new Date(`${iso}T00:00:00`)
const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function localToday() {
  return today()
}

export function daysUntil(dateIso) {
  if (!dateIso) return null
  return Math.round((toDate(dateIso) - toDate(localToday())) / DAY)
}

export const PHASES = {
  learn: { name: 'Learn', desc: 'Understand every chapter and its key terms.', color: 'bg-brand-2' },
  practice: { name: 'Practice', desc: 'Answer panel questions and drill your weak spots.', color: 'bg-blue' },
  polish: { name: 'Polish', desc: 'Defend under pressure and sharpen how you speak.', color: 'bg-yellow' },
  rest: { name: 'Final prep', desc: 'Light review, calm mind, everything ready.', color: 'bg-yellow' },
  defense: { name: 'Defense day', desc: 'You are ready. Breathe and walk in confident.', color: 'bg-brand' },
}

const t = (id, label, metric, goal, to, extra = {}) => ({ id, label, metric, goal, to, ...extra })

export function buildPlan(state, pack, defenseDate) {
  const n = daysUntil(defenseDate)
  if (n === null || n < 0 || !pack) return []
  const start = toDate(localToday())
  const sections = pack.sections.map((s, i) => ({ i, title: s.title }))
  // weakest chapters first in the practice phase
  const weakOrder = [...chapterScores(state, pack)].sort((a, b) => a.score - b.score)

  const learnDays = n <= 2 ? 0 : Math.max(1, Math.round(n * 0.4))
  const practiceDays = n <= 2 ? 0 : Math.max(1, Math.round(n * 0.4))
  const perDay = learnDays ? Math.ceil(sections.length / learnDays) : 0

  const days = []
  for (let i = 0; i <= n; i++) {
    const remaining = n - i
    const date = toIso(new Date(start.getTime() + i * DAY))
    let phase
    let title
    let tasks
    if (remaining === 0) {
      phase = 'defense'
      title = 'Defense day'
      tasks = [
        t('breathe', 'Do one box breathing round before you enter', 'breathing', 1, 'confidence'),
        t('opening', 'Say your opening statement out loud once', 'drill', 1, 'confidence'),
      ]
    } else if (remaining === 1) {
      phase = 'rest'
      title = 'Day before: light review'
      tasks = [
        t('cards', 'Quick review: 10 flashcards', 'cards', 10, 'cards'),
        t('checklist', 'Finish the defense-day checklist', 'checklist', 10, 'confidence'),
        t('breathe', 'Box breathing to calm your nerves', 'breathing', 1, 'confidence'),
      ]
    } else if (i < learnDays) {
      phase = 'learn'
      const chs = sections.slice(i * perDay, i * perDay + perDay)
      title = chs.length ? `Learn: ${chs.map((c) => c.title).join(', ')}` : 'Learn: review key terms'
      tasks = [
        chs.length
          ? t('chapter', `Review ${chs.length === 1 ? `the "${chs[0].title}" chapter` : `${chs.length} chapters`}`, 'chapters', chs.length, 'guide', { chapter: chs[0].i })
          : t('chapter', 'Re-read your weakest chapter', 'chapters', 1, 'guide'),
        t('cards', 'Practice 10 key terms', 'cards', 10, 'cards'),
        t('match', 'Play one Match & Link round', 'match', 1, 'match'),
      ]
    } else if (i < learnDays + practiceDays) {
      phase = 'practice'
      const weak = weakOrder[(i - learnDays) % weakOrder.length]
      title = `Practice: focus on ${weak.title}`
      tasks = [
        t('panel', 'Answer 3 panel questions', 'panel', 3, 'panel'),
        t('chapter', `Review "${weak.title}"`, 'chapters', 1, 'guide', { chapter: weak.index }),
        (i - learnDays) % 2 === 0
          ? t('explain', 'Explain your study in simple words', 'explain', 1, 'explain')
          : t('typing', 'Play one Typing defense game', 'typing', 1, 'typing'),
      ]
    } else {
      phase = 'polish'
      title = 'Polish: defend under pressure'
      tasks = [
        t('panel', 'Answer 5 panel questions (try Pressure mode)', 'panel', 5, 'panel'),
        t('drill', 'Do one speaking drill', 'drill', 1, 'confidence'),
        t('daily', 'Finish the daily challenge', 'daily', 1, 'daily'),
      ]
    }
    days.push({ date, index: i, remaining, phase, title, tasks })
  }
  return days
}

export function todayPlan(state, pack) {
  const date = pack?.defenseDate
  if (!date) return null
  const plan = buildPlan(state, pack, date)
  return plan.find((d) => d.date === localToday()) || null
}

// Default focus when there is no defense date yet.
export function defaultFocus(state, pack) {
  let chapterLabel = 'Review a chapter'
  let chapter
  if (pack) {
    const weak = [...chapterScores(state, pack)].sort((a, b) => a.score - b.score)[0]
    if (weak) { chapterLabel = `Review "${weak.title}"`; chapter = weak.index }
  }
  return [
    t('chapter', chapterLabel, 'chapters', 1, 'guide', { chapter }),
    t('cards', 'Practice 5 key terms', 'cards', 5, 'cards'),
    t('panel', 'Answer one panel question', 'panel', 1, 'panel'),
  ]
}

export function focusTasks(state, pack) {
  return todayPlan(state, pack)?.tasks || defaultFocus(state, pack)
}

export { today }
