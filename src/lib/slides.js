// Reads a PowerPoint (.pptx) file in the browser and checks it like a thesis adviser would.
import JSZip from 'jszip'

const num = (s) => Number(s.match(/(\d+)\.xml$/)?.[1] || 0)
const parse = (xml) => new DOMParser().parseFromString(xml, 'application/xml')
const texts = (node) => [...node.getElementsByTagName('a:t')].map((t) => t.textContent).join('')

async function slideOrder(zip) {
  // the real order lives in presentation.xml; fall back to file numbers
  try {
    const pres = parse(await zip.file('ppt/presentation.xml').async('string'))
    const rels = parse(await zip.file('ppt/_rels/presentation.xml.rels').async('string'))
    const map = {}
    for (const r of rels.getElementsByTagName('Relationship')) map[r.getAttribute('Id')] = r.getAttribute('Target')
    const ids = [...pres.getElementsByTagName('p:sldId')].map((s) => s.getAttribute('r:id'))
    const paths = ids.map((id) => map[id]).filter(Boolean).map((t) => `ppt/${t.replace(/^\.?\//, '').replace(/^\.\.\//, '')}`)
    if (paths.length && paths.every((p) => zip.file(p))) return paths
  } catch { /* use fallback */ }
  return Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b))
}

async function notesFor(zip, slidePath) {
  const relPath = slidePath.replace('slides/', 'slides/_rels/') + '.rels'
  const rel = zip.file(relPath)
  if (!rel) return ''
  const doc = parse(await rel.async('string'))
  const r = [...doc.getElementsByTagName('Relationship')].find((x) => /notesSlide$/.test(x.getAttribute('Type')))
  if (!r) return ''
  const target = `ppt/${r.getAttribute('Target').replace(/^\.\.\//, '')}`
  const f = zip.file(target)
  if (!f) return ''
  const notes = parse(await f.async('string'))
  // skip the slide-image and slide-number placeholders
  return [...notes.getElementsByTagName('p:sp')]
    .filter((sp) => !/sldNum|sldImg/.test(sp.getElementsByTagName('p:ph')[0]?.getAttribute('type') || ''))
    .map(texts).join(' ').trim()
}

export async function readPptx(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const order = await slideOrder(zip)
  if (!order.length) throw new Error('No slides found. Make sure this is a .pptx file (in Google Slides: File, then Download, then Microsoft PowerPoint).')
  const slides = []
  for (let i = 0; i < order.length; i++) {
    const doc = parse(await zip.file(order[i]).async('string'))
    let title = ''
    const body = []
    for (const sp of doc.getElementsByTagName('p:sp')) {
      const ph = sp.getElementsByTagName('p:ph')[0]?.getAttribute('type') || ''
      const paras = [...sp.getElementsByTagName('a:p')].map(texts).map((t) => t.trim()).filter(Boolean)
      if (!paras.length || /sldNum|dt|ftr/.test(ph)) continue
      if (!title && /title|ctrTitle/i.test(ph)) title = paras.join(' ')
      else body.push(...paras)
    }
    // tables count as text too
    for (const tbl of doc.getElementsByTagName('a:tbl')) body.push(...[...tbl.getElementsByTagName('a:p')].map(texts).filter(Boolean))
    const images = doc.getElementsByTagName('p:pic').length
    const charts = [...doc.getElementsByTagName('c:chart')].length + [...doc.getElementsByTagName('a:graphicData')].filter((g) => /chart|diagram/.test(g.getAttribute('uri') || '')).length
    slides.push({ n: i + 1, title, body, text: body.join('\n'), images, charts, notes: await notesFor(zip, order[i]) })
  }
  return slides
}

