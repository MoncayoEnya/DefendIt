import { useEffect, useRef, useState } from 'react'
import { gradeAnswer } from '../lib/ai.js'
import { shuffle } from '../lib/match.js'
import { review } from '../lib/storage.js'
import { canListen, countFillers, startListening } from '../lib/voice.js'
import { speak } from './Guide.jsx'

const BOSSES = [
  { name: 'Dr. Numbers', title: 'The Strict Statistician', avatar: '🧮', color: 'text-sky', style: 'precise and skeptical, focuses on sample size, statistics, validity and whether numbers support claims' },
  { name: 'Prof. Method', title: 'The Methodology Hunter', avatar: '🔍', color: 'text-gold', style: 'calm but relentless, questions research design, instruments, procedures and limitations' },
  { name: 'Dean So-What', title: 'The "Why Does It Matter?" Guy', avatar: '🎓', color: 'text-rose', style: 'big-picture, asks about significance, novelty, real-world impact and future work' },
]
const BOSS_HP = 100
const PLAYER_HP = 100

export default function MockPanel({ state, pack, update, addXP }) {
  const [phase, setPhase] = useState('intro') // intro | battle | won | lost
  const [pressure, setPressure] = useState(false)
  const [game, setGame] = useState(null)
  const hasKey = !!state.settings.apiKey

  function start() {
    const qs = shuffle(pack.questions)
    setGame({ bossIdx: 0, bossHp: BOSS_HP, hp: PLAYER_HP, queue: qs, qIdx: 0, scores: [], followUp: null })
    setPhase('battle')
  }

  function endBattle(won, scores) {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    update((s) => {
      const p = s.packs.find((x) => x.id === pack.id)
      p.panelBest = Math.max(p.panelBest || 0, Math.round(avg * 10) / 10)
      return s
    })
    addXP(Math.round(avg * 8) + (won ? 60 : 10), won ? 'Panel defeated!' : 'Panel practice')
    setGame((g) => ({ ...g, avg }))
    setPhase(won ? 'won' : 'lost')
  }

  if (phase === 'intro' || !game) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Boss battle</p>
          <h1 className="text-2xl font-bold">⚔️ Face the Panel</h1>
          <p className="text-muted">Three panelists, each a boss. Strong answers deal damage. Weak answers cost you HP. Answer by typing or by talking.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {BOSSES.map((b) => (
            <div key={b.name} className="card p-4 text-center">
              <div className="text-4xl">{b.avatar}</div>
              <div className={`mt-1 font-bold ${b.color}`}>{b.name}</div>
              <div className="text-xs text-muted">{b.title}</div>
            </div>
          ))}
        </div>
        <label className="card flex cursor-pointer items-center gap-3 p-4">
          <input type="checkbox" checked={pressure} onChange={(e) => setPressure(e.target.checked)} className="h-5 w-5 accent-[var(--color-rose)]" />
          <div>
            <div className="font-medium">🔥 Pressure mode</div>
            <div className="text-sm text-muted">45 seconds per answer instead of 90, and follow-up questions hit harder.</div>
          </div>
        </label>
        {!hasKey && <p className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-gold">Offline mode: you'll grade yourself with a checklist. Add a free AI key in Settings and the panel will grade you, rewrite your answer better, and ask follow-ups.</p>}
        {pack.panelBest > 0 && <p className="text-center text-sm text-muted">Your best average: <span className="font-mono text-mint">{pack.panelBest}/10</span></p>}
        <button className="btn-primary w-full py-3 text-lg" onClick={start}>Enter the defense room</button>
      </div>
    )
  }

  if (phase === 'won' || phase === 'lost') {
    return (
      <div className="card pop space-y-3 p-8 text-center">
        <div className="text-6xl">{phase === 'won' ? '🏆' : '💀'}</div>
        <h2 className="text-2xl font-bold">{phase === 'won' ? 'You defended successfully!' : 'The panel got you this time'}</h2>
        <p className="text-muted">Average answer score: <span className="font-mono text-mint">{game.avg.toFixed(1)}/10</span> over {game.scores.length} questions</p>
        <p className="text-sm">{phase === 'won' ? 'Run it again in Pressure mode to make the real thing feel easy.' : 'Review the better answers in the Guide, then try again. Every run makes you stronger.'}</p>
        <button className="btn-primary" onClick={() => setPhase('intro')}>Battle again</button>
      </div>
    )
  }

  return <Battle game={game} setGame={setGame} pack={pack} state={state} update={update} pressure={pressure} hasKey={hasKey} onEnd={endBattle} />
}

