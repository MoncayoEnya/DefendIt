import { useEffect, useRef, useState } from 'react'
import { Award, BookOpen, Menu, Moon, Sun, Check, ChevronDown, Cloud, CloudOff, House, Layers, ListOrdered, LogOut, MoreHorizontal, UserRound, Settings, Trophy, Users } from 'lucide-react'
import { LogoMark } from './Logo.jsx'
import ResetDialog from './ResetDialog.jsx'
import { levelInfo } from '../lib/storage.js'
import { useCountUp } from './ui.jsx'

const DESKTOP_NAV = [
  { id: 'overview', label: 'Overview', match: ['overview', 'plan'] },
  { id: 'guide', label: 'Study guide', match: ['guide', 'reviewer', 'read'] },
  { id: 'practice', label: 'Practice', match: ['practice', 'cards', 'typing', 'panel', 'match', 'group', 'leaderboard', 'daily', 'explain', 'slides'] },
  { id: 'confidence', label: 'Confidence', match: ['confidence'] },
]

const MOBILE_NAV = [
  { id: 'overview', label: 'Overview', icon: House, match: ['overview'] },
  { id: 'guide', label: 'Guide', icon: BookOpen, match: ['guide', 'reviewer', 'read'] },
  { id: 'cards', label: 'Cards', icon: Layers, match: ['cards'] },
  { id: 'panel', label: 'Panel', icon: Users, match: ['panel'] },
  { id: 'more', label: 'More', icon: MoreHorizontal, match: ['more', 'confidence', 'settings', 'practice', 'typing', 'match', 'group', 'badges', 'account', 'leaderboard', 'daily', 'explain', 'slides', 'plan', 'survey', 'evaluation', 'profile'] },
]

function Brand({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2" aria-label="DefendIt home">
      <LogoMark size={26} />
      <span className="text-[17px] font-bold tracking-tight">DefendIt</span>
    </button>
  )
}

export function Avatar({ name, photo, size = 32 }) {
  const initials = (name || 'S').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  if (photo) return <img src={photo} alt="" referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden>
      {initials}
    </span>
  )
}

