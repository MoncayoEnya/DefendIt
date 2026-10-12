import { useMemo, useRef, useState } from 'react'
import { review } from '../lib/storage.js'
import { maskTerm, similarity, shuffle } from '../lib/match.js'

const SESSION = 10

export default function Flashcards({ state, pack, update, addXP }) {
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

  const mastered = Object.entries(state.mastery[pack.id] || {}).filter(([k, v]) => k.startsWith('t') && v.box >= 3).length

  if (!mode) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Flashcards</p>
          <h1 className="text-2xl font-bold">Lock in your key terms</h1>
          <p className="text-muted">{mastered}/{pack.terms.length} mastered · cards you miss come back sooner</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard icon="🔄" title="Flip mode" desc="Read the clue, say the term in your head, flip and rate yourself." onClick={() => setMode('flip')} />
          <ModeCard icon="⌨️" title="Type mode" desc="Read the clue and type the exact term. Typos are forgiven a little." onClick={() => setMode('type')} />
        </div>
      </div>
    )
  }

  return (
    <Session
      key={round + mode}
      mode={mode}
      deck={deck}
      onAnswer={(key, ok) => update((s) => ({ ...s, mastery: { ...s.mastery, [pack.id]: review(s.mastery[pack.id] || {}, key, ok) } }))}
      onDone={(correct) => addXP(correct * (mode === 'type' ? 6 : 4), `${correct}/${deck.length} cards`)}
      onAgain={() => setRound(round + 1)}
      onExit={() => setMode(null)}
    />
  )
}

function ModeCard({ icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="card p-5 text-left transition hover:border-mint active:scale-[.98]">
      <div className="text-3xl">{icon}</div>
      <div className="mt-2 text-lg font-bold">{title}</div>
      <div className="text-sm text-muted">{desc}</div>
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
      <div className="card pop p-8 text-center">
        <div className="text-5xl">{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</div>
        <h2 className="mt-3 text-2xl font-bold">{correct}/{deck.length} correct</h2>
        <p className="text-muted">{pct >= 80 ? 'Panel-ready on these terms!' : 'Missed cards will come back sooner. Keep going!'}</p>
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
      <div className="flex items-center gap-3 text-sm">
        <button className="text-muted" onClick={onExit}>← Back</button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel2">
          <div className="h-full bg-mint transition-all" style={{ width: `${(i / deck.length) * 100}%` }} />
        </div>
        <span className="font-mono text-muted">{i + 1}/{deck.length}</span>
        {combo >= 2 && <span className="pop font-mono font-bold text-gold">x{combo} combo</span>}
      </div>

      {mode === 'flip' ? (
        <>
          <div className={`flip cursor-pointer ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
            <div className="flip-inner relative h-72">
              <div className="face card absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="chip mb-3">What term is this?</span>
                <p className="text-lg leading-relaxed">{clue}</p>
                <p className="mt-4 text-xs text-muted">tap to flip</p>
              </div>
              <div className="face back card absolute inset-0 flex flex-col items-center justify-center border-mint/60 p-6 text-center">
                <p className="text-3xl font-bold text-mint">{card.term}</p>
                <p className="mt-3 text-sm text-muted">{card.definition}</p>
              </div>
            </div>
          </div>
          {flipped ? (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn border border-rose/50 text-rose" onClick={() => next(false)}>✗ Missed it</button>
              <button className="btn-primary" onClick={() => next(true)}>✓ Knew it</button>
            </div>
          ) : (
            <button className="btn-ghost w-full" onClick={() => setFlipped(true)}>Flip card</button>
          )}
        </>
      ) : (
        <form onSubmit={check} className={`card space-y-4 p-6 ${result === 'wrong' ? 'shake border-rose/60' : result ? 'border-mint/60' : ''}`}>
          <span className="chip">Type the term</span>
          <p className="text-lg leading-relaxed">{clue}</p>
          <input
            ref={inputRef}
            autoFocus
            className="input font-mono text-lg"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Your answer…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            readOnly={!!result}
          />
          {result && (
            <div className="pop">
              {result === 'right' && <p className="font-bold text-mint">✓ Correct!</p>}
              {result === 'close' && <p className="font-bold text-gold">≈ Close enough! Exact: <span className="font-mono">{card.term}</span></p>}
              {result === 'wrong' && <p className="font-bold text-rose">✗ Answer: <span className="font-mono">{card.term}</span></p>}
            </div>
          )}
          <div className="flex gap-2">
            {!result && <button type="button" className="btn-ghost" onClick={() => setResult('wrong')}>Show</button>}
            <button className="btn-primary flex-1">{result ? 'Next →' : 'Check'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
