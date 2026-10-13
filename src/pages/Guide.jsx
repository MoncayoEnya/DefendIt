import { useMemo, useState } from 'react'
import { MissingProfile, OpeningText } from '../components/Opening.jsx'
import { speakable } from '../lib/profile.js'
import { AlertTriangle, BookOpen, BookOpenText, Check, ChevronDown, CircleHelp, FileText, Layers, ListChecks, Mic, Printer, Search, Users, Volume2 } from 'lucide-react'
import { CircularProgress, Hint, ProgressBar, Tabs, centerOnTap } from '../components/ui.jsx'
import { chapterScores, uiState } from '../lib/chapters.js'
import { speak } from '../lib/voice.js'

export { speak }

// Splits a paragraph into short points (max 3) so the summary is easy to scan.
function toPoints(text, max = 3) {
  return (text || '')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15)
    .slice(0, max)
}

const scoreColor = (v) => (v >= 70 ? 'bg-brand-2' : v >= 40 ? 'bg-yellow' : 'bg-red')

export default function Guide({ state, pack, update, addXP, go, track }) {
  const [tab, setTab] = useState(() => (uiState.openChapter != null ? 'chapters' : 'summary'))
  const scores = chapterScores(state, pack)
  const read = pack.readSections || []

  function markRead(i) {
    if (read.includes(i)) return
    update((s) => {
      const p = s.packs.find((x) => x.id === pack.id)
      p.readSections = [...(p.readSections || []), i]
      return s
    })
    addXP(10, 'Chapter reviewed')
    track('chapters')
  }

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'chapters', label: 'Chapters', icon: BookOpen, count: pack.sections.length },
    { id: 'terms', label: 'Terms', icon: Layers, count: pack.terms.length },
    { id: 'questions', label: 'Questions', icon: CircleHelp, count: pack.questions.length },
  ]

  return (
    <div className="max-w-5xl">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-1">Study guide{pack.sample ? ' · Sample' : ''}</p>
          <h1 className="line-clamp-3 text-[20px] font-bold leading-tight tracking-tight md:text-[26px]">{pack.title}</h1>
        </div>
        <button className="btn-ghost !h-9 shrink-0" onClick={() => go('reviewer')}><Printer size={15} /> <span className="hidden sm:inline">Print reviewer</span><span className="sm:hidden">Print</span></button>
      </header>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'summary' && <SummaryTab pack={pack} scores={scores} read={read} go={go} setTab={setTab} profile={state.profile} />}
      {tab === 'chapters' && <ChaptersTab pack={pack} scores={scores} read={read} markRead={markRead} />}
      {tab === 'terms' && <TermsTab pack={pack} go={go} />}
      {tab === 'questions' && <QuestionsTab pack={pack} go={go} />}
    </div>
  )
}