function Battle({ game, setGame, pack, state, update, pressure, hasKey, onEnd }) {
  const boss = BOSSES[game.bossIdx]
  const q = game.followUp || game.queue[game.qIdx % game.queue.length]
  const limit = pressure ? 45 : 90
  const [answer, setAnswer] = useState('')
  const [time, setTime] = useState(limit)
  const [listening, setListening] = useState(false)
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState(null)
  const [checks, setChecks] = useState({})
  const [err, setErr] = useState('')
  const [hitFx, setHitFx] = useState(null)
  const recRef = useRef(null)
  const voiceUsed = useRef(false)

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
    voiceUsed.current = true
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
        const r = await gradeAnswer(state.settings, pack, q, answer || '(no answer)', { ...boss, style: boss.style + (pressure ? ', and you are under time pressure so be tough' : '') })
        setResult({ ...r, score: clamp(Number(r.score) || 0), fillers, words, ai: true })
      } catch (e) {
        setErr(e.message + ' You can grade yourself below instead.')
        setResult({ score: null, fillers, words, ai: false })
      } finally {
        setGrading(false)
      }
    } else {
      setResult({ score: null, fillers, words, ai: false })
    }
  }

  function finalScore() {
    if (result.score != null) return result.score
    const pts = q.idealPoints?.length || 1
    const got = Object.values(checks).filter(Boolean).length
    return clamp(Math.round((got / pts) * 10 - (result.words < 15 ? 2 : 0)))
  }

  function nextQuestion() {
    const score = finalScore()
    // spaced repetition on panel questions too
    const qKey = `q${pack.questions.indexOf(q)}`
    if (qKey !== 'q-1') update((s) => ({ ...s, mastery: { ...s.mastery, [pack.id]: review(s.mastery[pack.id] || {}, qKey, score >= 7) } }))

    const dmg = score * 10 + (score >= 9 ? 15 : 0)
    const hurt = score < 6 ? (6 - score) * 9 : 0
    setHitFx({ dmg, hurt })
    setTimeout(() => setHitFx(null), 900)

    const scores = [...game.scores, score]
    let { bossIdx, bossHp, hp, qIdx } = game
    bossHp -= dmg
    hp -= hurt
    qIdx = game.followUp ? qIdx : qIdx + 1
    let followUp = null
    if (hp <= 0) return onEnd(false, scores)
    if (bossHp <= 0) {
      bossIdx++
      bossHp = BOSS_HP
      if (bossIdx >= BOSSES.length) return onEnd(true, scores)
    } else if (result.followUp && (pressure || score >= 5) && !game.followUp) {
      followUp = { question: result.followUp, type: 'Follow-up', idealPoints: [] }
    }
    setGame({ ...game, bossIdx, bossHp, hp, qIdx, scores, followUp })
    setAnswer('')
    setResult(null)
    setChecks({})
    setTime(limit)
    voiceUsed.current = false
  }

  const score = result ? finalScore() : null

  return (
    <div className="space-y-4">
      {/* HUD */}
      <div className="card relative p-4">
        <div className="flex items-center gap-3">
          <div className={`text-5xl ${hitFx?.dmg ? 'shake' : ''}`}>{boss.avatar}</div>
          <div className="flex-1">
            <div className="flex justify-between text-sm"><span className={`font-bold ${boss.color}`}>{boss.name}</span><span className="text-xs text-muted">Boss {game.bossIdx + 1}/{BOSSES.length}</span></div>
            <Bar value={game.bossHp / BOSS_HP} color="bg-rose" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="w-12 text-center text-xs text-muted">YOU</div>
          <div className="flex-1"><Bar value={game.hp / PLAYER_HP} color="bg-mint" /></div>
        </div>
        {hitFx && (
          <div className="pop pointer-events-none absolute right-4 top-3 text-right font-mono font-bold">
            {hitFx.dmg > 0 && <div className="text-gold">-{hitFx.dmg} boss HP</div>}
            {hitFx.hurt > 0 && <div className="text-rose">-{hitFx.hurt} your HP</div>}
          </div>
        )}
      </div>

      {/* Question */}
      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="chip">{q.type}</span>
          <button className="text-sm text-muted" onClick={() => speak(q.question)}>🔊 Hear it</button>
        </div>
        <p className="text-lg font-medium leading-relaxed">"{q.question}"</p>
      </div>

      {!result ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className={`font-mono ${time <= 10 ? 'animate-pulse text-rose' : 'text-muted'}`}>⏱ {time}s{time === 0 && ' · time is up, wrap it up!'}</span>
            <span className="text-muted">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>
          <textarea className="input min-h-36 leading-relaxed" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={canListen ? 'Type your answer, or tap 🎤 and say it out loud like the real defense…' : 'Type your answer like you would say it to the panel…'} />
          <div className="flex gap-2">
            {canListen && (
              <button className={`btn ${listening ? 'animate-pulse bg-rose text-ink' : 'btn-ghost'}`} onClick={toggleMic}>{listening ? '■ Stop' : '🎤 Speak'}</button>
            )}
            <button className="btn-primary flex-1" disabled={grading || !answer.trim()} onClick={submit}>{grading ? `${boss.name} is thinking…` : 'Submit answer'}</button>
          </div>
        </div>
      ) : (
        <div className="pop space-y-3">
          {err && <p className="text-sm text-rose">{err}</p>}
          {result.ai ? (
            <div className="card space-y-3 p-5">
              <div className="flex items-center gap-3">
                <div className={`font-mono text-4xl font-bold ${score >= 7 ? 'text-mint' : score >= 5 ? 'text-gold' : 'text-rose'}`}>{score}/10</div>
                <p className="italic">{boss.avatar} "{result.verdict}"</p>
              </div>
              {result.good?.length > 0 && <List title="Good" items={result.good} color="text-mint" mark="✓" />}
              {result.missing?.length > 0 && <List title="Missing" items={result.missing} color="text-rose" mark="✗" />}
              {result.betterAnswer && (
                <div className="rounded-xl bg-panel2 p-3">
                  <div className="mb-1 flex justify-between text-xs font-bold uppercase text-gold"><span>Stronger answer</span><button onClick={() => speak(result.betterAnswer)}>🔊</button></div>
                  <p className="text-sm leading-relaxed">{result.betterAnswer}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card space-y-2 p-5">
              <p className="font-bold">Grade yourself: did you mention…</p>
              {(q.idealPoints?.length ? q.idealPoints : ['A clear, direct answer', 'Evidence or numbers from your study', 'A short closing sentence']).map((p, i) => (
                <label key={i} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-panel2">
                  <input type="checkbox" className="h-5 w-5 accent-[var(--color-mint)]" checked={!!checks[i]} onChange={(e) => setChecks({ ...checks, [i]: e.target.checked })} />
                  <span>{p}</span>
                </label>
              ))}
              <p className="pt-1 font-mono text-sm text-muted">Score: <span className="text-mint">{score}/10</span></p>
            </div>
          )}
          <div className="card flex flex-wrap gap-x-6 gap-y-1 p-4 text-sm">
            <span>📝 {result.words} words {result.words < 25 && <span className="text-gold">(a bit short)</span>}{result.words > 180 && <span className="text-gold">(too long, be concise)</span>}</span>
            <span>🗣 Filler words: <span className={result.fillers.total > 3 ? 'text-rose' : 'text-mint'}>{result.fillers.total}</span>
              {result.fillers.total > 0 && <span className="text-muted"> ({Object.entries(result.fillers.found).map(([k, v]) => `${k}×${v}`).join(', ')})</span>}
            </span>
          </div>
          {result.followUp && !game.followUp && <p className="text-center text-sm text-muted">{boss.avatar} might have a follow-up…</p>}
          <button className="btn-primary w-full py-3" onClick={nextQuestion}>Attack! →</button>
        </div>
      )}
    </div>
  )
}

function Bar({ value, color }) {
  return (
    <div className="mt-1 h-3 overflow-hidden rounded-full bg-panel2">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, value) * 100}%` }} />
    </div>
  )
}

function List({ title, items, color, mark }) {
  return (
    <div>
      <div className={`text-xs font-bold uppercase ${color}`}>{title}</div>
      {items.map((x, i) => <p key={i} className="text-sm"><span className={color}>{mark}</span> {x}</p>)}
    </div>
  )
}

const clamp = (n) => Math.max(0, Math.min(10, n))
