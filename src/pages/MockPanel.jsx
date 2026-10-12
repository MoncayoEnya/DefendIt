import { useEffect, useRef, useState } from 'react'
import { Calculator, Check, Clock, Flame, GraduationCap, Info, Loader2, MessageSquareText, Mic, Search, Square, Trophy, Volume2, X } from 'lucide-react'
import { BackLink, Checkbox, Notice, PageHeader, ProgressBar } from '../components/ui.jsx'
import { gradeAnswer } from '../lib/ai.js'
import { shuffle } from '../lib/match.js'
import { review } from '../lib/storage.js'
import { canListen, countFillers, startListening } from '../lib/voice.js'
import { speak } from './Guide.jsx'

const PANEL = [
  { name: 'Dr. Numbers', title: 'Statistics and validity', icon: Calculator, tone: 'bg-blue-soft text-blue', style: 'precise and skeptical, focuses on sample size, statistics, validity and whether numbers support claims' },
  { name: 'Prof. Method', title: 'Design and procedures', icon: Search, tone: 'bg-yellow-soft text-[#8a6a00]', style: 'calm but relentless, questions research design, instruments, procedures and limitations' },
  { name: 'Dean Impact', title: 'Significance and novelty', icon: GraduationCap, tone: 'bg-brand-soft text-brand', style: 'big-picture, asks about significance, novelty, real-world impact and future work' },
]
const PANELIST_HP = 100
const PLAYER_HP = 100

