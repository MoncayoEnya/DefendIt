import { useState } from 'react'
import { Check, Mic, UserRound } from 'lucide-react'
import { PageHeader } from '../components/ui.jsx'
import { Avatar } from '../components/Layout.jsx'
import { OpeningText } from '../components/Opening.jsx'
import { namesFromUser } from '../lib/profile.js'
import { levelInfo } from '../lib/storage.js'

const FORM = [
  { key: 'name', label: 'What should we call you?', placeholder: 'e.g. Enya', max: 30 },
  { key: 'fullName', label: 'Full name', hint: 'Used in your opening line', placeholder: 'e.g. Enya Moncayo', max: 60 },
  { key: 'members', label: 'Groupmates', hint: 'One per line. Leave empty if solo.', placeholder: 'Ana Cruz\nBen Reyes', max: 300, area: true },
  { key: 'school', label: 'School', placeholder: 'e.g. Polytechnic University of the Philippines', max: 80 },
  { key: 'course', label: 'Course or strand', placeholder: 'e.g. BSIT 4-1', max: 40 },
  { key: 'adviser', label: 'Adviser', placeholder: 'e.g. Dr. Maria Santos', max: 60 },
]

export default function Profile({ state, update, pack, cloud, go }) {
  const [form, setForm] = useState(() => Object.fromEntries(FORM.map((f) => [f.key, state.profile[f.key] || ''])))
  const [saved, setSaved] = useState(false)
  const google = cloud?.user ? namesFromUser(cloud.user) : null
  const lv = levelInfo(state.profile.xp)
  const changed = FORM.some((f) => (state.profile[f.key] || '') !== form[f.key])
  const set = (k, v) => { setForm({ ...form, [k]: v }); setSaved(false) }

  function save(e) {
    e.preventDefault()
    const clean = Object.fromEntries(FORM.map((f) => [f.key, form[f.key].trim()]))
    update((s) => ({ ...s, profile: { ...s.profile, ...clean } }))
    setSaved(true)
  }

  function useGoogle() {
    setForm({ ...form, name: form.name || google.first, fullName: google.full })
    setSaved(false)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Profile" title="Your profile" desc="Your details fill in the blanks in your opening line." />

      <section className="card mb-4 flex items-center gap-4 p-4 md:p-5">
        <Avatar name={form.name || form.fullName || 'Student'} photo={state.profile.photo} size={56} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-semibold">{form.fullName || form.name || 'Student'}</div>
          <div className="text-[13px] text-sub">Level {lv.level} · {lv.name} · {state.profile.xp} XP</div>
          {cloud?.user && <div className="truncate text-[12px] text-sub">{cloud.user.email}</div>}
        </div>
        {google?.full && google.full !== form.fullName && (
          <button type="button" className="btn-ghost shrink-0 !h-9 !text-[12px]" onClick={useGoogle}>Use my Google name</button>
        )}
      </section>

      <form onSubmit={save} className="card p-4 md:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {FORM.map((f) => (
            <div key={f.key} className={f.area ? 'sm:col-span-2' : ''}>
              <label htmlFor={`p-${f.key}`} className="text-[13px] font-medium">{f.label}</label>
              {f.hint && <span className="ml-1.5 text-[12px] text-sub">{f.hint}</span>}
              {f.area ? (
                <textarea id={`p-${f.key}`} rows={3} className="input mt-1 !h-auto py-2" value={form[f.key]} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value.slice(0, f.max))} />
              ) : (
                <input id={`p-${f.key}`} className="input mt-1" value={form[f.key]} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value.slice(0, f.max))} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button className="btn-primary" disabled={!changed}><Check size={16} /> Save profile</button>
          {saved && !changed && <span className="text-[13px] font-medium text-brand">Saved</span>}
        </div>
      </form>

      {pack?.elevatorPitch && (
        <section className="card mt-4 p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Mic size={17} strokeWidth={1.75} className="text-brand" aria-hidden />Your opening line</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2"><OpeningText text={pack.elevatorPitch} profile={{ ...state.profile, ...form }} /></p>
          <button className="mt-2 text-[13px] font-semibold text-brand" onClick={() => go('guide')}>Open study guide</button>
        </section>
      )}

      {!pack?.elevatorPitch && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-sub"><UserRound size={15} aria-hidden /> Upload your thesis to see your opening line here.</p>
      )}
    </div>
  )
}