function ProfileMenu({ state, update, go, compact, cloud }) {
  const [open, setOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const ref = useRef()
  const lv = levelInfo(state.profile.xp)
  const display = state.profile.name || 'Student'

  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {resetOpen && <ResetDialog user={cloud?.user} onClose={() => setResetOpen(false)} />}
      {compact ? (
        <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-md text-ink hover:bg-bg">
          <Menu size={22} strokeWidth={1.75} aria-hidden />
        </button>
      ) : (
        <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" className="flex h-10 items-center gap-2 rounded-md pl-1 pr-1.5 hover:bg-bg">
          <Avatar name={display} photo={state.profile.photo} size={32} />
          <span className="max-w-28 truncate text-[13px] font-medium">{display}</span>
          <ChevronDown size={15} className="text-sub" aria-hidden />
        </button>
      )}
      {open && (
        <div role="menu" className="fade-up absolute right-0 top-12 z-50 w-72 rounded-lg border border-line bg-card p-2 shadow-[0_8px_24px_rgba(21,27,34,.08)]">
          <div className="flex items-center gap-3 p-2">
            <Avatar name={display} photo={state.profile.photo} size={40} />
            <div className="min-w-0 flex-1">
              <button className="block w-full text-left" onClick={() => { go('profile'); setOpen(false) }}>
                <div className="truncate text-[14px] font-semibold">{display}</div>
                <div className="text-[12px] text-sub">Level {lv.level} · {lv.name}</div>
              </button>
            </div>
          </div>
          <div className="px-2 pb-2">
            <div className="mb-1 flex justify-between text-[11px] text-sub"><span>{state.profile.xp} XP</span><span>{lv.next ? `${lv.next.xp} XP for ${lv.next.name}` : 'Max level'}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-track"><div className="h-full rounded-full bg-brand-2" style={{ width: `${lv.pct * 100}%` }} /></div>
          </div>
          <div className="border-t border-line pt-1">
            <MenuItem icon={UserRound} onClick={() => { go('profile'); setOpen(false) }}>Edit profile</MenuItem>
            <MenuItem icon={Award} onClick={() => { go('badges'); setOpen(false) }}>Badges · {Object.keys(state.profile.badges || {}).length} earned</MenuItem>
            <MenuItem icon={ListOrdered} onClick={() => { go('leaderboard'); setOpen(false) }}>Class leaderboard</MenuItem>
            <MenuItem icon={cloud?.user ? Cloud : CloudOff} onClick={() => { go('account'); setOpen(false) }}>{cloud?.user ? `Account · ${cloud.user.email}` : 'Sign in to back up progress'}</MenuItem>
            <MenuItem icon={Trophy} onClick={() => { go('settings'); setOpen(false) }}>Levels and streak · {state.profile.streak} day{state.profile.streak === 1 ? '' : 's'}</MenuItem>
            <MenuItem icon={document.documentElement.dataset.theme === 'dark' ? Sun : Moon} onClick={() => update((s) => ({ ...s, settings: { ...s.settings, theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' } }))}>
              {document.documentElement.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </MenuItem>
            <MenuItem icon={Settings} onClick={() => { go('settings'); setOpen(false) }}>Settings and AI key</MenuItem>
            <MenuItem icon={LogOut} danger onClick={() => { setResetOpen(true); setOpen(false) }}>Reset all data</MenuItem>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon: Icon, children, onClick, danger }) {
  return (
    <button role="menuitem" onClick={onClick} className={`flex h-10 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px] hover:bg-bg ${danger ? 'text-red' : ''}`}>
      <Icon size={16} strokeWidth={1.75} aria-hidden /> {children}
    </button>
  )
}

export function DesktopHeader({ tab, go, state, update, cloud }) {
  return (
    <header className="print-hide sticky top-0 z-40 hidden border-b border-line bg-card md:block">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center px-6 lg:px-8">
        <div className="flex-1"><Brand onClick={() => go('overview')} /></div>
        <nav className="flex h-full items-stretch gap-1" aria-label="Main">
          {DESKTOP_NAV.map((n) => {
            const active = n.match.includes(tab)
            return (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative px-4 text-[13px] font-medium transition-colors ${active ? 'text-ink' : 'text-sub hover:text-ink'}`}
              >
                {n.label}
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand" />}
              </button>
            )
          })}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-4">
          <XpCount xp={state.profile.xp} className="rounded-full px-2.5 py-1 text-[13px] font-semibold" />
          <span className="h-6 w-px bg-line" />
          <ProfileMenu state={state} update={update} go={go} cloud={cloud} />
        </div>
      </div>
    </header>
  )
}

export function MobileHeader({ go, state, update, cloud }) {
  return (
    <header className="print-hide sticky top-0 z-40 border-b border-line bg-card md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Brand onClick={() => go('overview')} />
        <div className="flex items-center gap-1.5">
          <button onClick={() => go('badges')} className="rounded-full transition-transform active:scale-95" aria-label={`${state.profile.xp} XP, view badges`}>
            <XpCount xp={state.profile.xp} className="block h-8 rounded-full bg-brand-soft px-3 text-[13px] font-semibold leading-8 text-brand" />
          </button>
          <ProfileMenu state={state} update={update} go={go} compact cloud={cloud} />
        </div>
      </div>
    </header>
  )
}

export function BottomNavigation({ tab, go }) {
  return (
    <nav className="print-hide pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card md:hidden" aria-label="Main">
      <div className="grid h-16 grid-cols-5">
        {MOBILE_NAV.map(({ id, label, icon: Icon, match }) => {
          const active = match.includes(tab)
          return (
            <button key={id} onClick={() => go(id)} aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-95 ${active ? 'text-brand' : 'text-sub'}`}>
              <span className="relative grid h-7 w-14 place-items-center">
                {active && <span className="nav-pill absolute inset-0 rounded-full bg-brand-soft" aria-hidden />}
                <Icon key={active ? 'on' : 'off'} size={21} strokeWidth={active ? 2.1 : 1.75} className={`relative ${active ? 'nav-bump' : ''}`} aria-hidden />
              </span>
              <span className={active ? 'font-semibold' : ''}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function Toast({ toast, go }) {
  if (!toast) return null
  return (
    <div role="status" data-toast onClick={() => toast.to && go?.(toast.to)} className={`${toast.to ? 'cursor-pointer ' : ''}print-hide toast-in fixed left-1/2 top-[72px] z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-md border border-brand-2/30 bg-card px-4 py-2.5 text-[13px] font-semibold text-brand shadow-[0_8px_24px_rgba(21,27,34,.10)]`}>
      {toast.to === 'badges' ? <Award size={16} aria-hidden /> : toast.big ? <Trophy size={16} aria-hidden /> : <Check size={16} aria-hidden />}
      {toast.text}
    </div>
  )
}

// XP that counts up and glows when you earn points
function XpCount({ xp, className }) {
  const shown = useCountUp(xp, 800)
  const [glow, setGlow] = useState(0)
  const last = useRef(xp)
  useEffect(() => { if (xp > last.current) setGlow((g) => g + 1); last.current = xp }, [xp])
  return <span key={glow} className={`tabular-nums ${glow ? 'xp-glow' : ''} ${className}`}>{shown.toLocaleString()} XP</span>
}
