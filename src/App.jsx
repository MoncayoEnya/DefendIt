import { useCallback, useEffect, useState } from 'react'
import { load, save, levelInfo, today } from './lib/storage.js'
import Home from './pages/Home.jsx'
import Guide from './pages/Guide.jsx'
import Flashcards from './pages/Flashcards.jsx'
import TypingDefense from './pages/TypingDefense.jsx'
import MockPanel from './pages/MockPanel.jsx'
import Confidence from './pages/Confidence.jsx'
import Settings from './pages/Settings.jsx'

const TABS = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'guide', label: 'Guide', icon: '📖', needsPack: true },
  { id: 'cards', label: 'Cards', icon: '🃏', needsPack: true },
  { id: 'typing', label: 'Typing', icon: '⌨️', needsPack: true },
  { id: 'panel', label: 'Boss', icon: '⚔️', needsPack: true },
  { id: 'confidence', label: 'Confidence', icon: '💪' },
]

export default function App() {
  const [state, setState] = useState(load)
  const [tab, setTab] = useState(() => location.hash.slice(1) || 'home')
  const [toast, setToast] = useState(null)

  useEffect(() => save(state), [state])
  useEffect(() => {
    const onHash = () => setTab(location.hash.slice(1) || 'home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (id) => {
    location.hash = id
    setTab(id)
    window.scrollTo(0, 0)
  }

  const update = useCallback((fn) => setState((s) => fn(structuredClone(s))), [])

  const addXP = useCallback((amount, why) => {
    if (!amount) return
    setState((s) => {
      const p = { ...s.profile }
      const before = levelInfo(p.xp).level
      p.xp += amount
      const d = today()
      if (p.lastDay !== d) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        p.streak = p.lastDay === yesterday ? p.streak + 1 : 1
        p.lastDay = d
      }
      const after = levelInfo(p.xp)
      setToast({ text: after.level > before ? `LEVEL UP! You are now a ${after.name} 🎉` : `+${amount} XP${why ? ' · ' + why : ''}`, big: after.level > before })
      return { ...s, profile: p }
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.big ? 3500 : 1800)
    return () => clearTimeout(t)
  }, [toast])

  const pack = state.packs.find((p) => p.id === state.activeId)
  const lv = levelInfo(state.profile.xp)
  const props = { state, update, addXP, pack, go }

  const current = TABS.find((t) => t.id === tab)
  const blocked = current?.needsPack && !pack

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4">
      <header className="mb-5 flex items-center gap-3">
        <button onClick={() => go('home')} className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-9 w-9" />
          <span className="text-xl font-bold tracking-tight">Defend<span className="text-mint">It</span></span>
        </button>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-xs text-muted">Lv {lv.level} · {lv.name}</div>
            <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-panel2">
              <div className="h-full bg-gradient-to-r from-mint to-gold" style={{ width: `${lv.pct * 100}%` }} />
            </div>
          </div>
          <span className="chip font-mono !text-gold">🔥 {state.profile.streak}</span>
          <span className="chip font-mono !text-mint">{state.profile.xp} XP</span>
          <button onClick={() => go('settings')} className="btn-ghost !px-2.5 !py-1.5" aria-label="Settings">⚙︎</button>
        </div>
      </header>

      {blocked ? (
        <div className="card p-8 text-center">
          <p className="mb-4 text-muted">Upload your thesis first so this mode can be built from it.</p>
          <button className="btn-primary" onClick={() => go('home')}>Upload a file</button>
        </div>
      ) : (
        <>
          {tab === 'home' && <Home {...props} />}
          {tab === 'guide' && <Guide {...props} />}
          {tab === 'cards' && <Flashcards {...props} />}
          {tab === 'typing' && <TypingDefense {...props} />}
          {tab === 'panel' && <MockPanel {...props} />}
          {tab === 'confidence' && <Confidence {...props} />}
          {tab === 'settings' && <Settings {...props} />}
        </>
      )}

      {toast && (
        <div className={`pop fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-5 py-2 font-bold shadow-lg ${toast.big ? 'bg-gold text-ink' : 'bg-mint text-ink'}`}>
          {toast.text}
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto flex max-w-3xl justify-between px-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${tab === t.id ? 'text-mint' : 'text-muted'} ${t.needsPack && !pack ? 'opacity-40' : ''}`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
