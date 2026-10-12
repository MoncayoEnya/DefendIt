// Offline "smart mode": builds a study pack WITHOUT any AI or internet.
// Less smart than the AI version, but 100% free and works anywhere.

const STOP = new Set(`a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just let me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves study research researchers respondents table figure chapter page also however therefore thus using used use based may shall within among per one two three et al data result results level levels mean based without each well following shown such many much often usually several possible certain various different new etc may might must need needs`.split(/\s+/))

// Words that are too general to be good "key terms" on their own.
const GENERIC = new Set(`score scores studies study measured group groups test tests students student school schools participants significant difference increased higher lower findings conducted reported showed total number system systems approach process method methods information problem problems issue issues user users people person owner owners way ways time times part parts case cases example basis provide provides help helps important general specific purpose objective objectives scope limitation limitations significance background introduction chapter thesis paper project proposed developed development able`.split(/\s+/))

const SECTION_PATTERNS = [
  ['Introduction / Background', /^(chapter\s+(1|i|one)\b.*|introduction|background( of the (study|problem))?|rationale)$/i],
  ['Statement of the Problem', /^(statement of the problem|research questions?|problem statement)$/i],
  ['Objectives', /^(objectives?( of the study)?|general objective|specific objectives?|research objectives?)$/i],
  ['Significance & Scope', /^(significance of the study|scope and limitations?|scope and delimitations?|limitations?|scope)$/i],
  ['Review of Related Literature', /^(chapter\s+(2|ii|two)\b.*|review of related (literature|studies)|related literature|related studies|literature review|theoretical framework|conceptual framework)$/i],
  ['Methodology', /^(chapter\s+(3|iii|three)\b.*|methodology|research (design|method(ology)?)|methods?|sampling.*|data gathering.*|statistical treatment.*|system design|development methodology)$/i],
  ['Results & Discussion', /^(chapter\s+(4|iv|four)\b.*|results( and discussion)?|findings|presentation,? analysis.*|discussion)$/i],
  ['Conclusion & Recommendations', /^(chapter\s+(5|v|five)\b.*|summary.*|conclusions?.*|recommendations?)$/i],
]

const COVER_LINE = /universit|college|school of|department|institute|partial fulfil|presented to|submitted|bachelor|master of|requirement|adviser|advisor|prepared by|^by$|^(january|february|march|april|may|june|july|august|september|october|november|december)\b|^\d{4}$|^table of contents|^approval sheet|^acknowledg|^dedication|^abstract$|^list of/i

// ---------- cleaning ----------

// Drops lines that are not real text: "_____" signature lines, dotted table-of-contents rows, page numbers.
export function isJunk(line) {
  const letters = (line.match(/[A-Za-z]/g) || []).length
  if (letters < 3) return true
  if (letters / line.length < 0.5) return true
  if (/\.{4,}\s*\d*$/.test(line)) return true // "Introduction ........ 1"
  return false
}

function isHeading(line) {
  const l = line.replace(/[:.]$/, '').trim()
  if (SECTION_PATTERNS.some(([, re]) => re.test(l))) return true
  if (l.length > 90 || /[.;,?!]$/.test(line.trim())) return false
  const words = l.split(/\s+/).filter((w) => /[A-Za-z]/.test(w))
  if (!words.length || words.length > 14) return false
  if (l === l.toUpperCase() && /[A-Z]{3}/.test(l)) return true
  const longWords = words.filter((w) => w.replace(/[^A-Za-z]/g, '').length > 3)
  if (!longWords.length) return false
  const capped = longWords.filter((w) => /^[^a-z]*[A-Z]/.test(w)).length
  return capped / longWords.length >= 0.75
}

function cleanLines(text) {
  return text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l && !isJunk(l))
}

// Paragraphs of real body text (headings are removed so they never leak into sentences).
function paragraphs(text) {
  const out = []
  let cur = []
  for (const raw of text.split('\n')) {
    const l = raw.replace(/\s+/g, ' ').trim()
    if (!l || isJunk(l) || isHeading(l)) {
      if (cur.length) out.push(cur.join(' '))
      cur = []
      continue
    }
    cur.push(l)
  }
  if (cur.length) out.push(cur.join(' '))
  return out
}

