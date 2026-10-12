import { useEffect, useRef, useState } from 'react'
import { Heart, Play, RotateCcw, Target, Trophy } from 'lucide-react'
import { BackLink, PageHeader } from '../components/ui.jsx'
import { maskTerm, norm, shuffle } from '../lib/match.js'

const LIVES = 3

export default function TypingDefense({ state, pack, update, addXP, go, track }) {
  const best = state.profile.best?.[`typing:${pack.id}`] || 0
  const [phase, setPhase] = useState('menu') // menu | play | over
  const [final, setFinal] = useState(null)
  const [prevBest, setPrevBest] = useState(best)

  function finish(result) {
    setPrevBest(best)
    setFinal(result)
    setPhase('over')
    addXP(Math.min(Math.round(result.score / 25), 120), 'Typing defense')
    track('typing')
    update((s) => {
      const p = s.packs.find((x) => x.id === pack.id)
      p.typingSessions = (p.typingSessions || 0) + 1
      if (result.score > (s.profile.best?.[`typing:${pack.id}`] || 0)) s.profile.best = { ...s.profile.best, [`typing:${pack.id}`]: result.score }
      return s
    })
  }

  if (phase === 'play') {
    return (
      <div className="max-w-3xl">
        <Game pack={pack} onEnd={finish} />
      </div>
    )
  }

  const newBest = final && final.score > prevBest

  return (
    <div className="max-w-3xl">
      <BackLink onClick={() => go('practice')}>Practice</BackLink>
      <PageHeader eyebrow="Typing defense" title="Defend your base" desc="Key terms from your thesis fall toward your base. Type each one before it lands. Every third wave shows only a definition, so you must recall the term." />

      {phase === 'over' && final && (
        <section className="card fade-up mb-4 p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">{newBest ? <Trophy size={22} strokeWidth={1.75} /> : <Target size={22} strokeWidth={1.75} />}</span>
            <div>
              <h2 className="text-[20px] font-bold">Score {final.score}{newBest && <span className="ml-2 align-middle tag !border-brand-2/30 !bg-brand-soft !text-brand">New best</span>}</h2>
              <p className="text-[13px] text-sub">Reached wave {final.wave} · {final.destroyed} terms cleared · longest streak {final.maxCombo}</p>
            </div>
          </div>
          {final.missed.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-[13px] font-semibold">Review these terms</p>
              <dl className="space-y-2">
                {final.missed.map((t, i) => (
                  <div key={i}><dt className="text-[13px] font-semibold">{t.term}</dt><dd className="text-[12px] text-sub">{t.definition}</dd></div>
                ))}
              </dl>
            </div>
          )}
        </section>
      )}

      <section className="card flex items-center justify-between gap-4 p-5">
        <div className="flex gap-8">
          <div><div className="text-[12px] text-sub">Best score</div><div className="text-[22px] font-bold">{Math.max(best, final?.score || 0)}</div></div>
          <div><div className="text-[12px] text-sub">Sessions</div><div className="text-[22px] font-bold">{pack.typingSessions || 0}</div></div>
        </div>
        <button className="btn-primary h-11 px-6" onClick={() => setPhase('play')}>
          {phase === 'over' ? <><RotateCcw size={16} /> Play again</> : <><Play size={16} /> Start</>}
        </button>
      </section>
      <p className="mt-3 text-center text-[12px] text-sub">On a phone, turn off keyboard autocorrect for best results.</p>
    </div>
  )
}

