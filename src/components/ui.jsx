import { useEffect, useRef, useState } from 'react'
import {
  Award, CalendarDays, ChevronRight, ClipboardList, Cloud, Info, Keyboard, LayoutGrid, Layers, Link2, ListOrdered, MessageSquareText,
  Presentation, Printer, Settings, Swords, Timer, UserRound, Users, UsersRound, Wind,
} from 'lucide-react'

const calm = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Counts from the last shown number to the new one, so progress feels earned.
export function useCountUp(target, ms = 700) {
  const [shown, setShown] = useState(calm() ? target : 0)
  const from = useRef(shown)
  useEffect(() => {
    if (calm()) { setShown(target); return }
    const start = performance.now()
    const a = from.current
    let raf
    const step = (t) => {
      const k = Math.min(1, (t - start) / ms)
      const v = Math.round(a + (target - a) * (1 - (1 - k) ** 3))
      setShown(v)
      from.current = v
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return shown
}

// Value that starts at 0 and moves to the real number right after the first paint.
function useGrow(value) {
  const [v, setV] = useState(calm() ? value : 0)
  useEffect(() => { const id = requestAnimationFrame(() => setV(value)); return () => cancelAnimationFrame(id) }, [value])
  return v
}

export function CircularProgress({ value, size = 128, stroke = 12, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const grown = useGrow(value)
  const num = useCountUp(value, 900)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label || `${value}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-track)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke="var(--color-brand)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(grown, 100) / 100)}
          style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-bold tracking-tight tabular-nums" style={{ fontSize: size * 0.22 }}>{num}%</span>
      </div>
    </div>
  )
}

export function ProgressBar({ value, color = 'bg-brand-2', className = 'h-1.5' }) {
  const grown = useGrow(value)
  return (
    <div className={`w-full overflow-hidden rounded-full bg-track ${className}`}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(grown, 100))}%`, transition: 'width .8s cubic-bezier(.2,.7,.2,1)' }} />
    </div>
  )
}

export function MetricRow({ label, value, color, compact }) {
  return (
    <div className={`grid items-center gap-3 ${compact ? 'grid-cols-[1fr_auto] gap-y-1' : 'grid-cols-[104px_1fr_36px]'}`}>
      <span className={`${compact ? 'text-[11px]' : 'text-[13px]'} text-ink`}>{label}</span>
      {compact && <span className="text-right text-[11px] font-semibold">{value}%</span>}
      <div className={compact ? 'col-span-2' : ''}><ProgressBar value={value} color={color} className={compact ? 'h-1.5' : 'h-2'} /></div>
      {!compact && <span className="text-right text-[13px] font-semibold">{value}%</span>}
    </div>
  )
}

// Every part of the app has its own icon, color and background pattern:
// Learn = blue dots, Practice = green rings, Prepare = yellow steps, Panel = red rings, You = soft circles.
const AREAS = {
  learn: { tone: 'bg-blue-soft text-blue', motif: 'dots' },
  practice: { tone: 'bg-brand-soft text-brand', motif: 'rings' },
  panel: { tone: 'bg-red-soft text-red-ink', motif: 'rings' },
  prepare: { tone: 'bg-yellow-soft text-yellow-ink', motif: 'steps' },
  you: { tone: 'bg-brand-soft text-brand', motif: 'circles' },
  plain: { tone: 'bg-bg text-ink-2', motif: null },
}
const PAGE_LOOK = [
  [/flashcard/i, Layers, 'learn'], [/match/i, Link2, 'learn'], [/explain/i, MessageSquareText, 'learn'], [/reviewer/i, Printer, 'learn'],
  [/typing/i, Keyboard, 'practice'], [/^practice$/i, Swords, 'practice'], [/group/i, UsersRound, 'practice'], [/daily/i, Timer, 'practice'],
  [/panel/i, Users, 'panel'],
  [/plan|countdown/i, CalendarDays, 'prepare'], [/slide/i, Presentation, 'prepare'], [/confidence/i, Wind, 'prepare'], [/evaluation/i, ClipboardList, 'prepare'],
  [/badge/i, Award, 'you'], [/leaderboard/i, ListOrdered, 'you'], [/account/i, Cloud, 'you'], [/profile/i, UserRound, 'you'],
  [/settings/i, Settings, 'plain'], [/more/i, LayoutGrid, 'plain'],
]

function Motif({ kind }) {
  if (!kind) return null
  const common = 'motif pointer-events-none absolute -right-20 -top-6 h-[150px] w-[220px] opacity-40 [mask-image:linear-gradient(to_left,#000_35%,transparent_85%)] sm:-right-6 md:right-0 md:opacity-50'
  if (kind === 'dots') return (
    <svg className={common} viewBox="0 0 220 150" aria-hidden>
      {Array.from({ length: 7 }, (_, r) => Array.from({ length: 10 }, (_, c) => (
        <circle key={`${r}-${c}`} cx={14 + c * 22} cy={12 + r * 22} r={2.2} fill="currentColor" opacity={(c + r) / 20 + 0.08} />
      )))}
    </svg>
  )
  if (kind === 'rings') return (
    <svg className={common} viewBox="0 0 220 150" aria-hidden>
      {[18, 38, 58, 78, 98].map((r, i) => <circle key={r} cx="170" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5 - i * 0.08} />)}
    </svg>
  )
  if (kind === 'steps') return (
    <svg className={common} viewBox="0 0 220 150" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={70 + i * 30} y={110 - i * 22} width="24" height={22 + i * 22} rx="5" fill="currentColor" opacity={0.1 + i * 0.07} />)}
    </svg>
  )
  return (
    <svg className={common} viewBox="0 0 220 150" aria-hidden>
      <circle cx="150" cy="50" r="46" fill="currentColor" opacity=".12" />
      <circle cx="190" cy="90" r="34" fill="currentColor" opacity=".16" />
      <circle cx="118" cy="98" r="22" fill="currentColor" opacity=".1" />
    </svg>
  )
}

