import { useMemo, useRef, useState } from 'react'
import { Check, Keyboard, RotateCcw, Trophy, X, Zap } from 'lucide-react'
import { BackLink, IconBox, PageHeader, ProgressBar } from '../components/ui.jsx'
import { review } from '../lib/storage.js'
import { maskTerm, similarity, shuffle } from '../lib/match.js'

const SESSION = 10

export default function Flashcards({ state, pack, update, addXP, go }) {
  const [mode, setMode] = useState(null) // 'flip' | 'type'
  const [round, setRound] = useState(0)

  const deck = useMemo(() => {
    const m = state.mastery[pack.id] || {}
    const now = Date.now()
    const items = pack.terms.map((t, i) => ({ ...t, key: `t${i}`, box: m[`t${i}`]?.box ?? 0, due: m[`t${i}`]?.due ?? 0 }))
    const due = shuffle(items.filter((x) => x.due <= now)).sort((a, b) => a.box - b.box)
    const later = shuffle(items.filter((x) => x.due > now))
    return [...due, ...later].slice(0, SESSION)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack.id, round])

  const entries = Object.entries(state.mastery[pack.id] || {}).filter(([k]) => k.startsWith('t'))
  const mastered = entries.filter(([, v]) => v.box >= 3).length
  const dueNow = pack.terms.length - entries.filter(([, v]) => v.due > Date.now()).length

  if (!mode) {
    return (
      <div className="max-w-3xl">
        <BackLink onClick={() => go('practice')}>Practice</BackLink>
        <PageHeader eyebrow="Flashcards" title="Lock in your key terms" desc="Cards you miss come back sooner. Cards you know well wait longer." />
        <div className="card mb-4 grid grid-cols-3 divide-x divide-line">
          <Stat label="Mastered" value={`${mastered}/${pack.terms.length}`} />
          <Stat label="Reviewed" value={entries.length} />
          <Stat label="Due now" value={dueNow} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard icon={RotateCcw} title="Flip mode" desc="Read the clue, recall the term, then flip and rate yourself." onClick={() => setMode('flip')} />
          <ModeCard icon={Keyboard} tone="blue" title="Type mode" desc="Read the clue and type the term. Small typos are accepted." onClick={() => setMode('type')} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Session
        key={round + mode}
        mode={mode}
        deck={deck}
        onAnswer={(key, ok) => update((s) => ({ ...s, mastery: { ...s.mastery, [pack.id]: review(s.mastery[pack.id] || {}, key, ok) } }))}
        onDone={(correct) => addXP(correct * (mode === 'type' ? 6 : 4), `${correct}/${deck.length} cards`)}
        onAgain={() => setRound(round + 1)}
        onExit={() => setMode(null)}
      />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="p-4 text-center">
      <div className="text-[20px] font-bold">{value}</div>
      <div className="text-[12px] text-sub">{label}</div>
    </div>
  )
}

function ModeCard({ icon, title, desc, onClick, tone }) {
  return (
    <button onClick={onClick} className="card-link p-5 text-left">
      <IconBox icon={icon} tone={tone} />
      <div className="mt-3 text-[15px] font-semibold">{title}</div>
      <div className="mt-0.5 text-[13px] text-sub">{desc}</div>
    </button>
  )
}

function Session({ mode, deck, onAnswer, onDone, onAgain, onExit }) {
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState(null) // null | 'right' | 'close' | 'wrong'
  const [correct, setCorrect] = useState(0)
  const [combo, setCombo] = useState(0)
  const inputRef = useRef()
  const card = deck[i]

  function next(ok) {
    onAnswer(card.key, ok)
    const c = correct + (ok ? 1 : 0)
    setCorrect(c)
    setCombo(ok ? combo + 1 : 0)
    setFlipped(false)
    setTyped('')
    setResult(null)
    if (i + 1 >= deck.length) {
      onDone(c)
      setI(deck.length)
    } else {
      setI(i + 1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function check(e) {
    e.preventDefault()
    if (result) return next(result !== 'wrong')
    const sim = similarity(typed, card.term)
    setResult(sim >= 0.92 ? 'right' : sim >= 0.75 ? 'close' : 'wrong')
  }

  if (i >= deck.length) {
    const pct = Math.round((correct / deck.length) * 100)
    return (
      <div className="card fade-up p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand"><Trophy size={24} strokeWidth={1.75} /></span>
        <h2 className="mt-3 text-[22px] font-bold">{correct} of {deck.length} correct</h2>
        <p className="mt-1 text-[13px] text-sub">{pct >= 80 ? 'You are panel-ready on these terms.' : 'Missed cards will return sooner. Keep going.'}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button className="btn-primary" onClick={onAgain}>Next round</button>
          <button className="btn-ghost" onClick={onExit}>Change mode</button>
        </div>
      </div>
    )
  }

  const clue = maskTerm(card.definition, card.term)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button className="text-[13px] font-medium text-sub hover:text-ink" onClick={onExit}>Exit</button>
        <ProgressBar value={(i / deck.length) * 100} className="h-1.5 flex-1" />
        <span className="text-[12px] font-medium text-sub">{i + 1} / {deck.length}</span>
        {combo >= 2 && <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#8a6a00]"><Zap size={14} /> {combo} streak</span>}
      </div>

      {mode === 'flip' ? (
        <>
          <div className={`flip cursor-pointer ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setFlipped(!flipped)} aria-label="Flip card">
            <div className="flip-inner relative h-72">
              <div className="face card absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="eyebrow mb-3">Which term is this?</span>
                <p className="text-[17px] leading-relaxed">{clue}</p>
                <p className="mt-4 text-[12px] text-sub">Tap to flip</p>
              </div>
              <div className="face back card absolute inset-0 flex flex-col items-center justify-center !border-brand-2/40 p-6 text-center">
                <p className="text-[26px] font-bold text-brand">{card.term}</p>
                <p className="mt-3 text-[13px] text-sub">{card.definition}</p>
              </div>
            </div>
          </div>
          {flipped ? (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn h-11 border border-red/40 bg-white text-red hover:bg-red-soft" onClick={() => next(false)}><X size={16} /> Missed it</button>
              <button className="btn-primary h-11" onClick={() => next(true)}><Check size={16} /> Knew it</button>
            </div>
          ) : (
            <button className="btn-ghost h-11 w-full" onClick={() => setFlipped(true)}>Flip card</button>
          )}
        </>
      ) : (
        <form onSubmit={check} className={`card space-y-4 p-6 ${result === 'wrong' ? 'shake !border-red/50' : result ? '!border-brand-2/50' : ''}`}>
          <span className="eyebrow">Type the term</span>
          <p className="text-[17px] leading-relaxed">{clue}</p>
          <input
            ref={inputRef} autoFocus className="input !h-11 font-mono" value={typed} onChange={(e) => setTyped(e.target.value)}
            placeholder="Your answer" aria-label="Your answer" autoCapitalize="off" autoCorrect="off" spellCheck="false" readOnly={!!result}
          />
          {result && (
            <div className="fade-up text-[14px] font-semibold" aria-live="polite">
              {result === 'right' && <p className="flex items-center gap-1.5 text-brand"><Check size={16} /> Correct</p>}
              {result === 'close' && <p className="text-[#8a6a00]">Close enough. Exact term: <span className="font-mono">{card.term}</span></p>}
              {result === 'wrong' && <p className="text-red">Answer: <span className="font-mono">{card.term}</span></p>}
            </div>
          )}
          <div className="flex gap-2">
            {!result && <button type="button" className="btn-ghost" onClick={() => setResult('wrong')}>Show answer</button>}
            <button className="btn-primary flex-1">{result ? 'Next card' : 'Check'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
