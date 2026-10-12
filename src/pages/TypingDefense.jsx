import { useEffect, useRef, useState } from 'react'
import { maskTerm, norm, shuffle } from '../lib/match.js'

const LIVES = 3

export default function TypingDefense({ state, pack, update, addXP }) {
  const best = state.profile.best?.[`typing:${pack.id}`] || 0
  const [phase, setPhase] = useState('menu') // menu | play | over
  const [final, setFinal] = useState(null)

  function finish(result) {
    setFinal(result)
    setPhase('over')
    addXP(Math.min(Math.round(result.score / 25), 120), 'Typing Defense')
    if (result.score > best) {
      update((s) => ({ ...s, profile: { ...s.profile, best: { ...s.profile.best, [`typing:${pack.id}`]: result.score } } }))
    }
  }

  if (phase === 'play') return <Game pack={pack} onEnd={finish} />

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Game</p>
        <h1 className="text-2xl font-bold">⌨️ Typing Defense</h1>
        <p className="text-muted">Terms from your thesis are falling on your defense. Type them before they hit the base. Every 3rd wave a <span className="text-rose">boss</span> shows only a definition: you must type the term.</p>
      </div>
      {phase === 'over' && final && (
        <div className="card pop p-6 text-center">
          <div className="text-5xl">{final.score > best ? '🏆' : '💥'}</div>
          <h2 className="mt-2 text-2xl font-bold">Score {final.score}</h2>
          <p className="text-muted">Wave {final.wave} · {final.destroyed} destroyed · best combo x{final.maxCombo}{final.score > best ? ' · NEW BEST!' : ''}</p>
          {final.missed.length > 0 && (
            <div className="mt-4 text-left">
              <p className="mb-1 text-sm font-bold text-rose">Review these:</p>
              {final.missed.map((t, i) => (
                <p key={i} className="text-sm"><span className="font-bold text-sky">{t.term}</span> <span className="text-muted">— {t.definition}</span></p>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="card flex items-center justify-between p-4">
        <div>
          <div className="text-xs text-muted">Best score</div>
          <div className="font-mono text-2xl font-bold text-gold">{best}</div>
        </div>
        <button className="btn-primary px-8 text-lg" onClick={() => setPhase('play')}>{phase === 'over' ? 'Play again' : '▶ Start'}</button>
      </div>
      <p className="text-center text-xs text-muted">Tip: on phone, turn your keyboard autocorrect off for this game.</p>
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
        st.intel = { text: `Missed: ${hit[0].term.term} — ${hit[0].term.definition}`, bad: true, t: 4 }
      }
      st.booms = st.booms.filter((b) => (b.t -= dt) > 0)
      if (st.intel && (st.intel.t -= dt) <= 0) st.intel = null
      // next wave
      if (st.toSpawn === 0 && st.enemies.length === 0) {
        st.wave++
        st.toSpawn = st.wave % 3 === 0 ? 1 : 5 + st.wave * 2
        st.spawnTimer = 1.5
        st.intel = { text: st.wave % 3 === 0 ? `⚠ BOSS WAVE ${st.wave}: read the definition, type the term!` : `Wave ${st.wave}`, t: 2.5 }
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
  }, [pack])

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
      <div className="flex items-center justify-between font-mono text-sm">
        <span className="text-rose">{'♥'.repeat(Math.max(st.lives, 0))}<span className="text-line">{'♥'.repeat(LIVES - Math.max(st.lives, 0))}</span></span>
        <span className="text-muted">WAVE {st.wave}</span>
        <span>{st.combo >= 2 && <span className="mr-2 text-gold">x{st.combo}</span>}<span className="text-mint">{st.score}</span></span>
      </div>

      <div className="card relative h-[52vh] min-h-[300px] overflow-hidden !rounded-2xl" onClick={() => inputRef.current?.focus()}
        style={{ backgroundImage: 'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)', backgroundSize: '32px 32px', backgroundPosition: 'center' }}>
        {st.enemies.map((e) => {
          const isT = target === e
          const k = isT ? matchLen(e.text, typed) : 0
          return (
            <div key={e.id} className="absolute -translate-x-1/2 text-center" style={{ left: `${e.x}%`, top: `${e.y * 88}%` }}>
              {e.boss ? (
                <div className={`w-64 max-w-[80vw] rounded-xl border-2 bg-ink/95 p-3 ${isT ? 'border-gold' : 'border-rose'}`}>
                  <div className="text-xs font-bold text-rose">👾 BOSS</div>
                  <div className="text-sm">{e.clue}</div>
                  {isT && <div className="mt-1 font-mono text-gold">{e.text.slice(0, k)}<span className="text-muted">…</span></div>}
                </div>
              ) : (
                <div className={`whitespace-nowrap rounded-lg border px-2 py-1 font-mono text-sm shadow ${isT ? 'border-gold bg-ink' : 'border-line bg-panel2'}`}>
                  <span className="text-gold">{e.text.slice(0, k)}</span>{e.text.slice(k)}
                </div>
              )}
            </div>
          )
        })}
        {st.booms.map((b) => (
          <div key={b.id} className="pointer-events-none absolute -translate-x-1/2 font-mono font-bold text-mint" style={{ left: `${b.x}%`, top: `${b.y * 88}%`, opacity: b.t / 0.6, transform: `translate(-50%, ${-(0.6 - b.t) * 60}px)` }}>
            💥 +{b.pts}
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-mint/0 via-mint to-mint/0 opacity-70" />
      </div>

      <div className={`h-12 overflow-hidden text-sm ${st.intel?.bad ? 'text-rose' : 'text-[#cfd4f5]'}`}>{st.intel?.text}</div>

      <input
        ref={inputRef}
        value={typed}
        onChange={(e) => onType(e.target.value)}
        className={`input font-mono text-lg ${error ? 'shake !border-rose' : ''}`}
        placeholder="type here…"
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
