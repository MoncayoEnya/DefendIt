// Small shared UI hint: which chapter the guide should open next.
export const uiState = { openChapter: null }

// Links every key term and panel question to a chapter, then scores each chapter.
import { norm } from './match.js'

// Which chapter a question "type" usually belongs to (used when the pack has no chapter tags).
const TYPE_HINTS = [
  [/method|sampl|instrument|design|procedure|valid|reliab|data gathering|statistic/i, /method|design|procedure|sampl|data/i],
  [/result|finding|analysis|discussion/i, /result|finding|discussion|analysis/i],
  [/literature|related|gap|framework|theory|novel/i, /literature|related|review|framework/i],
  [/conclusion|recommend|future/i, /conclusion|recommend|summary/i],
  [/problem|objective|research question/i, /problem|objective|question/i],
  [/overview|significance|scope|limitation|benefit|introduction|background/i, /introduction|background|significance|scope|limitation/i],
]

const words = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 3))

function bestByOverlap(text, pack) {
  const w = words(text)
  let best = 0
  let bestScore = -1
  pack.sections.forEach((sec, i) => {
    const sw = words(`${sec.title} ${sec.summary} ${(sec.keyPoints || []).join(' ')}`)
    let score = 0
    for (const x of w) if (sw.has(x)) score++
    if (score > bestScore) { bestScore = score; best = i }
  })
  return best
}

function questionChapter(q, pack) {
  if (Number.isInteger(q.chapter) && q.chapter >= 0 && q.chapter < pack.sections.length) return q.chapter
  for (const [typeRe, titleRe] of TYPE_HINTS) {
    if (typeRe.test(`${q.type} ${q.question}`)) {
      const i = pack.sections.findIndex((s) => titleRe.test(s.title))
      if (i >= 0) return i
    }
  }
  return bestByOverlap(`${q.question} ${(q.idealPoints || []).join(' ')}`, pack)
}

function termChapter(t, pack) {
  if (Number.isInteger(t.chapter) && t.chapter >= 0 && t.chapter < pack.sections.length) return t.chapter
  return bestByOverlap(`${t.term} ${t.definition}`, pack)
}

const cache = new WeakMap()
export function chapterIndex(pack) {
  if (cache.has(pack)) return cache.get(pack)
  const out = {
    terms: pack.terms.map((t) => termChapter(t, pack)),
    questions: pack.questions.map((q) => questionChapter(q, pack)),
  }
  cache.set(pack, out)
  return out
}

// Score for each chapter, 0-100: reading 30% + term mastery 40% + panel question mastery 30%.
export function chapterScores(state, pack) {
  const m = state.mastery[pack.id] || {}
  const idx = chapterIndex(pack)
  const read = new Set(pack.readSections || [])
  return pack.sections.map((sec, i) => {
    const tIdx = idx.terms.map((c, k) => (c === i ? k : -1)).filter((k) => k >= 0)
    const qIdx = idx.questions.map((c, k) => (c === i ? k : -1)).filter((k) => k >= 0)
    const tScore = tIdx.length ? tIdx.reduce((a, k) => a + Math.min(m[`t${k}`]?.box || 0, 3) / 3, 0) / tIdx.length : null
    const qScore = qIdx.length ? qIdx.reduce((a, k) => a + Math.min(m[`q${k}`]?.box || 0, 2) / 2, 0) / qIdx.length : null
    // when a chapter has no terms or questions, its weight moves to reading
    let total = 0.3 * (read.has(i) ? 1 : 0)
    let weight = 0.3
    if (tScore !== null) { total += 0.4 * tScore; weight += 0.4 }
    if (qScore !== null) { total += 0.3 * qScore; weight += 0.3 }
    return { index: i, title: sec.title, score: Math.round((total / weight) * 100), terms: tIdx.length, questions: qIdx.length, read: read.has(i) }
  })
}

export function weakestChapter(state, pack) {
  if (!pack) return null
  const scores = chapterScores(state, pack)
  return scores.reduce((a, b) => (b.score < a.score ? b : a), scores[0])
}
