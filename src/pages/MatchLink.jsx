import { useRef, useState } from 'react'
import { BookOpen, Check, Clock, Link2, RotateCcw, Trophy, X } from 'lucide-react'
import { BackLink, IconBox, PageHeader } from '../components/ui.jsx'
import { chapterIndex } from '../lib/chapters.js'
import { shuffle } from '../lib/match.js'
import { review } from '../lib/storage.js'

export default function MatchLink({ state, pack, update, addXP, go, track }) {
  const [mode, setMode] = useState(null) // 'chapter' | 'definition'
  const [round, setRound] = useState(0)
  const best = state.profile.stats?.matchBest?.[pack.id]

  if (!mode) {
    return (
      <div className="max-w-3xl">
        <BackLink onClick={() => go('practice')}>Practice</BackLink>
        <PageHeader eyebrow="Match & Link" title="Connect the ideas" desc="Drag each term to where it belongs. On a phone you can also tap a term, then tap its target." />
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => setMode('chapter')} className="card-link p-5 text-left">
            <IconBox icon={BookOpen} />
            <div className="mt-3 text-[15px] font-semibold">Term to chapter</div>
            <div className="mt-0.5 text-[13px] text-sub">Place each key term in the chapter where it matters. Great for knowing your paper's structure.</div>
          </button>
          <button onClick={() => setMode('definition')} className="card-link p-5 text-left">
            <IconBox icon={Link2} tone="blue" />
            <div className="mt-3 text-[15px] font-semibold">Term to definition</div>
            <div className="mt-0.5 text-[13px] text-sub">Link each term to its meaning. Perfect for a quick review before practice.</div>
          </button>
        </div>
        {best != null && <p className="mt-3 text-[13px] text-sub">Best accuracy so far: <span className="font-semibold text-ink">{best}%</span></p>}
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <Board
        key={`${mode}${round}`}
        mode={mode}
        pack={pack}
        onExit={() => setMode(null)}
        onAgain={() => setRound(round + 1)}
        onFinish={(results, secs) => {
          const correct = results.filter((r) => r.ok).length
          const pct = Math.round((correct / results.length) * 100)
          addXP(correct * 5 + (pct === 100 ? 20 : 0), `${correct}/${results.length} matched`)
          track('match')
          update((s) => {
            let m = s.mastery[pack.id] || {}
            for (const r of results) m = review(m, `t${r.termIndex}`, r.ok)
            s.mastery[pack.id] = m
            const st = { ...(s.profile.stats || {}) }
            st.matchBest = { ...(st.matchBest || {}), [pack.id]: Math.max(st.matchBest?.[pack.id] || 0, pct) }
            if (pct === 100) st.matchPerfect = (st.matchPerfect || 0) + 1
            st.matchFastest = pct === 100 ? Math.min(st.matchFastest || Infinity, secs) : st.matchFastest
            s.profile.stats = st
            return s
          })
        }}
      />
    </div>
  )
}

function buildRound(mode, pack) {
  const idx = chapterIndex(pack)
  const all = pack.terms.map((t, i) => ({ ...t, termIndex: i, chapter: idx.terms[i] }))
  if (mode === 'definition') {
    const picked = shuffle(all).slice(0, 5)
    return {
      items: picked.map((t) => ({ id: `i${t.termIndex}`, label: t.term, termIndex: t.termIndex, answer: `d${t.termIndex}` })),
      targets: shuffle(picked).map((t) => ({ id: `d${t.termIndex}`, label: t.definition })),
    }
  }
  // choose up to 4 chapters that have terms, then up to 7 terms spread across them
  const byChapter = new Map()
  for (const t of shuffle(all)) {
    if (!byChapter.has(t.chapter)) byChapter.set(t.chapter, [])
    byChapter.get(t.chapter).push(t)
  }
  const chapters = [...byChapter.keys()].sort((a, b) => byChapter.get(b).length - byChapter.get(a).length).slice(0, 4).sort((a, b) => a - b)
  const picked = []
  for (let round = 0; picked.length < 7 && round < 4; round++) {
    for (const c of chapters) {
      const t = byChapter.get(c)[round]
      if (t && picked.length < 7) picked.push(t)
    }
  }
  return {
    items: shuffle(picked).map((t) => ({ id: `i${t.termIndex}`, label: t.term, termIndex: t.termIndex, answer: `c${t.chapter}` })),
    targets: chapters.map((c) => ({ id: `c${c}`, label: pack.sections[c].title, multi: true })),
  }
}

