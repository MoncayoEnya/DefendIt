import { useCallback, useEffect, useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { load, save, levelInfo, today } from './lib/storage.js'
import { extractText } from './lib/extract.js'
import { buildOfflinePack } from './lib/offline.js'
import { buildAiPack } from './lib/ai.js'
import { DEMO_PACK } from './lib/demo.js'
import { BottomNavigation, DesktopHeader, MobileHeader, Toast } from './components/Layout.jsx'
import Overview from './pages/Overview.jsx'
import Guide from './pages/Guide.jsx'
import Practice from './pages/Practice.jsx'
import Flashcards from './pages/Flashcards.jsx'
import TypingDefense from './pages/TypingDefense.jsx'
import MockPanel from './pages/MockPanel.jsx'
import Confidence from './pages/Confidence.jsx'
import More from './pages/More.jsx'
import Settings from './pages/Settings.jsx'

const NEEDS_PACK = ['guide', 'cards', 'typing', 'panel']
const PAGES = { overview: Overview, guide: Guide, practice: Practice, cards: Flashcards, typing: TypingDefense, panel: MockPanel, confidence: Confidence, more: More, settings: Settings }

export default function App() {
  const [state, setState] = useState(load)
  const [tab, setTab] = useState(() => (PAGES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview'))
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef()

  useEffect(() => save(state), [state])
  useEffect(() => {
    const onHash = () => setTab(PAGES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((id) => {
    if (location.hash.slice(1) !== id) location.hash = id
    setTab(id)
    window.scrollTo(0, 0)
  }, [])

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
      setToast(after.level > before ? { text: `Level up: you are now ${after.name}`, big: true } : { text: `+${amount} XP${why ? ' · ' + why : ''}` })
      return { ...s, profile: p }
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.big ? 3500 : 2000)
    return () => clearTimeout(t)
  }, [toast])

  async function upload(file) {
    if (!file) return
    setUploadError('')
    try {
      setBusy('Reading your file')
      const text = await extractText(file, (p) => setBusy(`Reading your file · ${Math.round(p * 100)}%`))
      let built
      if (state.settings.apiKey) {
        setBusy('AI is studying your paper · about 20 to 60 seconds')
        try {
          built = await buildAiPack(state.settings, text, file.name)
        } catch (e) {
          setUploadError(`AI could not process the file (${e.message}). Offline mode was used instead.`)
          built = buildOfflinePack(text, file.name)
        }
      } else {
        setBusy('Building your study pack')
        built = buildOfflinePack(text, file.name)
      }
      const id = crypto.randomUUID()
      update((s) => {
        s.packs.unshift({ ...built, id, createdAt: Date.now() })
        s.activeId = id
        return s
      })
      addXP(25, 'Thesis imported')
      go('guide')
    } catch (e) {
      setUploadError(e.message || 'Something went wrong reading that file.')
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function loadDemo() {
    update((s) => {
      if (!s.packs.some((p) => p.id === 'demo')) s.packs.push({ ...DEMO_PACK, id: 'demo', sample: true, createdAt: Date.now() })
      s.activeId = 'demo'
      return s
    })
    go('overview')
  }

  const pack = state.packs.find((p) => p.id === state.activeId)
  const uploader = { pick: () => fileRef.current?.click(), loadDemo, busy, error: uploadError, clearError: () => setUploadError('') }
  const props = { state, update, addXP, pack, go, uploader }
  const Page = PAGES[tab] || Overview
  const blocked = NEEDS_PACK.includes(tab) && !pack

  return (
    <div className="min-h-screen">
      <DesktopHeader tab={tab} go={go} state={state} update={update} />
      <MobileHeader go={go} state={state} update={update} />
      <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => upload(e.target.files[0])} />

      <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-5 md:px-6 md:pb-12 md:pt-7 lg:px-8">
        {blocked ? (
          <div className="card mx-auto max-w-md p-8 text-center">
            <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-md bg-brand-soft text-brand"><FileUp size={22} strokeWidth={1.75} /></span>
            <h1 className="text-[17px] font-semibold">Upload your thesis first</h1>
            <p className="mt-1 text-[13px] text-sub">This section is built from your document.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button className="btn-primary" onClick={uploader.pick}>Upload thesis</button>
              <button className="btn-outline" onClick={loadDemo}>Use sample thesis</button>
            </div>
          </div>
        ) : (
          <Page key={tab} {...props} />
        )}
      </main>

      <BottomNavigation tab={tab} go={go} />
      <Toast toast={toast} />
    </div>
  )
}
