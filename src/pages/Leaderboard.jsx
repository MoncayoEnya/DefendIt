import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, ChevronRight, Copy, Info, Loader2, LogIn, RefreshCw, Trophy } from 'lucide-react'
import ProfileCard from '../components/ProfileCard.jsx'
import { Avatar } from '../components/Layout.jsx'
import { IconBox, Notice, PageHeader } from '../components/ui.jsx'
import { cloudEnabled, fetchLeaderboard, leaderboardRow, leaveLeaderboard, normalizeCode, profileColumnsMissing, profileRow, pushLeaderboard } from '../lib/cloud.js'

const SORTS = [
  { id: 'xp', label: 'XP', fmt: (r) => `${r.xp.toLocaleString()} XP` },
  { id: 'best_panel', label: 'Panel', fmt: (r) => `${Number(r.best_panel).toFixed(1)} / 10` },
  { id: 'best_typing', label: 'Typing', fmt: (r) => r.best_typing.toLocaleString() },
  { id: 'streak', label: 'Streak', fmt: (r) => `${r.streak} day${r.streak === 1 ? '' : 's'}` },
]

export default function Leaderboard({ state, update, cloud, go }) {
  const code = state.profile.classCode || ''
  const [input, setInput] = useState('')
  const [rows, setRows] = useState(null)
  const [sort, setSort] = useState('xp')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [view, setView] = useState(null) // the row whose profile is open

  const load = useCallback(async () => {
    if (!cloud.user || !code) return
    setBusy(true)
    setErr('')
    try {
      await pushLeaderboard(cloud.user.id, state)
      setRows(await fetchLeaderboard(code))
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloud.user, code])

  useEffect(() => { load() }, [load])

  if (!cloudEnabled || !cloud.user) {
    return (
      <div className="max-w-xl">
        <PageHeader eyebrow="Leaderboard" title="Compete with classmates" desc="Join your class with a shared code and see who is most prepared. Only your name and scores are shared, never your thesis." />
        <section className="card flex items-center gap-3 p-5">
          <IconBox icon={LogIn} />
          <p className="flex-1 text-[13px]">{cloudEnabled ? 'Sign in to join a class leaderboard.' : 'The leaderboard needs cloud saving to be set up first.'}</p>
          <button className="btn-primary" onClick={() => go('account')}>{cloudEnabled ? 'Sign in' : 'Learn how'}</button>
        </section>
      </div>
    )
  }

  function join(e) {
    e.preventDefault()
    const c = normalizeCode(input)
    if (c.length < 3) return setErr('Class codes need at least 3 letters or numbers.')
    update((s) => ({ ...s, profile: { ...s.profile, classCode: c } }))
    setInput('')
  }

  async function leave() {
    if (!confirm(`Leave class ${code}? Your row will be removed from its leaderboard.`)) return
    await leaveLeaderboard(cloud.user.id, code).catch(() => {})
    update((s) => ({ ...s, profile: { ...s.profile, classCode: '' } }))
    setRows(null)
  }

  if (!code) {
    return (
      <div className="max-w-xl">
        <PageHeader eyebrow="Leaderboard" title="Join your class" desc="Agree on a code with your classmates, like the section and year (for example IT4A-2026). Everyone who enters the same code shares one leaderboard." />
        <form onSubmit={join} className="card flex gap-2 p-5">
          <input className="input font-mono uppercase" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Class code" aria-label="Class code" maxLength={20} />
          <button className="btn-primary shrink-0">Join</button>
        </form>
        {err && <div className="mt-3"><Notice tone="red" icon={AlertCircle}>{err}</Notice></div>}
        {!state.profile.name && <p className="mt-3 text-[12px] text-sub">Tip: <button className="font-semibold text-brand" onClick={() => go('profile')}>add your name</button> so classmates recognize you.</p>}
      </div>
    )
  }

  const me = leaderboardRow(state)
  const sorted = rows ? [...rows].sort((a, b) => Number(b[sort]) - Number(a[sort])) : []
  const fmt = SORTS.find((s) => s.id === sort).fmt

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Leaderboard"
        title={`Class ${code}`}
        desc="Scores update whenever you sync. Share the code so classmates can join."
        right={
          <div className="flex gap-2">
            <button className="btn-ghost !h-9" onClick={() => navigator.clipboard?.writeText(code)}><Copy size={15} /> Copy code</button>
            <button className="btn-ghost !h-9" onClick={load} disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Refresh</button>
          </div>
        }
      />

      <div className="mb-3 inline-flex rounded-md border border-line bg-card p-1" role="tablist">
        {SORTS.map((s) => (
          <button key={s.id} role="tab" aria-selected={sort === s.id} onClick={() => setSort(s.id)}
            className={`h-8 rounded px-3 text-[13px] font-medium ${sort === s.id ? 'bg-brand text-white' : 'text-sub hover:text-ink'}`}>{s.label}</button>
        ))}
      </div>

      {err && <div className="mb-3"><Notice tone="red" icon={AlertCircle}>{err}</Notice></div>}

      <section className="card divide-y divide-line">
        {!rows && <div className="flex items-center gap-2 p-5 text-[13px] text-sub"><Loader2 size={15} className="animate-spin" /> Loading</div>}
        {rows && !rows.length && <div className="p-5 text-[13px] text-sub">No one here yet. You will appear after your next sync.</div>}
        {sorted.map((r, i) => {
          const mine = r.user_id === cloud.user.id
          return (
            <button key={r.user_id} onClick={() => setView({ row: mine ? { ...r, ...me, ...profileRow(state) } : r, rank: i + 1, mine })} aria-label={`Open ${r.display_name}'s profile`}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg ${mine ? 'bg-brand-soft/60' : ''}`}>
              <span className={`w-6 text-center text-[13px] font-bold ${i < 3 ? 'text-brand' : 'text-sub'}`}>{i < 3 ? <Trophy size={16} className="mx-auto" aria-label={`Rank ${i + 1}`} /> : i + 1}</span>
              <Avatar name={r.full_name || r.display_name} photo={mine ? state.profile.photo : r.photo} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold">{r.display_name}{mine && <span className="ml-1.5 font-normal text-sub">(you)</span>}</div>
                <div className="truncate text-[12px] text-sub">{[r.course, `${r.badges} badge${r.badges === 1 ? '' : 's'}`, `${r.streak}-day streak`].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="text-right text-[14px] font-semibold">{fmt(mine ? { ...r, ...me } : r)}</div>
              <ChevronRight size={16} className="shrink-0 text-sub" aria-hidden />
            </button>
          )
        })}
      </section>

      <p className="mt-3 text-[12px] text-sub">Tap a name to see their profile.</p>
      {profileColumnsMissing && (
        <div className="mt-3"><Notice tone="yellow" icon={Info}>Photos, courses and badges need one more setup step: run <b>supabase/leaderboard-profile.sql</b> in Supabase.</Notice></div>
      )}
      <button className="mt-4 text-[13px] font-medium text-sub hover:text-red" onClick={leave}>Leave this class</button>
      {view && <ProfileCard row={view.row} rank={view.rank} mine={view.mine} onClose={() => setView(null)} onEdit={() => go('profile')} />}
    </div>
  )
}