export function PageHeader({ eyebrow, title, desc, right, icon }) {
  const look = PAGE_LOOK.find(([re]) => re.test(eyebrow || ''))
  const Icon = icon || look?.[1]
  const area = AREAS[look?.[2] || 'plain']
  return (
    <div className="relative mb-5">
      <div className={`absolute inset-0 overflow-hidden ${area.tone.split(' ').find((c) => c.startsWith('text-'))}`} aria-hidden><Motif kind={area.motif} /></div>
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon && <span className={`pop-in mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl ${area.tone}`}><Icon size={22} strokeWidth={1.8} aria-hidden /></span>}
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h1 className="text-[22px] font-bold leading-tight tracking-tight md:text-[28px]">{title}</h1>
            {desc && <p className="mt-1 max-w-2xl text-[13px] text-sub md:text-[14px]">{desc}</p>}
          </div>
        </div>
        {right}
      </div>
    </div>
  )
}

export function SectionTitle({ children, right }) {
  return (
    <div className="mb-2.5 mt-6 flex items-center justify-between gap-2">
      <h2 className="text-[15px] font-semibold md:text-[17px]">{children}</h2>
      {right}
    </div>
  )
}

export function IconBox({ icon: Icon, tone = 'brand', size = 'md' }) {
  const tones = {
    brand: 'bg-brand-soft text-brand',
    blue: 'bg-blue-soft text-blue',
    yellow: 'bg-yellow-soft text-yellow-ink',
    red: 'bg-red-soft text-red',
    plain: 'text-ink',
  }
  const s = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <span className={`grid shrink-0 place-items-center rounded-md ${s} ${tones[tone]}`}>
      <Icon size={size === 'sm' ? 17 : 20} strokeWidth={1.75} aria-hidden />
    </span>
  )
}