function Board({ mode, pack, onExit, onAgain, onFinish }) {
  // built once per round; later saves create a new pack object, which must not reshuffle the board
  const [{ items, targets }] = useState(() => buildRound(mode, pack))
  const [placed, setPlaced] = useState({}) // itemId -> targetId
  const [selected, setSelected] = useState(null)
  const [drag, setDrag] = useState(null) // { id, x, y }
  const [checked, setChecked] = useState(null)
  const startRef = useRef(Date.now())
  const pressRef = useRef(null)

  const pool = items.filter((i) => !placed[i.id])
  const inTarget = (tid) => items.filter((i) => placed[i.id] === tid)
  const allPlaced = pool.length === 0

  function place(itemId, targetId) {
    if (checked) return
    const t = targets.find((x) => x.id === targetId)
    setPlaced((p) => {
      const next = { ...p }
      // one-to-one targets (definitions) hold only one term
      if (t && !t.multi) for (const k of Object.keys(next)) if (next[k] === targetId) delete next[k]
      if (targetId) next[itemId] = targetId
      else delete next[itemId]
      return next
    })
    setSelected(null)
  }

  // pointer drag that also works with touch; a short press counts as a tap
  function onPointerDown(e, id) {
    if (checked) return
    pressRef.current = { id, x: e.clientX, y: e.clientY, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e) {
    const p = pressRef.current
    if (!p) return
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) p.moved = true
    if (p.moved) setDrag({ id: p.id, x: e.clientX, y: e.clientY })
  }
  function onPointerUp(e) {
    const p = pressRef.current
    pressRef.current = null
    if (!p) return
    if (p.moved) {
      setDrag(null)
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const target = el?.closest('[data-target]')?.dataset.target
      if (target === 'pool') place(p.id, null)
      else if (target) place(p.id, target)
    } else if (selected && selected !== p.id && placed[p.id]) {
      // tapping a term that is already in a box places the selected term in that same box
      place(selected, placed[p.id])
    } else {
      setSelected((s) => (s === p.id ? null : p.id))
    }
  }

  function tapTarget(tid) {
    if (selected) place(selected, tid)
  }

  function check() {
    const results = items.map((i) => ({ termIndex: i.termIndex, ok: placed[i.id] === i.answer }))
    const secs = Math.round((Date.now() - startRef.current) / 1000)
    setChecked({ results, secs })
    onFinish(results, secs)
  }

  const okMap = checked ? Object.fromEntries(items.map((i) => [i.id, placed[i.id] === i.answer])) : {}

  const renderChip = (item) => {
    const state = checked ? (okMap[item.id] ? 'ok' : 'bad') : selected === item.id ? 'sel' : 'idle'
    const cls = {
      idle: 'border-line bg-card hover:border-brand-2/50',
      sel: 'border-brand bg-brand-soft ring-2 ring-brand-soft',
      ok: 'border-brand-2/50 bg-brand-soft text-brand',
      bad: 'border-red/50 bg-red-soft text-red-ink',
    }[state]
    return (
      <button
        key={item.id}
        type="button"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => onPointerDown(e, item.id)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pressRef.current = null; setDrag(null) }}
        className={`inline-flex min-h-9 touch-none select-none items-center gap-1.5 rounded-md border px-3 py-1.5 text-left text-[13px] font-medium transition-colors ${cls} ${drag?.id === item.id ? 'opacity-30' : ''}`}
        aria-pressed={selected === item.id}
      >
        {checked && (okMap[item.id] ? <Check size={14} /> : <X size={14} />)}
        {item.label}
      </button>
    )
  }

  const correct = checked?.results.filter((r) => r.ok).length ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button className="text-[13px] font-medium text-sub hover:text-ink" onClick={onExit}>Exit</button>
        <span className="text-[13px] text-sub">{mode === 'chapter' ? 'Term to chapter' : 'Term to definition'} · {items.length - pool.length} of {items.length} placed</span>
      </div>

      {checked && (
        <section className="card fade-up flex flex-wrap items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand"><Trophy size={21} strokeWidth={1.75} /></span>
          <div className="flex-1">
            <div className="text-[18px] font-bold">{correct} of {items.length} correct</div>
            <div className="flex items-center gap-1.5 text-[13px] text-sub"><Clock size={14} /> {checked.secs}s{correct === items.length && ' · perfect round'}</div>
          </div>
          <button className="btn-primary" onClick={onAgain}><RotateCcw size={15} /> New round</button>
        </section>
      )}

      <section data-target="pool" onClick={() => selected && placed[selected] && place(selected, null)} className="card min-h-[72px] p-4">
        <div className="eyebrow mb-2">{pool.length ? 'Terms' : checked ? 'Review' : 'All terms placed'}</div>
        <div className="flex flex-wrap gap-2">
          {pool.map(renderChip)}
          {!pool.length && !checked && <p className="text-[13px] text-sub">Tap a placed term to move it again, or check your answers.</p>}
        </div>
      </section>

      <div className={`grid gap-3 ${mode === 'chapter' ? 'sm:grid-cols-2' : ''}`}>
        {targets.map((t) => {
          const here = inTarget(t.id)
          return (
            <div
              key={t.id}
              data-target={t.id}
              onClick={() => tapTarget(t.id)}
              className={`card min-h-[88px] p-4 transition-colors ${selected ? 'cursor-pointer border-dashed !border-brand-2/60 hover:bg-brand-soft/40' : ''}`}
            >
              <div className={`mb-2 ${mode === 'chapter' ? 'text-[14px] font-semibold' : 'text-[13px] leading-snug text-ink-2'}`}>{t.label}</div>
              <div className="flex flex-wrap gap-2">
                {here.map(renderChip)}
                {!here.length && <span className="text-[12px] text-sub">Drop a term here</span>}
              </div>
              {checked && mode === 'definition' && !here.some((i) => okMap[i.id]) && (
                <div className="mt-2 text-[12px] text-brand">Answer: {items.find((i) => i.answer === t.id)?.label}</div>
              )}
            </div>
          )
        })}
      </div>

      {!checked && (
        <button className="btn-primary h-11 w-full" disabled={!allPlaced} onClick={check}>
          {allPlaced ? 'Check answers' : `Place ${pool.length} more term${pool.length === 1 ? '' : 's'}`}
        </button>
      )}

      {drag && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-md border border-brand bg-card px-3 py-1.5 text-[13px] font-medium shadow-lg"
          style={{ left: drag.x, top: drag.y }}>
          {items.find((i) => i.id === drag.id)?.label}
        </div>
      )}
    </div>
  )
}
