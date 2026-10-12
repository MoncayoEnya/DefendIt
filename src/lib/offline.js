// Offline "smart mode": builds a study pack WITHOUT any AI or internet.
// Less smart than the AI version, but 100% free and works anywhere.

const STOP = new Set(`a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just let me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves study research researchers respondents table figure chapter page also however therefore thus using used use based may shall within among per one two three et al data result results level levels mean based without each well following shown`.split(/\s+/))

const SECTION_PATTERNS = [
  ['Introduction / Background', /^(chapter\s+(1|i|one)\b.*|introduction|background of the study)$/i],
  ['Statement of the Problem', /^(statement of the problem|research questions?|problem statement)$/i],
  ['Objectives', /^(objectives?( of the study)?|general objective|specific objectives?)$/i],
  ['Significance & Scope', /^(significance of the study|scope and limitations?|scope and delimitations?|limitations?)$/i],
  ['Review of Related Literature', /^(chapter\s+(2|ii|two)\b.*|review of related (literature|studies)|related literature|literature review|theoretical framework|conceptual framework)$/i],
  ['Methodology', /^(chapter\s+(3|iii|three)\b.*|methodology|research (design|method(ology)?)|methods?|sampling.*|data gathering.*|statistical treatment.*)$/i],
  ['Results & Discussion', /^(chapter\s+(4|iv|four)\b.*|results( and discussion)?|findings|presentation,? analysis.*|discussion)$/i],
  ['Conclusion & Recommendations', /^(chapter\s+(5|v|five)\b.*|summary.*|conclusions?.*|recommendations?)$/i],
]

export function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim().replace(/^(?:\b[A-Z][A-Z'&,\-]+\b\s+)+(?=[A-Z][a-z])/, '').replace(/^(chapter\s+\w+\s+)/i, ''))
    .filter((s) => s.length > 40 && s.length < 320 && /[a-z]/.test(s))
}

function detectTitle(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 30)
  const isCaps = (l) => l.length > 3 && l === l.toUpperCase() && /[A-Z]{3}/.test(l) && !SECTION_PATTERNS.some(([, re]) => re.test(l))
  const start = lines.findIndex((l) => isCaps(l) && l.length > 15)
  if (start >= 0) {
    let t = lines[start]
    for (let i = start + 1; i < lines.length && isCaps(lines[i]) && t.length < 220; i++) t += ' ' + lines[i]
    return t.replace(/\s+/g, ' ')
  }
  return (lines.find((l) => l.length > 20 && l.length < 160) || 'My Thesis').replace(/\s+/g, ' ')
}

const GENERIC = new Set('score scores studies study measured group groups test tests students student school schools participants significant difference increased higher lower findings conducted reported showed total number'.split(' '))

function detectSections(text) {
  const lines = text.split('\n')
  const found = []
  lines.forEach((raw, i) => {
    const l = raw.trim().replace(/[:.]$/, '')
    if (l.length < 4 || l.length > 70) return
    for (const [label, re] of SECTION_PATTERNS) {
      if (re.test(l) && !found.some((f) => f.label === label)) found.push({ label, start: i })
    }
  })
  found.sort((a, b) => a.start - b.start)
  return found.map((f, idx) => {
    const end = found[idx + 1]?.start ?? lines.length
    return { title: f.label, text: lines.slice(f.start + 1, end).join('\n') }
  })
}

function topPhrases(text, n = 24) {
  const words = text.toLowerCase().replace(/[^a-z0-9\-\s]/g, ' ').split(/\s+/).filter(Boolean)
  const counts = new Map()
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    if (w.length > 4 && !STOP.has(w) && !GENERIC.has(w) && !/(ed|ly)$/.test(w) && !/\d/.test(w)) counts.set(w, (counts.get(w) || 0) + 0.8)
    const w2 = words[i + 1]
    if (w2 && !STOP.has(w) && !STOP.has(w2) && w.length > 2 && w2.length > 2 && !/\d/.test(w + w2) && !/(ed|ly)$/.test(w2) && !(GENERIC.has(w) && GENERIC.has(w2))) {
      const bg = `${w} ${w2}`
      counts.set(bg, (counts.get(bg) || 0) + 2.5) // phrases are more meaningful
    }
  }
  const sorted = [...counts.entries()].filter(([, c]) => c >= 4).sort((a, b) => b[1] - a[1])
  const out = []
  for (const [p] of sorted) {
    if (out.some((o) => o.includes(p) || p.includes(o))) continue
    out.push(p)
    if (out.length >= n) break
  }
  return out
}

