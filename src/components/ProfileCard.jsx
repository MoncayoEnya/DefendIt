import { useEffect, useRef } from 'react'
import { Award, CalendarDays, GraduationCap, Keyboard, Pencil, School, Users, X } from 'lucide-react'
import { Avatar } from './Layout.jsx'
import { BADGES } from '../lib/badges.js'
import { levelInfo } from '../lib/storage.js'

// A classmate's profile, opened from the leaderboard. Bottom sheet on phones, centered card on computers.
export default function ProfileCard({ row, rank, mine, onClose, onEdit }) {
  const ref = useRef()
  const lv = levelInfo(row.xp || 0)
  const earned = (row.badge_ids || []).map((id) => BADGES.find((b) => b.id === id)).filter(Boolean)

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    ref.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = prev }
  }, [onClose])

  const stats = [
    [Award, 'XP', (row.xp || 0).toLocaleString()],
    [CalendarDays, 'Streak', `${row.streak || 0} day${row.streak === 1 ? '' : 's'}`],
    [Users, 'Best panel', `${Number(row.best_panel || 0).toFixed(1)} / 10`],
    [Keyboard, 'Best typing', (row.best_typing || 0).toLocaleString()],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pc-name"
        className="fade-up max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 pb-8 outline-none sm:max-w-md sm:rounded-2xl sm:pb-5 focus:outline-none focus-visible:outline-none">
        <div className="flex justify-end">
          <button className="grid h-9 w-9 place-items-center rounded-md text-sub hover:bg-bg" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="-mt-4 flex flex-col items-center text-center">
          <Avatar name={row.full_name || row.display_name} photo={row.photo} size={84} />
          <h2 id="pc-name" className="mt-3 text-[20px] font-bold leading-tight">{row.full_name || row.display_name}</h2>
          {row.full_name && row.full_name !== row.display_name && <p className="text-[13px] text-sub">Goes by {row.display_name}</p>}
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[12px] font-semibold text-brand">
            Rank {rank} in class <span className="opacity-50">|</span> Level {lv.level} {lv.name}
          </p>
          {(row.course || row.school) && (
            <div className="mt-3 space-y-1 text-[13px] text-ink-2">
              {row.course && <p className="flex items-center justify-center gap-1.5"><GraduationCap size={15} className="text-sub" aria-hidden />{row.course}</p>}
              {row.school && <p className="flex items-center justify-center gap-1.5"><School size={15} className="text-sub" aria-hidden />{row.school}</p>}
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-1 flex justify-between text-[12px] text-sub"><span>Level progress</span><span>{lv.next ? `${lv.next.xp - (row.xp || 0)} XP to ${lv.next.name}` : 'Highest level'}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-track"><div className="h-full rounded-full bg-brand-2" style={{ width: `${lv.pct * 100}%` }} /></div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {stats.map(([Icon, label, v]) => (
            <div key={label} className="rounded-lg border border-line p-3">
              <div className="flex items-center gap-1.5 text-[12px] text-sub"><Icon size={14} aria-hidden />{label}</div>
              <div className="mt-0.5 text-[17px] font-bold">{v}</div>
            </div>
          ))}
        </div>

        <h3 className="mb-2 mt-5 text-[14px] font-semibold">Badges <span className="font-normal text-sub">{earned.length || row.badges || 0}</span></h3>
        {earned.length ? (
          <div className="flex flex-wrap gap-2">
            {earned.map((b) => (
              <span key={b.id} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12px] font-medium" title={b.desc}>
                <b.icon size={14} className="text-brand" aria-hidden />{b.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-sub">{row.badges ? `${row.badges} earned` : 'No badges yet.'}</p>
        )}

        {mine && (
          <button className="btn-ghost mt-6 w-full" onClick={onEdit}><Pencil size={15} /> Edit my profile</button>
        )}
      </div>
    </div>
  )
}
