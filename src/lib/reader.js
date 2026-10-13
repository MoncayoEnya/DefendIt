// Turns the raw thesis text into chapters, headings and paragraphs for the "Read my thesis" page.
import { isHeading, isJunk } from './offline.js'

const CHAPTER = /^(chapter\s+([0-9]+|[ivx]+|one|two|three|four|five|six)\b)/i
// When a paper has no "CHAPTER 1" lines, its main headings decide the chapter.
const PARTS = [
  ['Introduction', /^(introduction|background|rationale|statement of the problem|research questions?|problem statement|objectives?|general objective|specific objectives?|significance|scope|limitations?|delimitations?|hypothes[ie]s|definition of terms|conceptual framework|theoretical framework)\b/i],
  ['Related literature', /^(review of related|related (literature|studies)|literature review|synthesis)\b/i],
  ['Methodology', /^(methodology|research (design|method)|methods?$|sampling|respondents|participants|research instrument|data gathering|statistical treatment|system design|development methodology|locale)\b/i],
  ['Results and discussion', /^(results|findings|presentation,? analysis|discussion|data analysis)\b/i],
  ['Conclusion', /^(summary|conclusions?|recommendations?)\b/i],
]
const partOf = (h) => (/^[A-Z0-9]/.test(h) ? PARTS.findIndex(([, re]) => re.test(h)) : -1)
const FRONT = /^(abstract|acknowledge?ments?|dedication|table of contents|list of (tables|figures|appendices)|approval sheet|references|bibliography|appendi(x|ces)|curriculum vitae)\b/i

// The typical full line length, so we can tell where a paragraph ends (its last line is shorter).
function typicalWidth(lines) {
  const lens = lines.map((l) => l.length).filter((n) => n > 30).sort((a, b) => a - b)
  return lens.length ? lens[Math.floor(lens.length * 0.6)] : 80
}

export function toReader(text) {
  const lines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim())
  const width = typicalWidth(lines)
  const hasChapters = lines.some((l) => CHAPTER.test(l))
  const chapters = []
  let ch = null
  let cur = []
  let n = 0
  let partAt = -1

  const startChapter = (title) => {
    flush()
    ch = { title, blocks: [] }
    chapters.push(ch)
  }
  const flush = () => {
    if (!cur.length) return
    const t = cur.join(' ').replace(/(\w)- (\w)/g, '$1$2').replace(/\s+/g, ' ').trim()
    cur = []
    if (t.length < 25 || !/[a-z]{3}/.test(t)) return
    if (!ch) startChapter('Beginning')
    // join a short piece onto the paragraph before it (often a page break in the middle of a paragraph)
    const last = ch.blocks.at(-1)
    if (last?.type === 'p' && (!/[.!?:"”)]$/.test(last.text) || /^[a-z]/.test(t))) { last.text += ' ' + t; return }
    ch.blocks.push({ type: 'p', id: `p${n++}`, text: t })
  }

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (!l) { flush(); continue }
    if (isJunk(l) || /^(page\s*)?\d{1,3}$/i.test(l)) continue
    const bare = l.replace(/[:.]$/, '')
    if (CHAPTER.test(bare) || FRONT.test(bare)) {
      // "CHAPTER 1" is often followed by its name on the next line
      let title = bare
      const next = lines[i + 1] || ''
      if (/^chapter\s+\S+$/i.test(bare) && next && isHeading(next)) { title = `${bare}: ${next.replace(/[:.]$/, '')}`; i++ }
      startChapter(title.replace(/\b([A-Z])([A-Z]+)\b/g, (m, a, b) => a + b.toLowerCase()))
      continue
    }
    if (isHeading(l) && /^[A-Z0-9IVX]/.test(l)) {
      flush()
      // chapters only move forward (Introduction, then Literature, then Methodology...)
      const part = hasChapters ? -1 : partOf(bare)
      if (part > partAt) { partAt = part; startChapter(PARTS[part][0]) }
      if (!ch) startChapter('Beginning')
      if (bare.toLowerCase() !== ch.title.toLowerCase()) ch.blocks.push({ type: 'h', text: bare.length > 3 && bare === bare.toUpperCase() ? bare[0] + bare.slice(1).toLowerCase() : bare })
      continue
    }
    cur.push(l)
    // a short line that ends a sentence usually ends the paragraph
    if (/[.!?:"”]$/.test(l) && l.length < width * 0.8) flush()
  }
  flush()

  // drop empty chapters and the table of contents
  return chapters
    .map((c) => ({ ...c, blocks: c.blocks.filter((b, i, a) => b.type === 'p' || a[i + 1]?.type === 'p') }))
    .filter((c) => c.blocks.some((b) => b.type === 'p') && !/table of contents|list of/i.test(c.title))
}

// The sample thesis has no file, so we build readable text from its sections.
export function demoText(pack) {
  return [
    pack.title.toUpperCase(), '',
    ...pack.sections.flatMap((s, i) => [`CHAPTER ${i + 1}`, s.title, '', `${s.summary} ${(s.keyPoints || []).join('. ')}.`, '']),
  ].join('\n')
}

// Without AI: the paragraph's first sentence, shortened, plus any key terms it uses.
export function offlineMeaning(text, terms = []) {
  const first = text.split(/(?<=[.!?])\s+(?=[A-Z])/)[0] || text
  const short = first.length > 220 ? `${first.slice(0, 200).replace(/\s+\S*$/, '')}...` : first
  const used = terms.filter((t) => new RegExp(`\\b${t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)).slice(0, 3)
  return { meaning: short, terms: used.map((t) => `${t.term}: ${t.definition}`) }
}