function summarize(text, k = 3) {
  const sents = splitSentences(text)
  if (!sents.length) return { summary: '', points: [] }
  const freq = new Map()
  text.toLowerCase().split(/\W+/).forEach((w) => !STOP.has(w) && w.length > 3 && freq.set(w, (freq.get(w) || 0) + 1))
  const scored = sents.map((s, i) => ({
    s, i,
    score: s.toLowerCase().split(/\W+/).reduce((a, w) => a + (freq.get(w) || 0), 0) / Math.sqrt(s.length) + (i < 3 ? 3 : 0),
  }))
  const best = [...scored].sort((a, b) => b.score - a.score).slice(0, k + 3).sort((a, b) => a.i - b.i)
  return { summary: best.slice(0, k).map((b) => b.s).join(' '), points: best.slice(k, k + 3).map((b) => b.s) }
}

const cap = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase())

export function buildOfflinePack(text, fileName) {
  const title = detectTitle(text)
  let sections = detectSections(text)
  if (sections.length < 2) {
    // no headings found → split into equal parts
    const parts = 4
    const chunk = Math.ceil(text.length / parts)
    sections = Array.from({ length: parts }, (_, i) => ({ title: `Part ${i + 1}`, text: text.slice(i * chunk, (i + 1) * chunk) }))
  }
  const secOut = sections.map((s) => {
    const { summary, points } = summarize(s.text)
    return { title: s.title, summary: summary || 'Not enough text found in this part.', keyPoints: points }
  })

  const sentences = splitSentences(text)
  const terms = []
  for (const p of topPhrases(text)) {
    const re = new RegExp(`\\b${p.replace(/[-]/g, '\\-')}\\b`, 'i')
    const def = sentences.find((s) => re.test(s) && /\b(is|are|refers to|means|defined as|was|were)\b/i.test(s)) || sentences.find((s) => re.test(s))
    if (def) {
      // the chapter where this term appears most often
      const counts = sections.map((sec) => (sec.text.match(new RegExp(re.source, 'gi')) || []).length)
      terms.push({ term: cap(p), definition: def, chapter: counts.indexOf(Math.max(...counts)) })
    }
    if (terms.length >= 16) break
  }

  const secNames = secOut.map((s) => s.title)
  const t = terms.map((x) => x.term)
  const q = (question, type, idealPoints) => ({ question, type, idealPoints })
  const questions = [
    q('In one minute, what is your study about and why does it matter?', 'Overview', ['The problem', 'Who is affected', 'What you did', 'Main finding']),
    q('What gap in existing studies does your research fill?', 'Literature', ['Related studies', 'What they missed', 'How yours is different']),
    q('Why did you choose this research design and method?', 'Methodology', ['Design name', 'Why it fits your objectives', 'Alternatives you considered']),
    q('How did you choose your respondents or sample, and why is the size enough?', 'Methodology', ['Sampling technique', 'Sample size formula / basis', 'Inclusion criteria']),
    q('How did you make sure your instrument or data is valid and reliable?', 'Methodology', ['Validation (experts, pilot test)', 'Reliability test (e.g. Cronbach alpha)', 'Results of the test']),
    q('What is your most important finding, and what does it mean in real life?', 'Results', ['The finding with numbers', 'Interpretation', 'Practical impact']),
    q('What are the limitations of your study?', 'Limitations', ['Scope boundaries', 'Data / sample limits', 'How you reduced their effect']),
    q('If you did this study again, what would you change?', 'Critical thinking', ['Honest improvement', 'Why it would help', 'Future research idea']),
    q('Who will benefit from your study and how?', 'Significance', ['Beneficiaries', 'Concrete benefit for each']),
    q('Do your conclusions really follow from your results?', 'Conclusion', ['Link each conclusion to a result', 'Avoid over-claiming']),
    ...t.slice(0, 6).map((term) => q(`Can you explain "${term}" and why it is important in your study?`, 'Concept', ['Clear definition', 'Where it appears in your study', 'Why it matters'])),
  ]

  return {
    title,
    fileName,
    overview: secOut[0]?.summary || '',
    sections: secOut,
    terms,
    questions,
    sectionNames: secNames,
    source: 'offline',
  }
}
