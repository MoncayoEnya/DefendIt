import { useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Mic, Volume2 } from 'lucide-react'
import { CircularProgress, PageHeader, ProgressBar, SectionTitle } from '../components/ui.jsx'
import { chapterScores, uiState } from '../lib/chapters.js'

export function speak(text) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.95
  speechSynthesis.speak(u)
}

export default function Guide({ state, pack, update, addXP, go }) {
  const [open, setOpen] = useState(() => {
    const o = uiState.openChapter
    uiState.openChapter = null
    return o ?? 0
  })
  const scores = chapterScores(state, pack)
  const [showQ, setShowQ] = useState({})
  const read = pack.readSections || []
  const avgChapter = scores.length ? Math.round(scores.reduce((a, c) => a + c.score, 0) / scores.length) : 0
  const meta = `${pack.sections.length} chapter${pack.sections.length === 1 ? '' : 's'} · ${pack.terms.length} key terms`

  function markRead(i) {
    if (read.includes(i)) return
    update((s) => {
      const p = s.packs.find((x) => x.id === pack.id)
      p.readSections = [...(p.readSections || []), i]
      return s
    })
    addXP(10, 'Chapter reviewed')
  }

  return (
    <div>
      {/* phone: compact page title */}
      <div className="mb-4 md:hidden">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Study Guide</h1>
        <p className="mt-1 text-[14px] font-semibold leading-snug">{pack.title}</p>
        <p className="text-[12px] text-sub">{pack.fileName} · {meta}{pack.sample ? ' · Sample' : ''}</p>
      </div>
      <div className="hidden md:block">
        <PageHeader
          eyebrow={pack.sample ? 'Study guide · Sample thesis' : 'Study guide'}
          title={pack.title}
          desc={`${pack.fileName} · ${meta} · ${pack.questions.length} panel questions`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          {pack.overview && (
            <section className="card order-1 p-4 md:order-none md:p-5">
              <h2 className="mb-1.5 text-[15px] font-semibold">Your study in brief</h2>
              <p className="text-[14px] leading-relaxed text-[#2b343d]">{pack.overview}</p>
            </section>
          )}

          {pack.elevatorPitch && (
            <section className="card order-3 border-l-4 !border-l-brand p-4 md:order-none md:p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Mic size={17} strokeWidth={1.75} className="text-brand" /> Opening statement to practice</h2>
                <button className="btn-ghost !h-8 !px-3 !text-[12px]" onClick={() => speak(pack.elevatorPitch)}><Volume2 size={15} /> Listen</button>
              </div>
              <p className="text-[14px] leading-relaxed text-[#2b343d]">{pack.elevatorPitch}</p>
              <p className="mt-3 text-[12px] text-sub">Say it out loud three times, then once without looking.</p>
            </section>
          )}

          <section className="order-2 md:order-none">
            <div className="mb-2.5 hidden items-end justify-between gap-3 md:flex">
              <h2 className="text-[17px] font-semibold">Chapters</h2>
              <span className="text-[12px] text-sub">{read.length} of {pack.sections.length} reviewed</span>
            </div>
            <ProgressBar value={(read.length / pack.sections.length) * 100} className="mb-3 hidden h-1.5 md:block" />
            <div className="card divide-y divide-line">
              {/* phone: progress header inside the card */}
              <div className="flex items-center justify-between gap-4 p-4 md:hidden">
                <div>
                  <h2 className="text-[15px] font-semibold">Chapters progress</h2>
                  <p className="mt-0.5 text-[12px] text-sub">{read.length} of {pack.sections.length} reviewed</p>
                  <p className="text-[12px] text-sub">{pack.terms.length} key terms</p>
                </div>
                <CircularProgress value={avgChapter} size={68} stroke={7} label={`Chapters readiness ${avgChapter}%`} />
              </div>
              {pack.sections.map((s, i) => {
                const isOpen = open === i
                const done = read.includes(i)
                return (
                  <div key={i}>
                    <button className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${done ? 'bg-brand text-white' : 'border border-line text-sub'}`}>
                        {done ? <Check size={13} strokeWidth={2.5} /> : i + 1}
                      </span>
                      <span className="flex-1 text-[14px] font-medium">{s.title}</span>
                      <span className={`hidden w-20 items-center gap-2 sm:flex`} title={`Chapter readiness ${scores[i].score}%`}>
                        <ProgressBar value={scores[i].score} color={scoreColor(scores[i].score)} className="h-1.5" />
                      </span>
                      <span className="w-9 text-right text-[12px] font-semibold text-sub">{scores[i].score}%</span>
                      <ChevronDown size={17} className={`text-sub transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="fade-up space-y-3 px-4 pb-4 md:pl-[52px]">
                        <p className="text-[14px] leading-relaxed text-[#2b343d]">{s.summary}</p>
                        {s.keyPoints?.length > 0 && (
                          <ul className="space-y-1.5">
                            {s.keyPoints.map((k, j) => (
                              <li key={j} className="flex gap-2 text-[13px] text-[#2b343d]"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />{k}</li>
                            ))}
                          </ul>
                        )}
                        {!done && <button className="btn-primary h-11 w-full md:!h-9 md:w-auto" onClick={() => { markRead(i); setOpen(i + 1) }}>Mark as reviewed</button>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="order-4 md:order-none">
            <SectionTitle right={<button className="text-[13px] font-semibold text-brand" onClick={() => go('panel')}>Practice with the panel</button>}>Likely panel questions</SectionTitle>
            <div className="space-y-2">
              {pack.questions.map((q, i) => (
                <div key={i} className="card p-4">
                  <span className="tag mb-2">{q.type}</span>
                  <p className="text-[14px] font-medium">{q.question}</p>
                  {showQ[i] ? (
                    <ul className="fade-up mt-2.5 space-y-1">
                      {q.idealPoints?.map((p, j) => <li key={j} className="flex gap-2 text-[13px] text-[#2b343d]"><Check size={15} className="mt-0.5 shrink-0 text-brand-2" />{p}</li>)}
                    </ul>
                  ) : (
                    <button className="mt-2 text-[12px] font-medium text-sub underline-offset-2 hover:text-ink hover:underline" onClick={() => setShowQ({ ...showQ, [i]: true })}>Show what a strong answer covers</button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="card hidden p-5 md:block">
            <h2 className="mb-1 text-[15px] font-semibold">Readiness by chapter</h2>
            <p className="mb-3 text-[12px] text-sub">From reading, flashcards and panel answers in each chapter.</p>
            <ul className="space-y-2.5">
              {[...scores].sort((a, b) => a.score - b.score).map((c) => (
                <li key={c.index}>
                  <button className="w-full text-left" onClick={() => setOpen(c.index)}>
                    <div className="mb-1 flex justify-between gap-2 text-[13px]"><span className="truncate">{c.title}</span><span className="font-semibold">{c.score}%</span></div>
                    <ProgressBar value={c.score} color={scoreColor(c.score)} className="h-1.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {pack.weakSpots?.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-2.5 flex items-center gap-2 text-[15px] font-semibold"><AlertTriangle size={17} strokeWidth={1.75} className="text-red" /> Where the panel may push</h2>
              <ul className="space-y-2">
                {pack.weakSpots.map((w, i) => <li key={i} className="flex gap-2 text-[13px] text-[#2b343d]"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red" />{w}</li>)}
              </ul>
            </section>
          )}
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Key terms</h2>
              <button className="text-[13px] font-semibold text-brand" onClick={() => go('cards')}>Drill them</button>
            </div>
            <dl className="divide-y divide-line">
              {pack.terms.map((t, i) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-[13px] font-semibold">{t.term}</dt>
                  <dd className="text-[12px] leading-snug text-sub">{t.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}

function scoreColor(v) {
  return v >= 70 ? 'bg-brand-2' : v >= 40 ? 'bg-yellow' : 'bg-red'
}