const PARTS = [
  { id: 'intro', name: 'Introduction / Background', re: /introduction|background|rationale|overview/i, bodyOk: true },
  { id: 'problem', name: 'Statement of the problem', re: /statement of the problem|problem statement|research questions?|the problem/i },
  { id: 'objectives', name: 'Objectives', re: /objectives?/i },
  { id: 'scope', name: 'Scope and limitations', re: /scope|limitations?|delimitations?/i },
  { id: 'method', name: 'Methodology', re: /methodolog|research design|framework|architecture|sampling|data gathering|development model|agile|procedure/i },
  { id: 'results', name: 'Results / Findings', re: /results?|findings|data analysis|evaluation|discussion/i },
  { id: 'conclusion', name: 'Conclusion', re: /conclusions?|summary/i },
  { id: 'recommend', name: 'Recommendations', re: /recommendations?|future work/i },
  { id: 'closing', name: 'Closing (thank you / Q&A / references)', re: /thank you|q\s*&\s*a|questions\?|references|bibliography/i, bodyOk: true },
]

const words = (s) => (s.match(/[A-Za-z0-9][\w'\-]*/g) || []).length

export function checkSlides(slides, pack) {
  const perSlide = slides.map((s) => {
    const issues = []
    const wc = words(s.text)
    const longest = Math.max(0, ...s.body.map(words))
    if (!s.title && s.n > 1) issues.push({ level: 'warn', text: 'No slide title. Add a short title so the panel knows the topic.' })
    if (wc > 60) issues.push({ level: 'bad', text: `Too much text (${wc} words). Aim for under 40 and say the rest out loud.` })
    else if (wc > 40) issues.push({ level: 'warn', text: `A bit wordy (${wc} words). Try to cut it below 40.` })
    if (s.body.length > 7) issues.push({ level: 'warn', text: `${s.body.length} bullet points. Keep it to 6 or fewer.` })
    if (longest > 25) issues.push({ level: 'warn', text: 'A bullet is a full long sentence. Use short phrases instead.' })
    if (!wc && !s.images && !s.charts && !s.title) issues.push({ level: 'bad', text: 'Empty slide.' })
    if (wc > 25 && !s.images && !s.charts) issues.push({ level: 'tip', text: 'Text only. A diagram, chart or screenshot would make this easier to follow.' })
    return { ...s, words: wc, issues }
  })

  const parts = PARTS.map((p) => {
    // match on slide titles; body text only for the opening and closing (bullets mention many words)
    const hit = slides.find((s) => p.re.test(s.title)) || (p.bodyOk ? slides.find((s) => p.re.test(s.text)) : null)
    return { ...p, slide: hit?.n || null }
  })
  const missing = parts.filter((p) => !p.slide)

  const deckIssues = []
  if (slides.length < 8) deckIssues.push(`Only ${slides.length} slides. Most defenses need 12 to 25 to cover every chapter.`)
  if (slides.length > 35) deckIssues.push(`${slides.length} slides is long. For a 15 to 20 minute defense, aim for about one slide per minute.`)
  if (!slides[0]?.title && !slides[0]?.text) deckIssues.push('The first slide should show your title, names and adviser.')
  const withNotes = slides.filter((s) => s.notes.length > 20).length
  if (withNotes < slides.length / 3) deckIssues.push('Few slides have speaker notes. Notes help you remember what to say.')

  let termsMissing = []
  if (pack) {
    const all = slides.map((s) => `${s.title} ${s.text}`).join(' ').toLowerCase()
    termsMissing = pack.terms.slice(0, 10).map((t) => t.term).filter((t) => !all.includes(t.toLowerCase()))
  }

  const slideProblems = perSlide.reduce((a, s) => a + s.issues.filter((i) => i.level !== 'tip').length, 0)
  const score = Math.max(0, Math.round(100 - missing.length * 7 - Math.min(35, slideProblems * 3) - deckIssues.length * 4 - Math.min(10, termsMissing.length * 2)))
  const avgWords = Math.round(perSlide.reduce((a, s) => a + s.words, 0) / Math.max(perSlide.length, 1))
  return { slides: perSlide, parts, missing, deckIssues, termsMissing, score, avgWords }
}