export function splitSentences(text) {
  const out = []
  for (const p of paragraphs(text)) {
    for (const s of p.split(/(?<=[.!?])\s+(?=[A-Z"“(])/)) {
      const t = s.trim()
      if (t.length > 40 && t.length < 320 && /[a-z]/.test(t)) out.push(t)
    }
  }
  return out
}

// ---------- title ----------

// Removes "_____" signature lines and similar from a title; falls back to the file name.
export function cleanTitle(title, fileName) {
  const t = (title || '').replace(/[_.\-–—=~*]{3,}/g, ' ').replace(/\s+/g, ' ').trim()
  return !t || isJunk(t) ? titleFromFileName(fileName) : t
}

export function titleFromFileName(fileName = '') {
  const base = fileName.replace(/\.[^.]+$/, '')
  const cleaned = base
    .replace(/(revision|revised|final|draft|after|consult(ation)?|edited|copy|updated|chapter\s*\d+|ch\d+|v\d+)/gi, ' ')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || base || 'My Thesis'
}

function detectTitle(text, fileName) {
  const lines = cleanLines(text).slice(0, 40)
  const isSection = (l) => SECTION_PATTERNS.some(([, re]) => re.test(l.replace(/[:.]$/, '')))
  const ok = (l) => !isSection(l) && !COVER_LINE.test(l) && l.length <= 220
  // 1) an ALL-CAPS title block (common on thesis cover pages)
  const caps = (l) => l === l.toUpperCase() && /[A-Z]{3}/.test(l)
  const isCaps = (l) => caps(l) && ok(l)
  const start = lines.findIndex((l) => isCaps(l) && l.length > 15)
  if (start >= 0) {
    let t = lines[start]
    // continuation lines of a wrapped title may mention a college or school, so only stop at section headings
    for (let i = start + 1; i < lines.length && caps(lines[i]) && !isSection(lines[i]) && !/^(by|a (thesis|capstone)|an? \w+ (project|study))\b/i.test(lines[i]) && t.length < 220; i++) t += ' ' + lines[i]
    return t
  }
  // 2) a Title Case line near the top, e.g. "VehiCare: AI-Assisted Vehicle Diagnosis"
  const tc = lines.find((l) => ok(l) && l.length >= 15 && isHeading(l) && l.split(' ').length >= 3)
  if (tc) return tc
  // 3) the file name, cleaned up
  return titleFromFileName(fileName)
}

// ---------- sections ----------

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

// ---------- key terms ----------

function topPhrases(text, n = 24) {
  const body = paragraphs(text).join('\n')
  const tokens = body.replace(/[^A-Za-z0-9\-\s']/g, ' ').split(/\s+/).filter(Boolean)
  const lower = tokens.map((t) => t.toLowerCase())
  const raw = new Map() // phrase -> how many times it appears
  const forms = new Map() // phrase -> { original spelling: count }
  const add = (key, original) => {
    raw.set(key, (raw.get(key) || 0) + 1)
    const f = forms.get(key) || {}
    f[original] = (f[original] || 0) + 1
    forms.set(key, f)
  }
  const good = (w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w)
  for (let i = 0; i < lower.length; i++) {
    const o = tokens[i]
    // single words only when they look technical: inner capitals (VehiCare), acronyms (OBD-II), or proper nouns (Bayesian)
    const technical = /[a-z][A-Z]/.test(o) || /^[A-Z]{2,}[A-Z0-9\-]*$/.test(o) || (i > 0 && /^[A-Z][a-z]{4,}$/.test(o) && !/[.!?]$/.test(tokens[i - 1]))
    if (good(lower[i]) && !GENERIC.has(lower[i]) && technical) add(lower[i], o)
    // phrases of 2 to 4 words made only of meaningful words
    for (let len = 2; len <= 4; len++) {
      const ws = lower.slice(i, i + len)
      if (ws.length < len || !ws.every(good)) break
      if (ws.every((w) => GENERIC.has(w)) || !looksLikeTerm(ws)) continue
      add(ws.join(' '), tokens.slice(i, i + len).join(' '))
    }
  }
  const weight = (k) => [0, 1.5, 2.5, 3, 3.2][k.split(' ').length]
  const minCount = body.length < 30000 ? 2 : 3 // short drafts (one chapter) need a lower bar
  // a phrase is "dominated" when a longer phrase containing it appears almost as often
  // (e.g. "decision support" inside "diagnostic decision support system"), so we keep the longer one
  const dominated = (k, c) => {
    for (const [k2, c2] of raw) {
      if (k2.length > k.length && c2 >= Math.max(minCount, c * 0.6) && (` ${k2} `).includes(` ${k} `)) return true
    }
    return false
  }
  const sorted = [...raw.entries()]
    .filter(([k, c]) => c >= minCount && c * weight(k) >= 5 && !dominated(k, c))
    .sort((a, b) => b[1] * weight(b[0]) - a[1] * weight(a[0]))
  const out = []
  for (const [p] of sorted) {
    if (out.some((o) => (` ${o.key} `).includes(` ${p} `) || (` ${p} `).includes(` ${o.key} `))) continue
    const best = Object.entries(forms.get(p)).sort((a, b) => b[1] - a[1])[0][0]
    out.push({ key: p, display: displayForm(best) })
    if (out.length >= n) break
  }
  return out
}

// Rejects verb fragments such as "quizzes increased" or "indicating good reliability".
const VERB_ING = /^(indicating|using|showing|including|having|being|making|according|regarding|providing|allowing|helping|resulting|suggesting|following|considering)$/
function looksLikeTerm(ws) {
  if (ws.some((w) => /ly$/.test(w))) return false
  if (VERB_ING.test(ws[0])) return false
  // after the first word, plain "-ed" words are usually verbs (hyphenated ones like "user-reported" are fine)
  if (ws.slice(1).some((w) => /ed$/.test(w) && !w.includes('-'))) return false
  return true
}

// Keep real capitals (VehiCare, AI, Bayesian); otherwise Title Case the phrase.
function displayForm(s) {
  return s.split(' ').map((w) => (/[A-Z]/.test(w.slice(1)) || /^[A-Z]/.test(w) ? w : w[0].toUpperCase() + w.slice(1))).join(' ')
}

function bestDefinition(term, sentences) {
  const re = new RegExp(`\\b${term.replace(/[-]/g, '\\-')}\\b`, 'i')
  let best = null
  let bestScore = -Infinity
  for (const s of sentences) {
    const m = s.match(re)
    if (!m) continue
    let score = 0
    const after = s.slice(m.index + m[0].length, m.index + m[0].length + 30)
    if (/^\s*(\([^)]*\)\s*)?(is|are|refers to|means|is defined as|can be defined as|is a|is an|is the)\b/i.test(after)) score += 6
    if (m.index < 40) score += 2
    if (/\?$/.test(s) || /^(how|what|why|can|does|is)\b/i.test(s)) score -= 5
    score -= Math.abs(s.length - 140) / 60
    if (score > bestScore) { bestScore = score; best = s }
  }
  return best
}

// ---------- summaries ----------

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

// "In brief": sentences that state what the study does, instead of repeating the introduction.
function overviewOf(sentences, fallback) {
  const purpose = sentences.filter((s) => /\b(this|the present|the proposed) (study|research|project|system|paper|capstone)\b|\baims? to\b|\bpurpose of\b|\bseeks? to\b|\bintends? to\b/i.test(s))
  const pick = [...new Set(purpose)].slice(0, 3)
  return pick.length >= 2 ? pick.join(' ') : fallback
}

const q = (question, type, idealPoints) => ({ question, type, idealPoints })

export function buildOfflinePack(text, fileName) {
  const title = detectTitle(text, fileName)
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
    const def = bestDefinition(p.key, sentences)
    if (!def) continue
    const re = new RegExp(`\\b${p.key.replace(/[-]/g, '\\-')}\\b`, 'gi')
    const counts = sections.map((sec) => (sec.text.match(re) || []).length)
    terms.push({ term: p.display, definition: def, chapter: counts.indexOf(Math.max(...counts)) })
    if (terms.length >= 16) break
  }

  const t = terms.map((x) => x.term)
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
    title: cleanTitle(title, fileName),
    fileName,
    overview: overviewOf(sentences, secOut[0]?.summary || ''),
    sections: secOut,
    terms,
    questions,
    sectionNames: secOut.map((s) => s.title),
    source: 'offline',
  }
}
