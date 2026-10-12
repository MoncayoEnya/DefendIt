// Offline "plain language" checker: readability, jargon and length, no AI needed.

function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups ? groups.length : 1)
}

export function checkPlain(text, pack) {
  const words = text.match(/[A-Za-z][A-Za-z'\-]*/g) || []
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) || []).length)
  const syl = words.reduce((a, w) => a + syllables(w), 0)
  const wc = words.length
  // Flesch-Kincaid grade level: about the school grade needed to follow the text
  const grade = wc ? Math.max(0, 0.39 * (wc / sentences) + 11.8 * (syl / wc) - 15.59) : 0
  const avgSentence = wc / sentences

  // jargon: thesis key terms and very long words
  const lower = text.toLowerCase()
  const termHits = (pack?.terms || []).map((t) => t.term).filter((t) => t.length > 3 && lower.includes(t.toLowerCase()))
  const longWords = [...new Set(words.filter((w) => syllables(w) >= 4 && !/^[A-Z]/.test(w)).map((w) => w.toLowerCase()))]
  const jargon = [...new Set([...termHits, ...longWords])].slice(0, 8)

  let score = 10
  const tips = []
  if (wc < 25) { score -= 3; tips.push('Say a little more: aim for 40 to 120 words.') }
  if (wc > 160) { score -= 2; tips.push('Too long. A simple explanation fits in about 40 to 120 words.') }
  if (grade > 12) { score -= 3; tips.push('Sentences are hard to follow. Use shorter sentences and everyday words.') }
  else if (grade > 9) { score -= 1.5; tips.push('Almost there. Swap a few long words for simple ones.') }
  if (avgSentence > 25) { score -= 1; tips.push('Break long sentences into two.') }
  if (jargon.length > 3) { score -= 2; tips.push(`Explain or replace technical words like "${jargon.slice(0, 3).join('", "')}".`) }
  if (!/\b(because|so|which means|this helps|for example|like)\b/i.test(text)) { score -= 1; tips.push('Add "because" or an example so the listener knows why it matters.') }
  if (!tips.length) tips.push('Clear and simple. A non-expert could follow this.')

  return {
    score: Math.max(0, Math.round(score)),
    words: wc,
    grade: Math.round(grade * 10) / 10,
    avgSentence: Math.round(avgSentence),
    jargon,
    tips,
  }
}
