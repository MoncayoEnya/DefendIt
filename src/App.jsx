import { useCallback, useEffect, useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { load, save, levelInfo, today, withDefaults } from './lib/storage.js'
import { extractText } from './lib/extract.js'
import { buildOfflinePack, cleanTitle } from './lib/offline.js'
import { buildAiPack } from './lib/ai.js'
import { DEMO_PACK } from './lib/demo.js'
import { newBadges } from './lib/badges.js'
import { cloudEnabled, onAuthChange, pullData, pushData } from './lib/cloud.js'
import { BottomNavigation, DesktopHeader, MobileHeader, Toast } from './components/Layout.jsx'
import Overview from './pages/Overview.jsx'
import Guide from './pages/Guide.jsx'
import Practice from './pages/Practice.jsx'
import Flashcards from './pages/Flashcards.jsx'
import TypingDefense from './pages/TypingDefense.jsx'
import MatchLink from './pages/MatchLink.jsx'
import MockPanel from './pages/MockPanel.jsx'
import Group from './pages/Group.jsx'
import Confidence from './pages/Confidence.jsx'
import Badges from './pages/Badges.jsx'
import Account from './pages/Account.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import More from './pages/More.jsx'
import Settings from './pages/Settings.jsx'

const NEEDS_PACK = ['guide', 'cards', 'typing', 'panel', 'match', 'group']
const PAGES = {
  overview: Overview, guide: Guide, practice: Practice, cards: Flashcards, typing: TypingDefense, match: MatchLink,
  panel: MockPanel, group: Group, confidence: Confidence, badges: Badges, account: Account, leaderboard: Leaderboard,
  more: More, settings: Settings,
}
const pageFromHash = () => (PAGES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview')

export default function App() {
  const [state, setState] = useState(() => {
    const s = load()
    // repair titles saved by older versions (e.g. a "_____" signature line picked as the title)
    s.packs = s.packs.map((p) => ({ ...p, title: cleanTitle(p.title, p.fileName) }))
    return s
  })
  const [tab, setTab] = useState(pageFromHash)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef()
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => save(state), [state])
  useEffect(() => {
    const onHash = () => setTab(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((id) => {
    if (location.hash.slice(1) !== id) location.hash = id
    setTab(id)
    window.scrollTo(0, 0)
  }, [])

  // every change gets a timestamp so cloud sync knows which copy is newer
  const update = useCallback((fn) => setState((s) => ({ ...fn(structuredClone(s)), updatedAt: Date.now() })), [])

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
      return { ...s, profile: p, updatedAt: Date.now() }
    })
  }, [])

  // ---------- badges ----------
  useEffect(() => {
    const earned = newBadges(state)
    if (!earned.length) return
    const now = new Date().toISOString()
    setState((s) => ({ ...s, updatedAt: Date.now(), profile: { ...s.profile, badges: { ...(s.profile.badges || {}), ...Object.fromEntries(earned.map((b) => [b.id, now])) } } }))
    setToast({ text: `Badge earned: ${earned[0].name}${earned.length > 1 ? ` and ${earned.length - 1} more` : ''}`, big: true, to: 'badges' })
  }, [state])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.big ? 3500 : 2000)
    return () => clearTimeout(t)
  }, [toast])

  // ---------- accounts & cloud sync ----------
  const [user, setUser] = useState(null)
  const [syncStatus, setSyncStatus] = useState({ state: 'idle' })
  const syncReady = useRef(false)
  const skipNextPush = useRef(false)

  useEffect(() => {
    if (!cloudEnabled) return
    let off = () => {}
    onAuthChange((u) => {
      setUser((prev) => {
        if (prev?.id !== u?.id) syncReady.current = false
        return u
      })
    }).then((f) => (off = f))
    return () => off()
  }, [])

  const syncNow = useCallback(async () => {
    if (!user) return
    setSyncStatus({ state: 'syncing' })
    try {
      await pushData(user.id, stateRef.current)
      setSyncStatus({ state: 'saved', at: Date.now() })
    } catch (e) {
      setSyncStatus({ state: 'error', error: e.message })
    }
  }, [user])

  // on sign-in: keep whichever copy is newer
  useEffect(() => {
    if (!user || syncReady.current) return
    let cancelled = false
    ;(async () => {
      setSyncStatus({ state: 'syncing' })
      try {
        const remote = await pullData(user.id)
        if (cancelled) return
        if (remote && (remote.updatedAt || 0) > (stateRef.current.updatedAt || 0)) {
          skipNextPush.current = true
          setState((s) => {
            const merged = withDefaults(remote)
            return { ...merged, settings: { ...merged.settings, apiKey: s.settings.apiKey } }
          })
          setToast({ text: 'Progress restored from your account' })
        } else {
          await pushData(user.id, stateRef.current)
        }
        syncReady.current = true
        setSyncStatus({ state: 'saved', at: Date.now() })
      } catch (e) {
        setSyncStatus({ state: 'error', error: e.message })
      }
    })()
    return () => { cancelled = true }
  }, [user])

  // after that, save to the cloud a few seconds after each change
  useEffect(() => {
    if (!user || !syncReady.current) return
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }
    const t = setTimeout(syncNow, 3000)
    return () => clearTimeout(t)
  }, [state, user, syncNow])

  // ---------- uploads ----------
  async function upload(file) {
    if (!file) return
    setUploadError('')
    try {
      setBusy('Reading your file')
      const text = await extractText(file, (p, label = 'Reading your file') => setBusy(`${label} · ${Math.round(p * 100)}%`))
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
        s.packs.unshift({ ...built, title: cleanTitle(built.title, file.name), id, createdAt: Date.now() })
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
  const cloud = { enabled: cloudEnabled, user, status: syncStatus, syncNow }
  const props = { state, update, addXP, pack, go, uploader, cloud }
  const Page = PAGES[tab] || Overview
  const blocked = NEEDS_PACK.includes(tab) && !pack

  return (
    <div className="min-h-screen">
      <DesktopHeader tab={tab} go={go} state={state} update={update} cloud={cloud} />
      <MobileHeader go={go} state={state} update={update} cloud={cloud} />
      <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => upload(e.target.files[0])} />

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
      <Toast toast={toast} go={go} />
    </div>
  )
}