export default function MockPanel({ state, pack, update, addXP, go }) {
  const [phase, setPhase] = useState('intro') // intro | battle | won | lost
  const [pressure, setPressure] = useState(false)
  const [game, setGame] = useState(null)
  const hasKey = !!state.settings.apiKey

  function start() {
    setGame({ idx: 0, panelHp: PANELIST_HP, hp: PLAYER_HP, queue: shuffle(pack.questions), qIdx: 0, scores: [], followUp: null })
    setPhase('battle')
  }

  function endBattle(won, scores) {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    update((s) => {
      const p = s.packs.find((x) => x.id === pack.id)
      p.panelBest = Math.max(p.panelBest || 0, Math.round(avg * 10) / 10)
      p.panelSessions = (p.panelSessions || 0) + 1
      return s
    })
    addXP(Math.round(avg * 8) + (won ? 60 : 10), won ? 'Defense passed' : 'Panel practice')
    setGame((g) => ({ ...g, avg }))
    setPhase(won ? 'won' : 'lost')
  }

  if (phase === 'intro' || !game) {
    return (
      <div className="mx-auto max-w-3xl">
        <BackLink onClick={() => go('practice')}>Practice</BackLink>
        <PageHeader eyebrow="Practice panel" title="Face the panel" desc="Three panelists question you on your paper. Strong answers win them over. Weak answers cost you composure." />
        <div className="grid gap-3 sm:grid-cols-3">
          {PANEL.map((b) => (
            <div key={b.name} className="card flex items-center gap-3 p-4 sm:flex-col sm:items-start">
              <span className={`grid h-10 w-10 place-items-center rounded-md ${b.tone}`}><b.icon size={20} strokeWidth={1.75} /></span>
              <div>
                <div className="text-[14px] font-semibold">{b.name}</div>
                <div className="text-[12px] text-sub">{b.title}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card mt-3 p-4">
          <Checkbox checked={pressure} onChange={setPressure} label="Pressure mode" sub="45 seconds per answer instead of 90, and tougher follow-up questions." />
        </div>

        <div className="mt-3 space-y-3">
          {!hasKey && (
            <Notice tone="yellow" icon={Info}>
              Offline mode: you grade yourself with a checklist. <button className="font-semibold underline" onClick={() => go('settings')}>Add a free AI key</button> and the panel will score you, write a stronger answer and ask follow-ups.
            </Notice>
          )}
          {pack.panelBest > 0 && <p className="text-[13px] text-sub">Your best average so far: <span className="font-semibold text-ink">{pack.panelBest} / 10</span></p>}
          <button className="btn-primary h-11 w-full" onClick={start}>Enter the defense room</button>
        </div>
      </div>
    )
  }

  if (phase === 'won' || phase === 'lost') {
    const won = phase === 'won'
    return (
      <div className="mx-auto max-w-xl">
        <div className="card fade-up p-8 text-center">
          <span className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${won ? 'bg-brand-soft text-brand' : 'bg-red-soft text-red'}`}>
            {won ? <Trophy size={24} strokeWidth={1.75} /> : <X size={24} strokeWidth={1.75} />}
          </span>
          <h2 className="mt-3 text-[22px] font-bold">{won ? 'You defended successfully' : 'The panel won this round'}</h2>
          <p className="mt-1 text-[13px] text-sub">Average score <span className="font-semibold text-ink">{game.avg.toFixed(1)} / 10</span> across {game.scores.length} questions</p>
          <p className="mt-3 text-[13px]">{won ? 'Try Pressure mode next so the real defense feels easier.' : 'Review the stronger answers and the study guide, then try again.'}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button className="btn-primary" onClick={() => setPhase('intro')}>Practice again</button>
            <button className="btn-ghost" onClick={() => go('guide')}>Open study guide</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Battle game={game} setGame={setGame} pack={pack} state={state} update={update} pressure={pressure} hasKey={hasKey} onEnd={endBattle} />
    </div>
  )
}

function Battle({ game, setGame, pack, state, update, pressure, hasKey, onEnd }) {
  const member = PANEL[game.idx]
  const q = game.followUp || game.queue[game.qIdx % game.queue.length]
  const limit = pressure ? 45 : 90
  const [answer, setAnswer] = useState('')
  const [time, setTime] = useState(limit)
  const [listening, setListening] = useState(false)
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState(null)
  const [checks, setChecks] = useState({})
  const [err, setErr] = useState('')
  const [hit, setHit] = useState(null)
  const recRef = useRef(null)

  useEffect(() => {
    if (result) return
    const t = setInterval(() => setTime((x) => Math.max(0, x - 1)), 1000)
    return () => clearInterval(t)
  }, [result, q])

  useEffect(() => () => recRef.current?.stop(), [])

  function toggleMic() {
    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }
    const base = answer ? answer + ' ' : ''
    recRef.current = startListening({ onText: (t) => setAnswer(base + t), onEnd: () => setListening(false) })
    setListening(true)
  }

  async function submit() {
    recRef.current?.stop()
    setListening(false)
    setErr('')
    const fillers = countFillers(answer)
    const words = answer.trim().split(/\s+/).filter(Boolean).length
    if (hasKey) {
      setGrading(true)
      try {
        const r = await gradeAnswer(state.settings, pack, q, answer, { ...member, style: member.style + (pressure ? ', and you are strict because this is a high-pressure round' : '') })
        setResult({ ...r, score: clamp(Number(r.score) || 0), fillers, words, ai: true })
      } catch (e) {
        setErr(`${e.message} You can grade yourself below instead.`)
        setResult({ score: null, fillers, words, ai: false })
      } finally {
        setGrading(false)
      }
    } else {
      setResult({ score: null, fillers, words, ai: false })
    }
  }

  const points = q.idealPoints?.length ? q.idealPoints : ['A clear, direct answer', 'Evidence or numbers from your study', 'A short closing sentence']

  function finalScore() {
    if (result.score != null) return result.score
    const got = Object.values(checks).filter(Boolean).length
    return clamp(Math.round((got / points.length) * 10 - (result.words < 15 ? 2 : 0)))
  }

  function nextQuestion() {
    const score = finalScore()
    const qi = pack.questions.indexOf(q)
    if (qi >= 0) update((s) => ({ ...s, mastery: { ...s.mastery, [pack.id]: review(s.mastery[pack.id] || {}, `q${qi}`, score >= 7) } }))

    const dmg = score * 10 + (score >= 9 ? 15 : 0)
    const hurt = score < 6 ? (6 - score) * 9 : 0
    setHit({ dmg, hurt })
    setTimeout(() => setHit(null), 1200)

    const scores = [...game.scores, score]
    let { idx, panelHp, hp, qIdx } = game
    panelHp -= dmg
    hp -= hurt
    qIdx = game.followUp ? qIdx : qIdx + 1
    let followUp = null
    if (hp <= 0) return onEnd(false, scores)
    if (panelHp <= 0) {
      idx++
      panelHp = PANELIST_HP
      if (idx >= PANEL.length) return onEnd(true, scores)
    } else if (result.followUp && (pressure || score >= 5) && !game.followUp) {
      followUp = { question: result.followUp, type: 'Follow-up', idealPoints: [] }
    }
    setGame({ ...game, idx, panelHp, hp, qIdx, scores, followUp })
    setAnswer('')
    setResult(null)
    setChecks({})
    setTime(limit)
  }

  const score = result ? finalScore() : null
  const words = answer.trim().split(/\s+/).filter(Boolean).length
  const scoreTone = score >= 7 ? 'text-brand' : score >= 5 ? 'text-[#8a6a00]' : 'text-red'

  return (
    <div className="space-y-3">
      <section className="card relative p-4">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${member.tone} ${hit?.dmg ? 'shake' : ''}`}><member.icon size={22} strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[14px] font-semibold">{member.name} <span className="font-normal text-sub">· {member.title}</span></span>
              <span className="shrink-0 text-[12px] text-sub">Panelist {game.idx + 1} of {PANEL.length}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="w-24 text-[11px] text-sub">To convince</span>
              <ProgressBar value={(game.panelHp / PANELIST_HP) * 100} color="bg-red" className="h-2 flex-1" />
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="w-24 text-[11px] text-sub">Your composure</span>
              <ProgressBar value={(game.hp / PLAYER_HP) * 100} color="bg-brand-2" className="h-2 flex-1" />
            </div>
          </div>
        </div>
        {hit && (
          <div className="fade-up absolute right-4 top-3 rounded-md border border-line bg-white px-2 py-1 text-right text-[12px] font-semibold shadow-sm">
            {hit.dmg > 0 && <div className="text-brand">Convinced +{hit.dmg}</div>}
            {hit.hurt > 0 && <div className="text-red">Composure −{hit.hurt}</div>}
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="tag">{q.type}</span>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-sub hover:bg-bg hover:text-ink" onClick={() => speak(q.question)}><Volume2 size={15} /> Listen</button>
        </div>
        <p className="text-[17px] font-medium leading-relaxed">{q.question}</p>
      </section>

      {!result ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className={`inline-flex items-center gap-1.5 font-semibold ${time <= 10 ? 'text-red' : 'text-sub'}`}><Clock size={14} /> {time}s{time === 0 && ' · time is up, wrap up your answer'}</span>
            <span className="text-sub">{words} words</span>
          </div>
          <textarea className="input !h-auto min-h-36 py-3 leading-relaxed" value={answer} onChange={(e) => setAnswer(e.target.value)} aria-label="Your answer"
            placeholder={canListen ? 'Type your answer, or press Speak and answer out loud like the real defense.' : 'Type your answer the way you would say it to the panel.'} />
          <div className="flex gap-2">
            {canListen && (
              <button className={listening ? 'btn border border-red bg-red-soft text-red' : 'btn-ghost'} onClick={toggleMic}>
                {listening ? <><Square size={14} className="fill-current" /> Stop</> : <><Mic size={16} /> Speak</>}
              </button>
            )}
            <button className="btn-primary flex-1" disabled={grading || !answer.trim()} onClick={submit}>
              {grading ? <><Loader2 size={16} className="animate-spin" /> {member.name} is reviewing</> : 'Submit answer'}
            </button>
          </div>
        </section>
      ) : (
        <section className="fade-up space-y-3">
          {err && <Notice tone="red" icon={Info}>{err}</Notice>}
          {result.ai ? (
            <div className="card space-y-4 p-5">
              <div className="flex items-center gap-4">
                <div className={`text-[30px] font-bold ${scoreTone}`}>{score}<span className="text-[16px] text-sub">/10</span></div>
                <p className="flex gap-2 text-[14px]"><MessageSquareText size={17} className="mt-0.5 shrink-0 text-sub" />{result.verdict}</p>
              </div>
              {result.good?.length > 0 && <FeedbackList title="What worked" items={result.good} icon={Check} tone="text-brand" />}
              {result.missing?.length > 0 && <FeedbackList title="What was missing" items={result.missing} icon={X} tone="text-red" />}
              {result.betterAnswer && (
                <div className="rounded-md border border-brand-2/25 bg-brand-soft p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="eyebrow !text-brand">Stronger answer</span>
                    <button onClick={() => speak(result.betterAnswer)} className="grid h-7 w-7 place-items-center rounded text-brand hover:bg-white" aria-label="Listen to stronger answer"><Volume2 size={15} /></button>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#1f3a2e]">{result.betterAnswer}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-5">
              <p className="mb-1 text-[14px] font-semibold">Grade yourself. Did you mention:</p>
              {points.map((p, i) => <Checkbox key={i} checked={!!checks[i]} onChange={(v) => setChecks({ ...checks, [i]: v })} label={p} />)}
              <p className="mt-2 text-[13px] text-sub">Score: <span className={`font-semibold ${scoreTone}`}>{score} / 10</span></p>
            </div>
          )}

          <div className="card grid grid-cols-2 divide-x divide-line">
            <div className="p-3.5">
              <div className="text-[12px] text-sub">Length</div>
              <div className="text-[14px] font-semibold">{result.words} words {result.words < 25 ? <span className="font-normal text-[#8a6a00]">· a bit short</span> : result.words > 180 ? <span className="font-normal text-[#8a6a00]">· be more concise</span> : <span className="font-normal text-brand">· good length</span>}</div>
            </div>
            <div className="p-3.5">
              <div className="text-[12px] text-sub">Filler words</div>
              <div className={`text-[14px] font-semibold ${result.fillers.total > 3 ? 'text-red' : 'text-brand'}`}>
                {result.fillers.total}
                {result.fillers.total > 0 && <span className="font-normal text-sub"> · {Object.entries(result.fillers.found).map(([k, v]) => `${k} ×${v}`).join(', ')}</span>}
              </div>
            </div>
          </div>
          {result.followUp && !game.followUp && <p className="flex items-center justify-center gap-1.5 text-[12px] text-sub"><Flame size={14} /> {member.name} may ask a follow-up</p>}
          <button className="btn-primary h-11 w-full" onClick={nextQuestion}>Next question</button>
        </section>
      )}
    </div>
  )
}

function FeedbackList({ title, items, icon: Icon, tone }) {
  return (
    <div>
      <div className="eyebrow mb-1">{title}</div>
      <ul className="space-y-1">
        {items.map((x, i) => <li key={i} className="flex gap-2 text-[13px]"><Icon size={15} className={`mt-0.5 shrink-0 ${tone}`} />{x}</li>)}
      </ul>
    </div>
  )
}

const clamp = (n) => Math.max(0, Math.min(10, n))
