import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Info } from 'lucide-react'

export function CircularProgress({ value, size = 128, stroke = 12, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label || `${value}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-track)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke="var(--color-brand)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(value, 100) / 100)}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-bold tracking-tight" style={{ fontSize: size * 0.22 }}>{value}%</span>
      </div>
    </div>
  )
}

export function ProgressBar({ value, color = 'bg-brand-2', className = 'h-1.5' }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-track ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
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

export function PageHeader({ eyebrow, title, desc, right }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-[22px] font-bold leading-tight tracking-tight md:text-[28px]">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-[13px] text-sub md:text-[14px]">{desc}</p>}
      </div>
      {right}
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
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist">
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
