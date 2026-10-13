import { useRef, useState } from 'react'
import { Check, Flame, Loader2, Mic, Square, Timer, Trophy, X, Zap } from 'lucide-react'
import { BackLink, Checkbox, Notice, PageHeader, ProgressBar } from '../components/ui.jsx'
import { gradeAnswer, hasAI } from '../lib/ai.js'
import { maskTerm, shuffle, similarity } from '../lib/match.js'
import { bumpStat, review, today } from '../lib/storage.js'
import { canListen, startListening } from '../lib/voice.js'

const CARDS = 5

// A fixed pick for the day, so reopening the page shows the same challenge.
function seededPick(arr, seed, n) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const a = arr.map((x, i) => ({ x, k: (Math.imul(i + 1, 2654435761) ^ h) >>> 0 }))
  return a.sort((p, q) => p.k - q.k).slice(0, n).map((o) => o.x)
}

export default function Daily({ state, pack, update, addXP, go, track }) {
  const d = today()
  const doneToday = !!state.profile.dailyDone?.[d]
  const total = state.profile.stats?.dailyCount || 0
  const [step, setStep] = useState('intro') // intro | cards | question | done

  const [cards] = useState(() => {
    const m = state.mastery[pack.id] || {}
    const items = pack.terms.map((t, i) => ({ ...t, key: `t${i}`, box: m[`t${i}`]?.box ?? 0, due: m[`t${i}`]?.due ?? 0 }))
    const due = items.filter((x) => x.due <= Date.now()).sort((a, b) => a.box - b.box)
    const pool = due.length >= CARDS ? due : [...due, ...shuffle(items.filter((x) => x.due > Date.now()))]
    return seededPick(pool.slice(0, Math.max(CARDS * 2, CARDS)), d, CARDS)
  })
  const [qIndex] = useState(() => seededPick(pack.questions.map((_, i) => i), d + 'q', 1)[0])
  const [cardScore, setCardScore] = useState(0)

  function finish(qScore) {
    update((s) => {
      s = bumpStat(s, 'dailyCount')
      return { ...s, profile: { ...s.profile, dailyDone: { ...(s.profile.dailyDone || {}), [d]: true } } }
    })
    track('daily')
    addXP(30 + cardScore * 2 + Math.round(qScore), 'Daily challenge')
    setStep('done')
  }

  if (doneToday && step !== 'done') {
    return (
      <div className="max-w-2xl">
        <BackLink onClick={() => go('practice')}>Practice</BackLink>
        <PageHeader eyebrow="Daily challenge" title="Done for today" desc="Come back tomorrow for a new challenge. Small daily practice beats cramming." />
        <section className="card flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand"><Check size={22} /></span>
          <div>
            <div className="text-[15px] font-semibold">{total} daily challenge{total === 1 ? '' : 's'} completed</div>
            <div className="text-[13px] text-sub">Current streak: {state.profile.streak} day{state.profile.streak === 1 ? '' : 's'}</div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <BackLink onClick={() => go('practice')}>Practice</BackLink>
      <PageHeader eyebrow="Daily challenge" title="Five minutes, every day" desc={`${CARDS} key terms and 1 panel question. Finish it to keep your streak and earn bonus XP.`} />

      {step === 'intro' && (
        <section className="card p-5">
          <ul className="space-y-2.5 text-[14px]">
            <li className="flex gap-3"><Zap size={18} className="mt-0.5 text-brand" />{CARDS} quick flashcards, weakest terms first</li>
            <li className="flex gap-3"><Mic size={18} className="mt-0.5 text-brand" />1 panel question, answered like the real defense</li>
            <li className="flex gap-3"><Flame size={18} className="mt-0.5 text-brand" />+30 XP bonus and your daily streak</li>
          </ul>
          <button className="btn-primary mt-5 h-11 w-full" onClick={() => setStep(cards.length ? 'cards' : 'question')}><Timer size={16} /> Start the challenge</button>
          <p className="mt-2 text-center text-[12px] text-sub">{total} completed so far</p>
        </section>
      )}

      {step === 'cards' && (
        <CardRound cards={cards} onAnswer={(key, ok) => { update((s) => ({ ...s, mastery: { ...s.mastery, [pack.id]: review(s.mastery[pack.id] || {}, key, ok) } })); track('cards'); if (ok) setCardScore((c) => c + 1) }} onDone={() => setStep('question')} />
      )}

      {step === 'question' && (
        <QuestionRound state={state} pack={pack} qIndex={qIndex} onDone={(score) => { track('panel'); finish(score) }} />
      )}

      {step === 'done' && (
        <section className="card fade-up p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand"><Trophy size={24} strokeWidth={1.75} /></span>
          <h2 className="mt-3 text-[22px] font-bold">Challenge complete</h2>
          <p className="mt-1 text-[13px] text-sub">{cardScore} of {CARDS} terms correct. See you tomorrow.</p>
          <div className="mt-5 flex justify-center gap-2">
            <button className="btn-primary" onClick={() => go('overview')}>Back to overview</button>
            <button className="btn-ghost" onClick={() => go('practice')}>Keep practicing</button>
          </div>
        </section>
      )}
    </div>
  )
}

function CardRound({ cards, onAnswer, onDone }) {
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState(null)
  const card = cards[i]
  if (!card) return null

  function submit(e) {
    e.preventDefault()
    if (result) {
      onAnswer(card.key, result !== 'wrong')
      setTyped('')
      setResult(null)
      if (i + 1 >= cards.length) onDone()
      else setI(i + 1)
      return
    }
    const sim = similarity(typed, card.term)
    setResult(sim >= 0.92 ? 'right' : sim >= 0.75 ? 'close' : 'wrong')
  }

  return (
    <form onSubmit={submit} className={`card space-y-4 p-5 ${result === 'wrong' ? 'shake !border-red/50' : result ? '!border-brand-2/50' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="eyebrow">Term {i + 1} of {cards.length}</span>
        <ProgressBar value={(i / cards.length) * 100} className="h-1.5 flex-1" />
      </div>
      <p className="text-[17px] leading-relaxed">{maskTerm(card.definition, card.term)}</p>
      <input autoFocus className="input !h-11 font-mono" value={typed} onChange={(e) => setTyped(e.target.value)} readOnly={!!result}
        placeholder="Type the term" aria-label="Type the term" autoCapitalize="off" autoCorrect="off" spellCheck="false" />
      {result && (
        <p className={`fade-up text-[14px] font-semibold ${result === 'wrong' ? 'text-red' : result === 'close' ? 'text-yellow-ink' : 'text-brand'}`}>
          {result === 'right' ? 'Correct' : result === 'close' ? `Close enough: ${card.term}` : `Answer: ${card.term}`}
        </p>
      )}
      <div className="flex gap-2">
        {!result && <button type="button" className="btn-ghost" onClick={() => setResult('wrong')}>Show</button>}
        <button className="btn-primary flex-1">{result ? (i + 1 >= cards.length ? 'Go to panel question' : 'Next term') : 'Check'}</button>
      </div>
    </form>
  )
}

function QuestionRound({ state, pack, qIndex, onDone }) {
  const q = pack.questions[qIndex]
  const [answer, setAnswer] = useState('')
  const [listening, setListening] = useState(false)
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState(null)
  const [checks, setChecks] = useState({})
  const [err, setErr] = useState('')
  const recRef = useRef(null)
  const points = q.idealPoints?.length ? q.idealPoints : ['A clear, direct answer', 'Evidence from your study']

  function mic() {
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const base = answer ? answer + ' ' : ''
    recRef.current = startListening({ onText: (t) => setAnswer(base + t), onEnd: () => setListening(false) })
    setListening(true)
  }

  async function submit() {
    recRef.current?.stop()
    setListening(false)
    if (!hasAI(state)) return setResult({ ai: false })
    setGrading(true)
    try {
      const r = await gradeAnswer(state.settings, pack, q, answer, { name: 'the panel', style: 'fair and encouraging, but honest' })
      setResult({ ai: true, ...r, score: Math.max(0, Math.min(10, Number(r.score) || 0)) })
    } catch (e) {
      setErr(`${e.message} You can grade yourself instead.`)
      setResult({ ai: false })
    } finally {
      setGrading(false)
    }
  }

  const selfScore = Math.round((Object.values(checks).filter(Boolean).length / points.length) * 10)

  return (
    <section className="card space-y-4 p-5">
      <span className="tag">{q.type}</span>
      <p className="text-[17px] font-medium leading-relaxed">{q.question}</p>
      {!result ? (
        <>
          <textarea className="input !h-auto min-h-32 py-3 leading-relaxed" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer like you would to the panel" aria-label="Your answer" />
          <div className="flex gap-2">
            {canListen && <button className={listening ? 'btn border border-red bg-red-soft text-red' : 'btn-ghost'} onClick={mic}>{listening ? <><Square size={13} className="fill-current" /> Stop</> : <><Mic size={16} /> Speak</>}</button>}
            <button className="btn-primary flex-1" disabled={!answer.trim() || grading} onClick={submit}>{grading ? <><Loader2 size={16} className="animate-spin" /> Checking</> : 'Submit answer'}</button>
          </div>
        </>
      ) : result.ai ? (
        <div className="fade-up space-y-3">
          <div className="text-[28px] font-bold text-brand">{result.score}<span className="text-[15px] text-sub">/10</span></div>
          <p className="text-[14px]">{result.verdict}</p>
          {result.betterAnswer && <div className="rounded-md border border-brand-2/25 bg-brand-soft p-3 text-[13px] text-brand-ink"><div className="eyebrow mb-1 !text-brand">Stronger answer</div>{result.betterAnswer}</div>}
          <button className="btn-primary h-11 w-full" onClick={() => onDone(result.score)}>Finish challenge</button>
        </div>
      ) : (
        <div className="fade-up">
          {err && <div className="mb-2"><Notice tone="red" icon={X}>{err}</Notice></div>}
          <p className="mb-1 text-[14px] font-semibold">Did you mention:</p>
          {points.map((p, i) => <Checkbox key={i} checked={!!checks[i]} onChange={(v) => setChecks({ ...checks, [i]: v })} label={p} />)}
          <button className="btn-primary mt-3 h-11 w-full" onClick={() => onDone(selfScore)}>Finish challenge</button>
        </div>
      )}
    </section>
  )
}
