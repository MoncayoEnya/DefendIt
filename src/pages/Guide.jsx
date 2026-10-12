import { useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Mic, Volume2 } from 'lucide-react'
import { PageHeader, ProgressBar, SectionTitle } from '../components/ui.jsx'
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
      <PageHeader
        eyebrow={pack.sample ? 'Study guide · Sample thesis' : 'Study guide'}
        title={pack.title}
        desc={`${pack.fileName} · ${pack.sections.length} chapters · ${pack.terms.length} key terms · ${pack.questions.length} panel questions`}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="min-w-0 space-y-4">
          {pack.overview && (
            <section className="card p-5">
              <h2 className="mb-1.5 text-[15px] font-semibold">Your study in brief</h2>
              <p className="text-[14px] leading-relaxed text-[#2b343d]">{pack.overview}</p>
            </section>
          )}

          {pack.elevatorPitch && (
            <section className="card border-l-4 !border-l-brand p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Mic size={17} strokeWidth={1.75} className="text-brand" /> Opening statement to practice</h2>
                <button className="btn-ghost !h-8 !px-3 !text-[12px]" onClick={() => speak(pack.elevatorPitch)}><Volume2 size={15} /> Listen</button>
              </div>
              <p className="text-[14px] leading-relaxed text-[#2b343d]">{pack.elevatorPitch}</p>
              <p className="mt-3 text-[12px] text-sub">Say it out loud three times, then once without looking.</p>
            </section>
          )}

          <section>
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <h2 className="text-[15px] font-semibold md:text-[17px]">Chapters</h2>
              <span className="text-[12px] text-sub">{read.length} of {pack.sections.length} reviewed</span>
            </div>
            <ProgressBar value={(read.length / pack.sections.length) * 100} className="mb-3 h-1.5" />
            <div className="card divide-y divide-line">
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
                      <div className="fade-up space-y-3 px-4 pb-4 pl-[52px]">
                        <p className="text-[14px] leading-relaxed text-[#2b343d]">{s.summary}</p>
                        {s.keyPoints?.length > 0 && (
                          <ul className="space-y-1.5">
                            {s.keyPoints.map((k, j) => (
                              <li key={j} className="flex gap-2 text-[13px] text-[#2b343d]"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />{k}</li>
                            ))}
                          </ul>
                        )}
                        {!done && <button className="btn-primary !h-9" onClick={() => { markRead(i); setOpen(i + 1) }}>Mark as reviewed</button>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section>
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
          <section className="card p-5">
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