export function ListLink({ icon, title, meta, onClick, tone = 'plain', right }) {
  return (
    <button onClick={onClick} className="card-link flex w-full items-center gap-3.5 p-4 text-left">
      <IconBox icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{title}</span>
        {meta && <span className="block truncate text-[12px] text-sub">{meta}</span>}
      </span>
      {right}
      <ChevronRight size={18} className="shrink-0 text-sub" aria-hidden />
    </button>
  )
}

export function Notice({ tone = 'yellow', icon: Icon, children }) {
  const tones = {
    yellow: 'bg-yellow-soft border-yellow/50 text-yellow-ink',
    red: 'bg-red-soft border-red/40 text-red-ink',
    green: 'bg-brand-soft border-brand-2/30 text-brand',
    blue: 'bg-blue-soft border-blue/30 text-blue',
  }
  return (
    <div className={`flex gap-2.5 rounded-md border p-3 text-[13px] ${tones[tone]}`}>
      {Icon && <Icon size={17} strokeWidth={1.75} className="mt-px shrink-0" aria-hidden />}
      <div>{children}</div>
    </div>
  )
}

export function Checkbox({ checked, onChange, label, sub, strike }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-3 rounded-md py-1.5">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-2 ${checked ? 'border-brand bg-brand' : 'border-line-strong bg-card'}`}>
        {checked && <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <span className="min-w-0">
        <span className={`block text-[13px] ${checked && strike ? 'text-sub line-through' : ''}`}>{label}</span>
        {sub && <span className="block text-[12px] text-sub">{sub}</span>}
      </span>
    </label>
  )
}

export function BackLink({ onClick, children = 'Back' }) {
  return (
    <button onClick={onClick} className="mb-3 inline-flex h-8 items-center gap-1 text-[13px] font-medium text-sub hover:text-ink">
      <ChevronRight size={16} className="rotate-180" aria-hidden /> {children}
    </button>
  )
}

// Small "what is this?" button that shows one short sentence when tapped.
export function Hint({ text, align = 'left', label = 'What is this?' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <span className="relative inline-flex align-middle" ref={ref}>
      <button type="button" aria-label={label} aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="grid h-6 w-6 place-items-center rounded-full text-sub hover:bg-bg hover:text-ink">
        <Info size={14} strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <span role="tooltip" className={`fade-up absolute top-7 z-30 w-56 rounded-md border border-line bg-card p-2.5 text-left text-[12px] font-normal normal-case leading-snug tracking-normal text-ink-2 shadow-[0_8px_24px_rgba(0,0,0,.12)] ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {text}
        </span>
      )}
    </span>
  )
}

// Segmented tabs (scroll sideways on small phones).
// Slides the tapped (or selected) item to the middle of a swipe row.
export function centerInRow(el) {
  const row = el?.closest('.swipe-row')
  if (!row || row.scrollWidth <= row.clientWidth) return
  const left = el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2
  row.scrollTo({ left: Math.max(0, left), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
export const centerOnTap = (e) => centerInRow(e.target.closest('button'))

export function Tabs({ tabs, value, onChange }) {
  const ref = useRef()
  useEffect(() => { centerInRow(ref.current?.querySelector('[aria-selected="true"]')) }, [value])
  return (
    <div ref={ref} className="swipe-row -mx-4 mb-4 px-4 md:mx-0 md:px-0" role="tablist">
      <div className="inline-flex min-w-full gap-1 rounded-lg border border-line bg-card p-1 md:min-w-0">
        {tabs.map(({ id, label, icon: Icon, count }) => {
          const on = value === id
          return (
            <button key={id} role="tab" aria-selected={on} onClick={() => onChange(id)}
              className={`flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition-colors md:flex-none ${on ? 'bg-brand text-white' : 'text-sub hover:bg-bg hover:text-ink'}`}>
              {Icon && <Icon size={15} strokeWidth={1.9} aria-hidden />}
              {label}
              {count != null && <span className={`text-[11px] ${on ? 'opacity-80' : 'text-sub'}`}>{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
