import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Baby, BookOpenText, ChevronDown, FileUp, Lightbulb, Loader2, Sparkles, Volume2, WandSparkles } from 'lucide-react'
import { BackLink, Notice, centerOnTap } from '../components/ui.jsx'
import { explainParagraphs, explainWhole, hasAI } from '../lib/ai.js'
import { extractText } from '../lib/extract.js'
import { demoText, offlineMeaning, toReader } from '../lib/reader.js'
import { loadNotes, loadText, saveNotes, saveText } from '../lib/textstore.js'
import { speak } from '../lib/voice.js'

const BATCH = 6 // paragraphs explained per AI request

// short key for a paragraph, so saved explanations still match after small changes in splitting
const keyOf = (t) => { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return `k${h}` }

export default function Read({ state, pack, go, addXP, track }) {
  const ai = hasAI(state)
  const [text, setText] = useState(undefined) // undefined = loading, null = not on this device
  const [notes, setNotes] = useState({ paras: {} })
  const [chapter, setChapter] = useState(0)
  const [level, setLevel] = useState('simple') // simple | kid
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const notesRef = useRef(notes)
  notesRef.current = notes

  useEffect(() => {
    let live = true
    setText(undefined)
    Promise.all([pack.sample || pack.id === 'demo' ? demoText(pack) : loadText(pack.id), loadNotes(pack.id)]).then(([t, n]) => {
      if (!live) return
      setText(t || null)
      setNotes(n || { paras: {} })
    })
    return () => { live = false }
  }, [pack])

  const chapters = useMemo(() => (text ? toReader(text) : []), [text])
  const ch = chapters[Math.min(chapter, chapters.length - 1)]
  const paras = ch ? ch.blocks.filter((b) => b.type === 'p') : []
  const explained = paras.filter((p) => notes.paras[keyOf(p.text)]).length

  function store(next) {
    setNotes(next)
    saveNotes(pack.id, next)
  }

  async function explain(list) {
    const todo = list.filter((p) => !notesRef.current.paras[keyOf(p.text)])
    if (!todo.length) return
    setErr('')
    if (!ai) {
      const add = Object.fromEntries(todo.map((p) => [keyOf(p.text), { ...offlineMeaning(p.text, pack.terms), offline: true }]))
      store({ ...notesRef.current, paras: { ...notesRef.current.paras, ...add } })
      return
    }
    try {
      for (let i = 0; i < todo.length; i += BATCH) {
        const part = todo.slice(i, i + BATCH)
        setBusy(todo.length > BATCH ? `Explaining ${Math.min(i + BATCH, todo.length)} of ${todo.length}` : 'Explaining')
        const items = await explainParagraphs(state.settings, pack, part.map((p) => p.text))
        const add = {}
        part.forEach((p, k) => {
          const it = items.find((x) => x.i === k) || items[k]
          if (it?.meaning) add[keyOf(p.text)] = { meaning: it.meaning, kid: it.kid }
        })
        store({ ...notesRef.current, paras: { ...notesRef.current.paras, ...add } })
      }
      track?.('read')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy('')
    }
  }

  // tapping one paragraph also explains the next few, so reading on is instant
  function explainFrom(p) {
    const i = paras.indexOf(p)
    explain(paras.slice(i, i + BATCH))
  }

  async function explainAll() {
    if (!ai) return
    setErr('')
    setBusy('whole')
    try {
      const whole = await explainWhole(state.settings, pack)
      store({ ...notesRef.current, whole })
      addXP?.(10, 'Explained like I am 10')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy('')
    }
  }

  if (text === undefined) return <div className="flex items-center gap-2 py-10 text-[14px] text-sub"><Loader2 size={18} className="animate-spin" /> Opening your thesis</div>

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink onClick={() => go('guide')}>Study guide</BackLink>
      <header className="mb-4">
        <p className="eyebrow mb-1 flex items-center gap-1.5"><BookOpenText size={14} aria-hidden /> Read my thesis</p>
        <h1 className="text-[22px] font-bold leading-tight md:text-[26px]">{pack.title}</h1>
      </header>

      <KidCard notes={notes} ai={ai} busy={busy === 'whole'} onExplain={explainAll} />

      {err && <div className="mb-4"><Notice tone="red" icon={AlertCircle}>{err}</Notice></div>}

      {text === null ? (
        <AttachFile pack={pack} onText={(t) => setText(t)} />
      ) : !chapters.length ? (
        <Notice tone="yellow" icon={AlertCircle}>We could not find paragraphs in this file. Scanned pages with unclear text are hard to split.</Notice>
      ) : (
        <>
          <div className="swipe-row -mx-4 mb-3 px-4 md:mx-0 md:px-0" onClickCapture={centerOnTap}>
            <div className="flex gap-2">
              {chapters.map((c, i) => (
                <button key={i} onClick={() => { setChapter(i); window.scrollTo({ top: 0 }) }}
                  className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium ${i === chapter ? 'border-brand bg-brand text-white' : 'border-line bg-card text-sub hover:text-ink'}`}>
                  {c.title.length > 34 ? `${c.title.slice(0, 32)}...` : c.title}
                </button>
              ))}
            </div>
          </div>

          <div className="sticky top-14 z-20 -mx-4 mb-3 flex items-center gap-2 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur md:top-16 md:mx-0 md:rounded-md md:border md:px-3">
            <div className="flex rounded-md border border-line bg-card p-0.5" role="radiogroup" aria-label="Explain as">
              {[['simple', 'Simple words', Lightbulb], ['kid', "Like I'm 10", Baby]].map(([id, label, Icon]) => (
                <button key={id} role="radio" aria-checked={level === id} onClick={() => setLevel(id)} disabled={id === 'kid' && !ai}
                  className={`flex h-8 items-center gap-1.5 rounded px-2.5 text-[12px] font-semibold disabled:opacity-40 ${level === id ? 'bg-brand-soft text-brand' : 'text-sub'}`}>
                  <Icon size={14} aria-hidden />{label}
                </button>
              ))}
            </div>
            <span className="hidden text-[12px] text-sub sm:inline">{explained}/{paras.length} explained</span>
            <button className="btn-primary ml-auto !h-8 !px-3 !text-[12px]" disabled={!!busy || explained === paras.length} onClick={() => explain(paras)}>
              {busy && busy !== 'whole' ? <><Loader2 size={14} className="animate-spin" /> {busy}</> : <><WandSparkles size={14} /> <span className="sm:hidden">Explain all</span><span className="hidden sm:inline">Explain this chapter</span></>}
            </button>
          </div>

          <div className="space-y-3">
            {ch.blocks.map((b, i) => (b.type === 'h'
              ? <h2 key={i} className="pt-2 text-[15px] font-semibold text-ink">{b.text}</h2>
              : <Paragraph key={b.id} p={b} note={notes.paras[keyOf(b.text)]} level={level} ai={ai} busy={!!busy} onExplain={() => explainFrom(b)} />))}
          </div>

          {chapter < chapters.length - 1 && (
            <button className="btn-ghost mt-5 w-full" onClick={() => { setChapter(chapter + 1); window.scrollTo({ top: 0 }) }}>
              Next: {chapters[chapter + 1].title}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function KidCard({ notes, ai, busy, onExplain }) {
  const w = notes.whole
  const [open, setOpen] = useState(true)
  if (!w) {
    return (
      <section className="card mb-4 flex items-center gap-3 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-yellow-soft text-yellow-ink"><Baby size={22} strokeWidth={1.75} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold">Explain it like I'm 10</h2>
          <p className="text-[13px] text-sub">{ai ? 'Your whole study as a simple story.' : 'Needs AI. Turn it on in Settings.'}</p>
        </div>
        <button className="btn-primary shrink-0" disabled={!ai || busy} onClick={onExplain}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} <span className="hidden sm:inline">Explain</span>
        </button>
      </section>
    )
  }
  const story = Array.isArray(w.story) ? w.story : []
  return (
    <section className="card mb-4 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-yellow-soft text-yellow-ink"><Baby size={20} strokeWidth={1.75} /></span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Like I'm 10</p>
          <h2 className="text-[17px] font-semibold leading-snug">{w.oneLine}</h2>
        </div>
        <button className="btn-ghost !h-8 !px-2.5" aria-label="Listen" onClick={() => speak([w.oneLine, ...story, w.example].filter(Boolean).join(' '))}><Volume2 size={16} /></button>
      </div>
      {open && (
        <div className="mt-3 space-y-3">
          {story.map((s, i) => <p key={i} className="text-[14px] leading-relaxed text-ink-2">{s}</p>)}
          {w.example && (
            <div className="rounded-md border border-yellow/50 bg-yellow-soft p-3 text-[14px] leading-relaxed text-yellow-ink">
              <span className="font-semibold">Think of it like this: </span>{w.example}
            </div>
          )}
          {w.words?.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {w.words.map((x, i) => (
                <div key={i} className="rounded-md border border-line p-2.5 text-[13px]"><b>{x.word}</b><span className="text-sub"> means {x.simple}</span></div>
              ))}
            </div>
          )}
          <button className="text-[13px] font-semibold text-brand" disabled={busy} onClick={onExplain}>{busy ? 'Writing...' : 'Explain it another way'}</button>
        </div>
      )}
      <button className="mt-2 flex items-center gap-1 text-[12px] font-medium text-sub" onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show the story'} <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
      </button>
    </section>
  )
}

function Paragraph({ p, note, level, ai, busy, onExplain }) {
  const [more, setMore] = useState(false)
  const long = p.text.length > 420
  const body = note ? (level === 'kid' && note.kid ? note.kid : note.meaning) : ''
  return (
    <article className="card p-4">
      <p className={`text-[14px] leading-relaxed text-ink-2 ${long && !more ? 'line-clamp-5' : ''}`}>{p.text}</p>
      {long && <button className="mt-1 text-[12px] font-semibold text-sub hover:text-ink" onClick={() => setMore(!more)}>{more ? 'Show less' : 'Read all'}</button>}
      {note ? (
        <div className={`mt-3 rounded-md p-3 ${level === 'kid' && note.kid ? 'bg-yellow-soft text-yellow-ink' : 'bg-brand-soft text-ink'}`}>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide opacity-80">
            {level === 'kid' && note.kid ? <><Baby size={13} /> Like I'm 10</> : <><Lightbulb size={13} /> {note.offline ? 'Main point' : 'What it means'}</>}
          </p>
          <p className="text-[14px] leading-relaxed">{body}</p>
          {note.offline && note.terms?.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-current/10 pt-2 text-[12px] opacity-90">
              {note.terms.slice(0, 2).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
          {note.offline && level === 'kid' && <p className="mt-2 text-[12px] opacity-80">Turn on AI in Settings for the "Like I'm 10" version.</p>}
        </div>
      ) : (
        <button className="mt-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-brand disabled:opacity-50" disabled={busy} onClick={onExplain}>
          <Lightbulb size={15} /> {ai ? 'What does this mean?' : 'Show the main point'}
        </button>
      )}
    </article>
  )
}

// Older uploads did not keep the full text, so the student picks the same file once more.
function AttachFile({ pack, onText }) {
  const ref = useRef()
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  async function pick(file) {
    if (!file) return
    setErr('')
    try {
      setBusy('Reading your file')
      const t = await extractText(file, (p, label = 'Reading your file') => setBusy(`${label} · ${Math.round(p * 100)}%`))
      await saveText(pack.id, t)
      onText(t)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy('')
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <section className="card p-6 text-center">
      <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-md bg-brand-soft text-brand"><FileUp size={22} strokeWidth={1.75} /></span>
      <h2 className="text-[16px] font-semibold">Add your thesis file once more</h2>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-sub">This copy was uploaded before full reading was added. Pick <b>{pack.fileName}</b> again. Your progress stays the same.</p>
      {err && <div className="mt-3 text-left"><Notice tone="red" icon={AlertCircle}>{err}</Notice></div>}
      <input ref={ref} type="file" className="hidden" accept=".pdf,.docx,.txt,.md,image/*" onChange={(e) => pick(e.target.files[0])} />
      <button className="btn-primary mt-4" disabled={!!busy} onClick={() => ref.current.click()}>
        {busy ? <><Loader2 size={16} className="animate-spin" /> {busy}</> : <><FileUp size={16} /> Choose file</>}
      </button>
    </section>
  )
}