function Game({ pack, onEnd }) {
  const [, force] = useState(0)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef()
  const g = useRef(null)
  const endRef = useRef(onEnd)
  endRef.current = onEnd

  if (!g.current) {
    g.current = {
      enemies: [], booms: [], wave: 1, toSpawn: 6, spawnTimer: 0, lives: LIVES, score: 0,
      combo: 0, maxCombo: 0, destroyed: 0, missed: [], intel: null, bag: [], nextId: 1, over: false,
    }
  }

  useEffect(() => {
    const st = g.current
    let last = performance.now()
    let raf
    const pick = () => {
      if (!st.bag.length) st.bag = shuffle(pack.terms)
      return st.bag.pop()
    }
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const boss = st.wave % 3 === 0
      const speed = 0.06 + st.wave * 0.012
      // spawn
      st.spawnTimer -= dt
      if (st.toSpawn > 0 && st.spawnTimer <= 0) {
        const t = pick()
        st.enemies.push({
          id: st.nextId++, term: t, text: t.term, boss,
          clue: boss ? maskTerm(t.definition, t.term) : null,
          x: boss ? 50 : 12 + Math.random() * 76, y: 0,
          speed: boss ? speed * 0.45 : speed * (0.8 + Math.random() * 0.4),
        })
        st.toSpawn--
        st.spawnTimer = boss ? 99 : Math.max(0.7, 2.4 - st.wave * 0.18)
      }
      // move
      for (const e of st.enemies) e.y += e.speed * dt
      const hit = st.enemies.filter((e) => e.y >= 1)
      if (hit.length) {
        st.enemies = st.enemies.filter((e) => e.y < 1)
        st.lives -= hit.length
        st.combo = 0
        hit.forEach((e) => { if (!st.missed.includes(e.term)) st.missed.push(e.term) })
        st.intel = { text: `Missed: ${hit[0].term.term}: ${hit[0].term.definition}`, bad: true, t: 4 }
      }
      st.booms = st.booms.filter((b) => (b.t -= dt) > 0)
      if (st.intel && (st.intel.t -= dt) <= 0) st.intel = null
      // next wave
      if (st.toSpawn === 0 && st.enemies.length === 0) {
        st.wave++
        st.toSpawn = st.wave % 3 === 0 ? 1 : 5 + st.wave * 2
        st.spawnTimer = 1.5
        st.intel = { text: st.wave % 3 === 0 ? `Definition wave ${st.wave}: read the definition and type the term.` : `Wave ${st.wave}`, t: 2.5 }
      }
      if (st.lives <= 0 && !st.over) {
        st.over = true
        endRef.current({ score: st.score, wave: st.wave, destroyed: st.destroyed, maxCombo: st.maxCombo, missed: st.missed.slice(0, 6) })
        return
      }
      force((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    inputRef.current?.focus()
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack.id])

  function onType(v) {
    const st = g.current
    const n = norm(v)
    setTyped(v)
    if (!n) return
    const candidates = st.enemies.filter((e) => norm(e.text).startsWith(n)).sort((a, b) => b.y - a.y)
    if (!candidates.length) {
      setError(true)
      setTimeout(() => setError(false), 300)
      st.combo = 0
      return
    }
    const done = candidates.find((e) => norm(e.text) === n)
    if (done) {
      st.enemies = st.enemies.filter((e) => e !== done)
      st.combo++
      st.maxCombo = Math.max(st.maxCombo, st.combo)
      st.destroyed++
      const pts = Math.round(done.text.length * 10 * (1 + st.combo * 0.1) * (done.boss ? 4 : 1))
      st.score += pts
      st.booms.push({ x: done.x, y: done.y, pts, t: 0.6, id: done.id })
      st.intel = { text: `${done.term.term}: ${done.term.definition}`, t: 3.5 }
      setTyped('')
    }
  }

  const st = g.current
  const n = norm(typed)
  const target = n ? st.enemies.filter((e) => norm(e.text).startsWith(n)).sort((a, b) => b.y - a.y)[0] : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[13px] font-semibold">
        <span className="flex gap-1" aria-label={`${Math.max(st.lives, 0)} lives left`}>
          {Array.from({ length: LIVES }, (_, i) => <Heart key={i} size={17} className={i < st.lives ? 'fill-red text-red' : 'text-track'} aria-hidden />)}
        </span>
        <span className="text-sub">Wave {st.wave}</span>
        <span>{st.combo >= 2 && <span className="mr-3 text-[#8a6a00]">Streak {st.combo}</span>}<span className="text-brand">{st.score}</span></span>
      </div>

      <div className="card relative h-[50vh] min-h-[300px] overflow-hidden" onClick={() => inputRef.current?.focus()}
        style={{ backgroundImage: 'linear-gradient(#eef2f4 1px, transparent 1px), linear-gradient(90deg, #eef2f4 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
        {st.enemies.map((e) => {
          const isT = target === e
          const k = isT ? matchLen(e.text, typed) : 0
          return (
            <div key={e.id} className="absolute -translate-x-1/2 text-center" style={{ left: `${e.x}%`, top: `${e.y * 88}%` }}>
              {e.boss ? (
                <div className={`w-64 max-w-[78vw] rounded-md border bg-white p-3 text-left shadow-sm ${isT ? 'border-brand' : 'border-red/50'}`}>
                  <div className="eyebrow !text-red">Definition</div>
                  <div className="mt-0.5 text-[13px] leading-snug">{e.clue}</div>
                  {isT && <div className="mt-1 font-mono text-[13px] font-semibold text-brand">{e.text.slice(0, k)}</div>}
                </div>
              ) : (
                <div className={`whitespace-nowrap rounded-md border px-2 py-1 font-mono text-[13px] shadow-sm ${isT ? 'border-brand bg-white' : 'border-line bg-white'}`}>
                  <span className="font-semibold text-brand">{e.text.slice(0, k)}</span>{e.text.slice(k)}
                </div>
              )}
            </div>
          )
        })}
        {st.booms.map((b) => (
          <div key={b.id} className="pointer-events-none absolute font-mono text-[13px] font-bold text-brand" style={{ left: `${b.x}%`, top: `${b.y * 88}%`, opacity: b.t / 0.6, transform: `translate(-50%, ${-(0.6 - b.t) * 60}px)` }}>
            +{b.pts}
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-brand/80" />
      </div>

      <div className={`h-11 overflow-hidden text-[13px] leading-snug ${st.intel?.bad ? 'text-red' : 'text-sub'}`} aria-live="polite">{st.intel?.text}</div>

      <input
        ref={inputRef}
        value={typed}
        onChange={(e) => onType(e.target.value)}
        className={`input !h-12 font-mono !text-[16px] ${error ? 'shake !border-red' : ''}`}
        placeholder="Type a falling term"
        aria-label="Type a falling term"
        autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck="false"
      />
    </div>
  )
}

// how many characters of `text` are already typed (ignores case/punctuation differences)
function matchLen(text, typed) {
  const n = norm(typed)
  let count = 0
  for (let i = 1; i <= text.length; i++) {
    const pre = norm(text.slice(0, i))
    if (pre.length <= n.length && n.startsWith(pre)) count = i
    else break
  }
  return count
}
