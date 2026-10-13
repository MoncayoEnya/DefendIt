import { useState } from 'react'
import { AlertCircle, BellRing, Bot, CalendarPlus, CheckCircle2, Flame, Loader2, Monitor, Moon, Smartphone, Sun, Trophy } from 'lucide-react'
import { IconBox, Notice, PageHeader, ProgressBar, SectionTitle } from '../components/ui.jsx'
import { hasAI, serverAIEnabled, testKey } from '../lib/ai.js'
import { levelInfo, LEVELS } from '../lib/storage.js'
import { askBrowserPermission, downloadIcs, isNative } from '../lib/reminders.js'

export default function Settings({ state, update, pack }) {
  const [key, setKey] = useState(state.settings.apiKey)
  const [model, setModel] = useState(state.settings.model)
  const [status, setStatus] = useState(null) // { tone, text }
  const [testing, setTesting] = useState(false)
  const lv = levelInfo(state.profile.xp)
  const server = serverAIEnabled()
  const aiOn = hasAI(state)

  async function saveKey() {
    setTesting(true)
    setStatus(null)
    try {
      await testKey({ apiKey: key.trim(), model: model.trim() })
      update((s) => ({ ...s, settings: { ...s.settings, apiKey: key.trim(), model: model.trim() } }))
      setStatus({ tone: 'green', text: 'AI mode is on. New uploads will use Gemini.' })
    } catch (e) {
      setStatus({ tone: 'red', text: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Settings" title="Settings" desc="Everything is saved on this device only." />

      <section className="card mb-4 p-5">
        <h2 className="text-[15px] font-semibold">Appearance</h2>
        <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
          {[['system', 'System', Monitor], ['light', 'Light', Sun], ['dark', 'Dark', Moon]].map(([id, label, Icon]) => {
            const on = (state.settings.theme || 'system') === id
            return (
              <button key={id} role="radio" aria-checked={on} onClick={() => update((s) => ({ ...s, settings: { ...s.settings, theme: id } }))}
                className={`flex h-16 flex-col items-center justify-center gap-1 rounded-md border text-[13px] font-medium ${on ? 'border-brand-2 bg-brand-soft text-brand' : 'border-line hover:bg-bg'}`}>
                <Icon size={18} strokeWidth={1.75} aria-hidden /> {label}
              </button>
            )
          })}
        </div>
      </section>

      <Reminders state={state} update={update} pack={pack} />

      <section className="card p-5">
        <div className="flex items-start gap-3">
          <IconBox icon={Bot} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold">AI assistant</h2>
              <span className={`tag ${aiOn ? '!border-brand-2/30 !bg-brand-soft !text-brand' : ''}`}>
                {state.settings.apiKey ? 'On · your own key' : server ? 'On · provided by the app' : 'Offline mode'}
              </span>
            </div>
            <p className="text-[13px] text-sub">
              {server && !state.settings.apiKey
                ? 'AI is ready. Study packs, answer scoring, simple explanations and slide reviews all work with nothing to set up.'
                : 'Uses Google Gemini and Groq for smarter study packs, answer scoring and follow-up questions.'}
            </p>
          </div>
        </div>

        <details className="mt-4 rounded-md border border-line p-3 text-[13px]" open={!server || !!state.settings.apiKey}>
          <summary className="cursor-pointer font-medium">{server ? 'Use your own key instead (optional)' : 'Add a free Gemini key'}</summary>
          {server && <p className="mt-2 text-[12px] text-sub">Only needed if the app's shared AI is busy. Your own key gives you your own free daily limit.</p>}
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-ink-2">
            <li>Open <a className="font-semibold text-brand underline-offset-2 hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a> and sign in with Google.</li>
            <li>Select <b>Create API key</b> and copy it.</li>
            <li>Paste it below. It is stored only in this browser.</li>
          </ol>
          <label className="mt-4 block text-[12px] font-medium text-sub" htmlFor="apikey">Gemini API key</label>
          <input id="apikey" className="input mt-1 font-mono" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste your key" />
          <details className="mt-3">
            <summary className="cursor-pointer text-sub">Advanced: model name</summary>
            <input className="input mt-2 font-mono" value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model name" />
            <p className="mt-1 text-[12px] text-sub">If Google renames its free model, update the name here using the model list in AI Studio.</p>
          </details>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={saveKey} disabled={!key.trim() || testing}>{testing ? <><Loader2 size={15} className="animate-spin" /> Testing</> : 'Save and test'}</button>
            {state.settings.apiKey && (
              <button className="btn-ghost" onClick={() => { update((s) => ({ ...s, settings: { ...s.settings, apiKey: '' } })); setKey(''); setStatus({ tone: server ? 'green' : 'yellow', text: server ? 'Your key was removed. The app\'s AI is used instead.' : 'AI turned off. Offline mode is active.' }) }}>Remove key</button>
            )}
          </div>
        </details>
        {status && <div className="mt-3"><Notice tone={status.tone} icon={status.tone === 'green' ? CheckCircle2 : AlertCircle}>{status.text}</Notice></div>}
        <p className="mt-3 text-[12px] text-sub">Thesis text is sent to the AI (Google Gemini or Groq) to build your study pack and score answers. On free tiers, providers may use inputs to improve their products, so avoid confidential material.</p>
      </section>

      <SectionTitle>Progress</SectionTitle>
      <section className="card p-5">
        <div className="grid grid-cols-3 gap-3">
          <Mini icon={Trophy} label="Level" value={`${lv.level} · ${lv.name}`} />
          <Mini icon={Flame} label="Daily streak" value={`${state.profile.streak} day${state.profile.streak === 1 ? '' : 's'}`} />
          <Mini label="Total XP" value={state.profile.xp} />
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[12px] text-sub"><span>Progress to next level</span><span>{lv.next ? `${lv.next.xp - state.profile.xp} XP to ${lv.next.name}` : 'Max level reached'}</span></div>
          <ProgressBar value={lv.pct * 100} className="h-2" />
        </div>
        <ul className="mt-4 divide-y divide-line rounded-md border border-line">
          {LEVELS.map((l, i) => (
            <li key={l.name} className={`flex justify-between px-3 py-2 text-[13px] ${i + 1 === lv.level ? 'bg-brand-soft font-semibold text-brand' : i + 1 < lv.level ? '' : 'text-sub'}`}>
              <span>Level {i + 1} · {l.name}</span><span>{l.xp} XP</span>
            </li>
          ))}
        </ul>
      </section>

      <SectionTitle>Install on your phone</SectionTitle>
      <section className="card flex gap-3 p-5">
        <IconBox icon={Smartphone} tone="blue" size="sm" />
        <p className="text-[13px] text-ink-2">Android (Chrome): open the menu and choose <b>Add to Home screen</b>. iPhone (Safari): tap Share, then <b>Add to Home Screen</b>.</p>
      </section>
    </div>
  )
}

function Mini({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[12px] text-sub">{Icon && <Icon size={14} />}{label}</div>
      <div className="mt-0.5 truncate text-[14px] font-semibold">{value}</div>
    </div>
  )
}

function Reminders({ state, update, pack }) {
  const r = state.profile.reminders || { enabled: false, time: '19:00' }
  const [msg, setMsg] = useState(null)
  const set = (patch) => update((s) => ({ ...s, profile: { ...s.profile, reminders: { ...r, ...patch } } }))

  async function toggle(enabled) {
    set({ enabled })
    setMsg(null)
    if (enabled && !isNative) {
      const p = await askBrowserPermission()
      if (p === 'denied') setMsg({ tone: 'yellow', text: 'Browser notifications are blocked. Use "Add to my calendar" so your phone reminds you.' })
    }
  }

  return (
    <section className="card mb-4 p-5">
      <div className="flex items-start gap-3">
        <IconBox icon={BellRing} tone="yellow" />
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold">Reminders</h2>
          <p className="text-[13px] text-sub">A daily nudge to practice, plus your defense date.</p>
        </div>
        <label className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center">
          <input type="checkbox" className="peer sr-only" checked={!!r.enabled} onChange={(e) => toggle(e.target.checked)} aria-label="Daily reminder" />
          <span className="absolute inset-0 rounded-full bg-track transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand-2" />
          <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="rtime" className="text-[12px] font-medium text-sub">Remind me at</label>
          <input id="rtime" type="time" className="input mt-1 !w-36" value={r.time || '19:00'} onChange={(e) => set({ time: e.target.value })} />
        </div>
        <button className="btn-outline" onClick={() => { downloadIcs({ time: r.time || '19:00', defenseDate: pack?.defenseDate, title: pack?.title }); setMsg({ tone: 'green', text: 'Calendar file downloaded. Open it to add the reminders to your calendar.' }) }}>
          <CalendarPlus size={16} /> Add to my calendar
        </button>
      </div>
      <p className="mt-2 text-[12px] text-sub">
        {isNative
          ? 'The app will notify you every day at this time, and the day before your defense.'
          : `Calendar reminders work on any phone${pack?.defenseDate ? ' and include your defense date' : ''}. The app also reminds you when you open it after this time.`}
      </p>
      {msg && <div className="mt-3"><Notice tone={msg.tone} icon={msg.tone === 'green' ? CheckCircle2 : AlertCircle}>{msg.text}</Notice></div>}
    </section>
  )
}
