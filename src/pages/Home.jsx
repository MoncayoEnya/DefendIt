import { useRef, useState } from 'react'
import { extractText } from '../lib/extract.js'
import { buildOfflinePack } from '../lib/offline.js'
import { buildAiPack } from '../lib/ai.js'
import { DEMO_PACK } from '../lib/demo.js'

export function readiness(state, pack) {
  if (!pack) return 0
  const m = state.mastery[pack.id] || {}
  const items = pack.terms.length + pack.questions.length
  const learned = Object.values(m).reduce((a, x) => a + Math.min(x.box, 3) / 3, 0)
  const study = items ? Math.min(learned / items, 1) : 0
  const panel = (pack.panelBest || 0) / 10
  return Math.round((study * 0.6 + panel * 0.4) * 100)
}

export default function Home({ state, update, addXP, pack, go }) {
  const fileRef = useRef()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const hasKey = !!state.settings.apiKey

  async function handleFile(file) {
    if (!file) return
    setError('')
    try {
      setBusy('Reading your file…')
      const text = await extractText(file, (p) => setBusy(`Reading your file… ${Math.round(p * 100)}%`))
      let built
      if (hasKey) {
        setBusy('AI is studying your paper… (about 20–60 seconds)')
        try {
          built = await buildAiPack(state.settings, text, file.name)
        } catch (e) {
          setError(`AI failed: ${e.message} Using Offline mode instead.`)
          built = buildOfflinePack(text, file.name)
        }
      } else {
        setBusy('Building your study pack…')
        built = buildOfflinePack(text, file.name)
      }
      const id = crypto.randomUUID()
      update((s) => {
        s.packs.unshift({ ...built, id, createdAt: Date.now() })
        s.activeId = id
        return s
      })
      addXP(25, 'File imported')
      go('guide')
    } catch (e) {
      setError(e.message || 'Something went wrong reading that file.')
    } finally {
      setBusy(null)
    }
  }

  function loadDemo() {
    const id = 'demo'
    update((s) => {
      if (!s.packs.some((p) => p.id === id)) s.packs.push({ ...DEMO_PACK, id, createdAt: Date.now() })
      s.activeId = id
      return s
    })
    go('guide')
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Train for your defense <br className="hidden sm:block" />like it's a <span className="text-mint">boss fight</span>.
        </h1>
        <p className="mt-2 text-muted">Upload your thesis. Get a study guide, flashcards, typing games and an AI panel to practice against.</p>
      </section>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => !busy && fileRef.current.click()}
        className={`card cursor-pointer border-2 border-dashed p-8 text-center transition ${drag ? 'border-mint bg-panel2' : 'hover:border-mint/60'}`}
      >
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        {busy ? (
          <div className="space-y-3">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-line border-t-mint" />
            <p className="font-medium">{busy}</p>
          </div>
        ) : (
          <>
            <div className="text-4xl">📄</div>
            <p className="mt-3 text-lg font-bold">Tap to upload your thesis</p>
            <p className="text-sm text-muted">PDF, Word (.docx) or .txt · stays on your device</p>
            <p className="mt-3 text-xs">
              {hasKey ? <span className="text-mint">● AI mode on (Gemini free)</span> : <span className="text-gold">● Offline mode · <button className="underline" onClick={(e) => { e.stopPropagation(); go('settings') }}>add a free AI key</button> for smarter results</span>}
            </p>
          </>
        )}
      </div>
      {error && <p className="rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">{error}</p>}

      {!state.packs.length && (
        <button className="btn-ghost w-full" onClick={loadDemo}>No file yet? Try a demo thesis</button>
      )}

      {pack && (
        <section className="card p-5">
          <div className="flex items-start gap-4">
            <Ring value={readiness(state, pack)} />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted">Defense readiness</p>
              <h2 className="truncate text-lg font-bold">{pack.title}</h2>
              <p className="text-sm text-muted">{pack.terms.length} terms · {pack.questions.length} panel questions · {pack.source === 'ai' ? 'AI-built' : 'Offline-built'}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Quick onClick={() => go('guide')} icon="📖" label="Study guide" />
            <Quick onClick={() => go('cards')} icon="🃏" label="Flashcards" />
            <Quick onClick={() => go('typing')} icon="⌨️" label="Typing Defense" />
            <Quick onClick={() => go('panel')} icon="⚔️" label="Boss: Panel" />
          </div>
        </section>
      )}

      {state.packs.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm uppercase tracking-wider text-muted">Your files</h3>
          <div className="space-y-2">
            {state.packs.map((p) => (
              <div key={p.id} className={`card flex items-center gap-3 p-3 ${p.id === state.activeId ? 'border-mint/60' : ''}`}>
                <button className="min-w-0 flex-1 text-left" onClick={() => update((s) => ({ ...s, activeId: p.id }))}>
                  <div className="truncate font-medium">{p.title}</div>
                  <div className="text-xs text-muted">{p.fileName} · {readiness(state, p)}% ready</div>
                </button>
                <button
                  className="text-muted hover:text-rose"
                  aria-label="Delete"
                  onClick={() => confirm('Delete this study pack?') && update((s) => {
                    s.packs = s.packs.filter((x) => x.id !== p.id)
                    delete s.mastery[p.id]
                    if (s.activeId === p.id) s.activeId = s.packs[0]?.id || null
                    return s
                  })}
                >✕</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Quick({ onClick, icon, label }) {
  return (
    <button onClick={onClick} className="rounded-xl border border-line bg-panel2 p-3 text-left transition hover:border-mint active:scale-95">
      <div className="text-xl">{icon}</div>
      <div className="mt-1 text-sm font-medium">{label}</div>
    </button>
  )
}

export function Ring({ value, size = 72 }) {
  const r = size / 2 - 6
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-panel2)" strokeWidth="8" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-mint)" strokeWidth="8" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#e8ebff" fontWeight="700" fontSize="16">{value}%</text>
    </svg>
  )
}
