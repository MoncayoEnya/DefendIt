import { useRef, useState } from 'react'
import { Camera, Check, Mic, Trash2, UserRound } from 'lucide-react'
import { PageHeader } from '../components/ui.jsx'
import { Avatar } from '../components/Layout.jsx'
import { OpeningText } from '../components/Opening.jsx'
import { namesFromUser, squarePhoto } from '../lib/profile.js'
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
        <PhotoPicker state={state} update={update} name={form.name || form.fullName || 'Student'} google={google} />
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
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-md border border-line p-3">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]" checked={state.profile.shareProfile !== false}
            onChange={(e) => update((s) => ({ ...s, profile: { ...s.profile, shareProfile: e.target.checked } }))} />
          <span>
            <span className="block text-[13px] font-medium">Show my photo, course and school to classmates</span>
            <span className="block text-[12px] text-sub">On the class leaderboard. Your name and scores are always shown there.</span>
          </span>
        </label>
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

function PhotoPicker({ state, update, name, google }) {
  const ref = useRef()
  const [err, setErr] = useState('')
  const photo = state.profile.photo
  const setPhoto = (v) => update((s) => ({ ...s, profile: { ...s.profile, photo: v } }))
  async function pick(file) {
    setErr('')
    try { setPhoto(await squarePhoto(file)) } catch (e) { setErr(e.message) }
    if (ref.current) ref.current.value = ''
  }
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button type="button" onClick={() => ref.current.click()} className="group relative rounded-full" aria-label={photo ? 'Change profile picture' : 'Add profile picture'}>
        <Avatar name={name} photo={photo} size={72} />
        <span className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-brand text-white"><Camera size={14} aria-hidden /></span>
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files[0])} />
      {photo && <button type="button" className="flex items-center gap-1 text-[11px] font-medium text-sub hover:text-red" onClick={() => setPhoto(google?.photo && photo !== google.photo ? google.photo : '')}><Trash2 size={12} /> Remove</button>}
      {err && <p className="max-w-28 text-center text-[11px] text-red-ink">{err}</p>}
    </div>
  )
}
