import { useState } from 'react'
import { AlertCircle, CheckCircle2, Cloud, CloudOff, Loader2, LogOut, RefreshCw } from 'lucide-react'
import { IconBox, Notice, PageHeader } from '../components/ui.jsx'
import { cloudEnabled, resetPassword, signIn, signOut, signUp } from '../lib/cloud.js'

export default function Account({ cloud, go }) {
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  if (!cloudEnabled) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader eyebrow="Account" title="Cloud saving is not set up yet" desc="Your progress is saved on this device. To sign in and sync across phones and computers, the app owner needs to connect a free Supabase project." />
        <section className="card flex gap-3 p-5">
          <IconBox icon={CloudOff} tone="yellow" />
          <div className="text-[13px] text-[#2b343d]">
            <p>Follow <b>docs/CLOUD_SETUP.md</b> in the project folder. It takes about 10 minutes:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Create a free project at supabase.com.</li>
              <li>Run <b>supabase/schema.sql</b> in its SQL Editor.</li>
              <li>Copy the project URL and anon key into a <b>.env</b> file.</li>
              <li>Restart the app.</li>
            </ol>
          </div>
        </section>
      </div>
    )
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'signup') {
        const data = await signUp(email.trim(), password)
        if (!data.session) setMsg({ tone: 'green', text: 'Account created. Check your email to confirm it, then sign in.' })
      } else {
        await signIn(email.trim(), password)
      }
    } catch (err) {
      setMsg({ tone: 'red', text: friendly(err.message) })
    } finally {
      setBusy(false)
    }
  }

  async function forgot() {
    if (!email.trim()) return setMsg({ tone: 'yellow', text: 'Type your email first, then select "Forgot password".' })
    try {
      await resetPassword(email.trim())
      setMsg({ tone: 'green', text: 'Password reset email sent.' })
    } catch (err) {
      setMsg({ tone: 'red', text: friendly(err.message) })
    }
  }

  if (cloud.user) {
    const st = cloud.status
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader eyebrow="Account" title="Your account" desc="Your progress is backed up and syncs to any device where you sign in." />
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <IconBox icon={Cloud} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">{cloud.user.email}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-sub">
                {st.state === 'syncing' && <><Loader2 size={13} className="animate-spin" /> Syncing</>}
                {st.state === 'saved' && <><CheckCircle2 size={13} className="text-brand" /> Saved to cloud {st.at ? new Date(st.at).toLocaleTimeString() : ''}</>}
                {st.state === 'error' && <><AlertCircle size={13} className="text-red" /> Sync problem</>}
                {st.state === 'idle' && 'Connected'}
              </div>
            </div>
          </div>
          {st.state === 'error' && <div className="mt-3"><Notice tone="red" icon={AlertCircle}>{friendly(st.error)}</Notice></div>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={cloud.syncNow}><RefreshCw size={15} /> Sync now</button>
            <button className="btn-ghost" onClick={() => go('leaderboard')}>Class leaderboard</button>
            <button className="btn-ghost" onClick={signOut}><LogOut size={15} /> Sign out</button>
          </div>
          <p className="mt-4 text-[12px] text-sub">Your AI key is never uploaded. It stays on each device.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader eyebrow="Account" title={mode === 'signup' ? 'Create your account' : 'Sign in'} desc="Back up your progress and use DefendIt on your phone and computer." />
      <form onSubmit={submit} className="card space-y-3 p-5">
        <div>
          <label htmlFor="email" className="text-[12px] font-medium text-sub">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pw" className="text-[12px] font-medium text-sub">Password</label>
          <input id="pw" type="password" required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === 'signup' && <p className="mt-1 text-[11px] text-sub">At least 6 characters.</p>}
        </div>
        {msg && <Notice tone={msg.tone} icon={msg.tone === 'green' ? CheckCircle2 : AlertCircle}>{msg.text}</Notice>}
        <button className="btn-primary h-11 w-full" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
        <div className="flex justify-between text-[13px]">
          <button type="button" className="font-semibold text-brand" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMsg(null) }}>
            {mode === 'signup' ? 'I already have an account' : 'Create an account'}
          </button>
          {mode === 'signin' && <button type="button" className="text-sub hover:text-ink" onClick={forgot}>Forgot password</button>}
        </div>
      </form>
      <p className="mt-3 text-center text-[12px] text-sub">When you sign in, the newest progress (this device or the cloud) is kept.</p>
    </div>
  )
}

function friendly(m = '') {
  if (/invalid login/i.test(m)) return 'Wrong email or password.'
  if (/email not confirmed/i.test(m)) return 'Please confirm your email first. Check your inbox.'
  if (/already registered/i.test(m)) return 'That email already has an account. Sign in instead.'
  if (/fetch|network/i.test(m)) return 'No internet connection. Your progress is still saved on this device.'
  if (/relation .* does not exist/i.test(m)) return 'The database tables are missing. Run supabase/schema.sql in your Supabase project.'
  return m || 'Something went wrong.'
}
