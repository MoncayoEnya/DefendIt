import { useState } from 'react'
import { AlertCircle, Bot, CheckCircle2, Flame, Loader2, Smartphone, Trophy } from 'lucide-react'
import { IconBox, Notice, PageHeader, ProgressBar, SectionTitle } from '../components/ui.jsx'
import { testKey } from '../lib/ai.js'
import { levelInfo, LEVELS } from '../lib/storage.js'

export default function Settings({ state, update }) {
  const [key, setKey] = useState(state.settings.apiKey)
  const [model, setModel] = useState(state.settings.model)
  const [status, setStatus] = useState(null) // { tone, text }
  const [testing, setTesting] = useState(false)
  const lv = levelInfo(state.profile.xp)

  async function saveKey() {
    setTesting(true)
    setStatus(null)
    try {
      await testKey({ apiKey: key.trim(), model: model.trim() })
      update((s) => ({ ...s, settings: { apiKey: key.trim(), model: model.trim() } }))
      setStatus({ tone: 'green', text: 'AI mode is on. New uploads will use Gemini.' })
    } catch (e) {
      setStatus({ tone: 'red', text: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Settings" title="Settings" desc="Everything is saved on this device only." />

      <section className="card p-5">
        <div className="flex items-start gap-3">
          <IconBox icon={Bot} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold">AI assistant</h2>
              <span className={`tag ${state.settings.apiKey ? '!border-brand-2/30 !bg-brand-soft !text-brand' : ''}`}>{state.settings.apiKey ? 'On' : 'Offline mode'}</span>
            </div>
            <p className="text-[13px] text-sub">Uses Google Gemini's free tier for smarter study packs, answer scoring and follow-up questions.</p>
          </div>
        </div>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-[13px] text-[#2b343d]">
          <li>Open <a className="font-semibold text-brand underline-offset-2 hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a> and sign in with Google.</li>
          <li>Select <b>Create API key</b> and copy it.</li>
          <li>Paste it below. It is stored only in this browser.</li>
        </ol>
        <label className="mt-4 block text-[12px] font-medium text-sub" htmlFor="apikey">Gemini API key</label>
        <input id="apikey" className="input mt-1 font-mono" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste your key" />
        <details className="mt-3 text-[13px]">
          <summary className="cursor-pointer text-sub">Advanced: model name</summary>
          <input className="input mt-2 font-mono" value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model name" />
          <p className="mt-1 text-[12px] text-sub">If Google renames its free model, update the name here using the model list in AI Studio.</p>
        </details>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={saveKey} disabled={!key.trim() || testing}>{testing ? <><Loader2 size={15} className="animate-spin" /> Testing</> : 'Save and test'}</button>
          {state.settings.apiKey && (
            <button className="btn-ghost" onClick={() => { update((s) => ({ ...s, settings: { ...s.settings, apiKey: '' } })); setKey(''); setStatus({ tone: 'yellow', text: 'AI turned off. Offline mode is active.' }) }}>Remove key</button>
          )}
        </div>
        {status && <div className="mt-3"><Notice tone={status.tone} icon={status.tone === 'green' ? CheckCircle2 : AlertCircle}>{status.text}</Notice></div>}
        <p className="mt-3 text-[12px] text-sub">On the free tier, Google may use inputs to improve its products. Avoid uploading confidential material.</p>
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
        <p className="text-[13px] text-[#2b343d]">Android (Chrome): open the menu and choose <b>Add to Home screen</b>. iPhone (Safari): tap Share, then <b>Add to Home Screen</b>.</p>
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