function SummaryTab({ pack, scores, read, go, setTab, profile }) {
  const points = toPoints(pack.overview)
  const [script, setScript] = useState(false)
  const weakest = [...scores].sort((a, b) => a.score - b.score).slice(0, 3)
  // preview: the first two sentences (or about 160 characters)
  const pitchFirst = (() => {
    const two = (pack.elevatorPitch || '').split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')
    return two.length > 200 ? `${two.slice(0, 160).replace(/\s+\S*$/, '')}` : two
  })()
  const pitchLong = pitchFirst.length < (pack.elevatorPitch || '').length

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(260px,2fr)]">
      <div className="min-w-0 space-y-4">
        <button className="card-link flex w-full items-center gap-3 p-4 text-left" onClick={() => go('read')}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-yellow-soft text-yellow-ink"><BookOpenText size={22} strokeWidth={1.75} aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">Read my thesis</span>
            <span className="block text-[13px] text-sub">Every paragraph explained. Even like you're 10.</span>
          </span>
          <ChevronDown size={18} className="-rotate-90 text-sub" aria-hidden />
        </button>
        {points.length > 0 && (
          <section className="card p-4 md:p-5">
            <h2 className="mb-3 flex items-center text-[15px] font-semibold">Your study in {points.length} point{points.length === 1 ? '' : 's'}<Hint text="The main idea of your paper. Know these by heart." /></h2>
            <ol className="space-y-3">
              {points.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[12px] font-bold text-brand">{i + 1}</span>
                  <p className="text-[14px] leading-relaxed text-ink-2">{p}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {pack.elevatorPitch && (
          <section className="card p-4 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Mic size={17} strokeWidth={1.75} className="text-brand" aria-hidden />Opening line<Hint text="How to start your defense. Practice saying it out loud." /></h2>
              <button className="btn-ghost !h-8 !px-3 !text-[12px]" onClick={() => speak(speakable(pack.elevatorPitch, profile))}><Volume2 size={15} /> Listen</button>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2"><OpeningText text={script || !pitchLong ? pack.elevatorPitch : `${pitchFirst} ...`} profile={profile} /></p>
            {pitchLong && <button className="mt-1 text-[13px] font-semibold text-brand" onClick={() => setScript(!script)}>{script ? 'Show less' : 'Show full script'}</button>}
            <MissingProfile text={pack.elevatorPitch} profile={profile} go={go} />
          </section>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button className="card-link flex items-center gap-3 p-3.5 text-left" onClick={() => go('cards')}>
            <Layers size={20} className="shrink-0 text-brand" aria-hidden /><span className="text-[13px] font-semibold">Practice terms</span>
          </button>
          <button className="card-link flex items-center gap-3 p-3.5 text-left" onClick={() => go('panel')}>
            <Users size={20} className="shrink-0 text-brand" aria-hidden /><span className="text-[13px] font-semibold">Face the panel</span>
          </button>
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <section className="card p-4 md:p-5">
          <div className="flex items-center gap-4">
            <CircularProgress value={Math.round((read.length / pack.sections.length) * 100)} size={64} stroke={7} label="Chapters reviewed" />
            <div>
              <h2 className="text-[15px] font-semibold">{read.length} of {pack.sections.length} chapters read</h2>
              <button className="text-[13px] font-semibold text-brand" onClick={() => setTab('chapters')}>Open chapters</button>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-2 flex items-center text-[12px] font-semibold uppercase tracking-wide text-sub">Weakest chapters<Hint text="Your score per chapter, from reading, flashcards and panel answers." /></p>
            <ul className="space-y-2.5">
              {weakest.map((c) => (
                <li key={c.index}>
                  <button className="w-full text-left" onClick={() => { uiState.openChapter = c.index; setTab('chapters') }}>
                    <div className="mb-1 flex justify-between gap-2 text-[13px]"><span className="truncate">{c.title}</span><span className="font-semibold">{c.score}%</span></div>
                    <ProgressBar value={c.score} color={scoreColor(c.score)} className="h-1.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {pack.weakSpots?.length > 0 && (
          <section className="card p-4 md:p-5">
            <h2 className="mb-2.5 flex items-center gap-2 text-[15px] font-semibold"><AlertTriangle size={17} strokeWidth={1.75} className="text-red" aria-hidden />Panel may ask about<Hint text="Parts of your paper the panel is likely to question. Prepare answers for these." /></h2>
            <ul className="space-y-2">
              {pack.weakSpots.slice(0, 4).map((w, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-ink-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red" />{w}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function ChaptersTab({ pack, scores, read, markRead }) {
  const [open, setOpen] = useState(() => {
    const o = uiState.openChapter
    uiState.openChapter = null
    if (o != null) return o
    return pack.sections.findIndex((_, i) => !read.includes(i)) // first chapter not read yet (-1 = all read)
  })
  const [full, setFull] = useState({})

  return (
    <section className="card divide-y divide-line">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-[13px] text-sub">{read.length} of {pack.sections.length} read</span>
        <ProgressBar value={(read.length / pack.sections.length) * 100} className="h-1.5 max-w-48" />
      </div>
      {pack.sections.map((s, i) => {
        const isOpen = open === i
        const done = read.includes(i)
        const points = s.keyPoints?.length ? s.keyPoints : toPoints(s.summary)
        return (
          <div key={i}>
            <button className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${done ? 'bg-brand text-white' : 'border border-line text-sub'}`}>
                {done ? <Check size={13} strokeWidth={2.5} aria-label="Read" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 text-[14px] font-medium">{s.title}</span>
              <span className="text-[12px] font-semibold text-sub" title="Chapter score">{scores[i].score}%</span>
              <ChevronDown size={17} className={`shrink-0 text-sub transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {isOpen && (
              <div className="fade-up space-y-3 px-4 pb-4 md:pl-[52px]">
                <p className="eyebrow">Key points</p>
                <ul className="space-y-2">
                  {points.map((k, j) => (
                    <li key={j} className="flex gap-2.5 text-[14px] leading-snug text-ink-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />{k}</li>
                  ))}
                </ul>
                {s.summary && s.keyPoints?.length > 0 && (
                  full[i]
                    ? <p className="rounded-md bg-bg p-3 text-[13px] leading-relaxed text-ink-2">{s.summary}</p>
                    : <div><button className="text-[13px] font-semibold text-brand" onClick={() => setFull({ ...full, [i]: true })}>Read the full summary</button></div>
                )}
                {!done && (
                  <button className="btn-primary h-11 w-full md:!h-9 md:w-auto" onClick={() => { markRead(i); setOpen(pack.sections.findIndex((_, k) => k > i && !read.includes(k))) }}>
                    <Check size={16} /> I read this chapter
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}

function TermsTab({ pack, go }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const list = useMemo(() => pack.terms.map((t, i) => ({ ...t, i })).filter((t) => !q || `${t.term} ${t.definition}`.toLowerCase().includes(q.toLowerCase())), [pack.terms, q])
  return (
    <div>
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sub" aria-hidden />
          <input className="input !pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms" aria-label="Search terms" />
        </div>
        <button className="btn-primary shrink-0" onClick={() => go('cards')}><Layers size={15} /> Practice</button>
      </div>
      <p className="mb-2 text-[12px] text-sub">Tap a term to see its meaning.</p>
      <div className="grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => {
          const isOpen = open === t.i
          return (
            <button key={t.i} onClick={() => setOpen(isOpen ? null : t.i)} aria-expanded={isOpen}
              className={`card-link p-3.5 text-left ${isOpen ? '!border-brand-2/50' : ''}`}>
              <span className="flex items-start justify-between gap-2">
                <span className="text-[14px] font-semibold leading-snug">{t.term}</span>
                <ChevronDown size={16} className={`mt-0.5 shrink-0 text-sub transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
              </span>
              {isOpen && <span className="fade-up mt-1.5 block text-[13px] leading-snug text-ink-2">{t.definition}</span>}
            </button>
          )
        })}
      </div>
      {!list.length && <p className="py-6 text-center text-[13px] text-sub">No terms match "{q}".</p>}
    </div>
  )
}

function QuestionsTab({ pack, go }) {
  const types = ['All', ...new Set(pack.questions.map((q) => q.type))]
  const [type, setType] = useState('All')
  const [open, setOpen] = useState(null)
  const list = pack.questions.map((q, i) => ({ ...q, i })).filter((q) => type === 'All' || q.type === type)
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="swipe-row -mx-4 flex gap-1.5 px-4 md:mx-0 md:flex-wrap md:px-0" onClickCapture={centerOnTap}>
          {types.map((t) => (
            <button key={t} onClick={() => setType(t)} className={`h-8 shrink-0 rounded-full border px-3 text-[12px] font-medium ${type === t ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-card text-sub hover:text-ink'}`}>{t}</button>
          ))}
        </div>
        <button className="btn-primary hidden !h-9 md:inline-flex" onClick={() => go('panel')}><Users size={15} /> Practice with the panel</button>
      </div>
      <p className="mb-2 text-[12px] text-sub">Tap a question to see what a strong answer covers.</p>
      <section className="card divide-y divide-line">
        {list.map((q) => {
          const isOpen = open === q.i
          return (
            <div key={q.i}>
              <button className="flex w-full items-start gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : q.i)} aria-expanded={isOpen}>
                <CircleHelp size={17} className="mt-0.5 shrink-0 text-brand-2" aria-hidden />
                <span className="min-w-0 flex-1 text-[14px] font-medium leading-snug">{q.question}</span>
                <ChevronDown size={16} className={`mt-0.5 shrink-0 text-sub transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {isOpen && (
                <div className="fade-up px-4 pb-4 pl-11">
                  <p className="eyebrow mb-1.5 flex items-center gap-1"><ListChecks size={13} aria-hidden /> A strong answer covers</p>
                  <ul className="space-y-1">
                    {(q.idealPoints || []).map((p, j) => <li key={j} className="flex gap-2 text-[13px] text-ink-2"><Check size={15} className="mt-0.5 shrink-0 text-brand-2" />{p}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </section>
      <button className="btn-primary mt-3 h-11 w-full md:hidden" onClick={() => go('panel')}><Users size={15} /> Practice with the panel</button>
    </div>
  )
}
