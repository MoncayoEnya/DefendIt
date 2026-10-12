import { useState } from 'react'

export function speak(text) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.95
  speechSynthesis.speak(u)
}

export default function Guide({ pack, update, addXP, go }) {
  const [open, setOpen] = useState(0)
  const [showQ, setShowQ] = useState({})
  const read = pack.readSections || []

  function markRead(i) {
    if (read.includes(i)) return
    update((s) => {
      const p = s.packs.find((x) => x.id === pack.id)
      p.readSections = [...(p.readSections || []), i]
      return s
    })
    addXP(10, 'Section reviewed')
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Study guide</p>
        <h1 className="text-2xl font-bold">{pack.title}</h1>
      </div>

      {pack.overview && (
        <section className="card p-5">
          <h2 className="mb-2 font-bold text-mint">Your study in a nutshell</h2>
          <p className="leading-relaxed">{pack.overview}</p>
        </section>
      )}

      {pack.elevatorPitch && (
        <section className="card border-gold/40 p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-bold text-gold">🎤 Opening line to practice</h2>
            <button className="btn-ghost !py-1.5 text-sm" onClick={() => speak(pack.elevatorPitch)}>▶ Listen</button>
          </div>
          <p className="italic leading-relaxed">"{pack.elevatorPitch}"</p>
          <p className="mt-3 text-sm text-muted">Say it out loud 3 times. Then try it without looking.</p>
        </section>
      )}

      {pack.weakSpots?.length > 0 && (
        <section className="card border-rose/40 p-5">
          <h2 className="mb-2 font-bold text-rose">🎯 Where the panel will attack</h2>
          <ul className="list-disc space-y-1 pl-5">
            {pack.weakSpots.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm uppercase tracking-wider text-muted">Chapters · {read.length}/{pack.sections.length} reviewed</h2>
        <div className="space-y-2">
          {pack.sections.map((s, i) => (
            <div key={i} className="card overflow-hidden">
              <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(open === i ? -1 : i)}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${read.includes(i) ? 'bg-mint text-ink' : 'bg-panel2 text-muted'}`}>{read.includes(i) ? '✓' : i + 1}</span>
                <span className="flex-1 font-medium">{s.title}</span>
                <span className="text-muted">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="space-y-3 px-4 pb-4">
                  <p className="leading-relaxed text-[#cfd4f5]">{s.summary}</p>
                  {s.keyPoints?.length > 0 && (
                    <ul className="space-y-1.5">
                      {s.keyPoints.map((k, j) => <li key={j} className="flex gap-2"><span className="text-mint">▸</span><span>{k}</span></li>)}
                    </ul>
                  )}
                  {!read.includes(i) && <button className="btn-primary !py-2 text-sm" onClick={() => { markRead(i); setOpen(i + 1) }}>Got it · +10 XP</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wider text-muted">Key terms</h2>
          <button className="text-sm text-mint" onClick={() => go('cards')}>Drill them →</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {pack.terms.map((t, i) => (
            <div key={i} className="card p-3">
              <div className="font-bold text-sky">{t.term}</div>
              <div className="text-sm text-[#cfd4f5]">{t.definition}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wider text-muted">Likely panel questions</h2>
          <button className="text-sm text-mint" onClick={() => go('panel')}>Practice them →</button>
        </div>
        <div className="space-y-2">
          {pack.questions.map((q, i) => (
            <div key={i} className="card p-4">
              <span className="chip mb-2">{q.type}</span>
              <p className="font-medium">{q.question}</p>
              {showQ[i] ? (
                <ul className="mt-2 space-y-1 text-sm text-[#cfd4f5]">
                  {q.idealPoints?.map((p, j) => <li key={j}>✓ {p}</li>)}
                </ul>
              ) : (
                <button className="mt-2 text-sm text-muted underline" onClick={() => setShowQ({ ...showQ, [i]: true })}>Show what a good answer covers</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
