import { useState } from 'react'
import { testKey } from '../lib/ai.js'
import { levelInfo, LEVELS } from '../lib/storage.js'

export default function Settings({ state, update }) {
  const [key, setKey] = useState(state.settings.apiKey)
  const [model, setModel] = useState(state.settings.model)
  const [status, setStatus] = useState('')
  const lv = levelInfo(state.profile.xp)

  async function saveKey() {
    setStatus('Testing key…')
    try {
      await testKey({ apiKey: key.trim(), model: model.trim() })
      update((s) => ({ ...s, settings: { apiKey: key.trim(), model: model.trim() } }))
      setStatus('✓ AI mode is on!')
    } catch (e) {
      setStatus('✗ ' + e.message)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="card space-y-3 p-5">
        <h2 className="font-bold">🤖 Free AI (Google Gemini)</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-[#cfd4f5]">
          <li>Go to <a className="text-mint underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a> and sign in with Google.</li>
          <li>Click <b>Create API key</b> and copy it.</li>
          <li>Paste it here. It is saved only in this browser.</li>
        </ol>
        <input className="input font-mono" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste your Gemini API key" />
        <details className="text-sm">
          <summary className="cursor-pointer text-muted">Advanced: model name</summary>
          <input className="input mt-2 font-mono" value={model} onChange={(e) => setModel(e.target.value)} />
          <p className="mt-1 text-xs text-muted">If Google renames its free model, change it here (check the model list in AI Studio).</p>
        </details>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={saveKey} disabled={!key.trim()}>Save & test</button>
          {state.settings.apiKey && (
            <button className="btn-ghost" onClick={() => { update((s) => ({ ...s, settings: { ...s.settings, apiKey: '' } })); setKey(''); setStatus('AI turned off. Offline mode is active.') }}>Remove key</button>
          )}
        </div>
        {status && <p className="text-sm">{status}</p>}
        <p className="text-xs text-muted">Note: on the free tier, Google may use your inputs to improve its products. Don't upload anything confidential.</p>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">🏅 Ranks</h2>
        <div className="space-y-1">
          {LEVELS.map((l, i) => (
            <div key={l.name} className={`flex justify-between rounded-lg px-3 py-1.5 text-sm ${i + 1 === lv.level ? 'bg-mint/15 font-bold text-mint' : i + 1 < lv.level ? 'text-[#cfd4f5]' : 'text-muted'}`}>
              <span>Lv {i + 1} · {l.name}</span><span className="font-mono">{l.xp} XP</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-bold">📱 Install on your phone</h2>
        <p className="text-sm text-[#cfd4f5]">Android (Chrome): menu ⋮ → <b>Add to Home screen</b>. iPhone (Safari): Share → <b>Add to Home Screen</b>.</p>
      </section>

      <button
        className="btn w-full border border-rose/50 text-rose"
        onClick={() => confirm('Delete ALL progress, files and settings on this device?') && (localStorage.clear(), location.reload())}
      >Reset everything</button>
    </div>
  )
}
