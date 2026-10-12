import { AlertCircle, BookOpen, ChevronRight, FileText, FileUp, Keyboard, Layers, Loader2, Users } from 'lucide-react'
import { CircularProgress, Checkbox, MetricRow, Notice } from './ui.jsx'
import { FOCUS_TASKS, focusDone, packProgress, readiness } from '../lib/progress.js'
import { today } from '../lib/storage.js'
import { uiState, weakestChapter } from '../lib/chapters.js'

export function WelcomeSection({ name, mobile }) {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
  const greet = name ? `Make today count, ${name}.` : 'Make today count.'
  return (
    <section className="flex items-start justify-between gap-4">
      <div>
        <p className="eyebrow mb-1.5">Your defense journey</p>
        <h1 className="text-[23px] font-bold leading-tight tracking-tight md:text-[30px]">
          {mobile ? 'Walk in ready.' : 'A little practice. A lot more confidence.'}
        </h1>
        <p className="mt-1 text-[13px] text-sub md:text-[14px]">{greet}</p>
      </div>
      {!mobile && <p className="eyebrow shrink-0 pt-0.5 !text-ink">{date}</p>}
    </section>
  )
}

export function ThesisUploadCard({ uploader, hasPacks, hasDemo, mobile }) {
  const { pick, loadDemo, busy, error } = uploader
  const title = hasPacks ? 'Add another thesis' : 'Start with your thesis'
  const desc = hasPacks ? 'Upload a new version or another paper to practice with.' : 'Turn your research into your next practice session.'

  if (busy) {
    return (
      <div className="card flex min-h-[140px] flex-col items-center justify-center gap-3 p-6 text-center" aria-live="polite">
        <Loader2 size={26} className="animate-spin text-brand" aria-hidden />
        <p className="text-[14px] font-semibold">{busy}</p>
        <p className="text-[12px] text-sub">Your file stays on this device.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {mobile ? (
        <div className="card p-4">
          <div className="flex items-start gap-3.5">
            <FileUp size={26} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink" aria-hidden />
            <div>
              <h2 className="text-[14px] font-semibold">{title}</h2>
              <p className="text-[12px] text-sub">{desc}</p>
            </div>
          </div>
          <button className="btn-primary mt-4 h-11 w-full" onClick={pick}>Upload thesis</button>
          {!hasDemo && <button className="mt-1 h-10 w-full text-[13px] font-semibold text-brand" onClick={loadDemo}>Use sample thesis</button>}
        </div>
      ) : (
        <div className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-[#cdd6dc] bg-white px-6 py-5 text-center">
          <FileUp size={28} strokeWidth={1.5} className="text-ink" aria-hidden />
          <h2 className="mt-2 text-[16px] font-semibold">{title}</h2>
          <p className="text-[13px] text-sub">{desc}</p>
          <div className="mt-3.5 flex gap-2.5">
            <button className="btn-primary min-w-[128px]" onClick={pick} title="PDF, Word (.docx) or .txt">Upload thesis</button>
            {!hasDemo && <button className="btn-outline min-w-[128px]" onClick={loadDemo}>Use sample thesis</button>}
          </div>
        </div>
      )}
      {error && <Notice tone="red" icon={AlertCircle}>{error}</Notice>}
    </div>
  )
}

export function sessionList(state, pack) {
  const p = packProgress(state, pack)
  const none = 'Needs a thesis'
  return [
    { id: 'guide', icon: BookOpen, title: 'Study guide', desc: 'Turn complex research into clear notes.', progress: p ? `${p.sections.done} / ${p.sections.total} complete` : none, started: p?.sections.done > 0 },
    { id: 'cards', icon: Layers, title: 'Flashcards', desc: 'Memorize key concepts and terms.', progress: p ? `${p.terms.reviewed} / ${p.terms.total} reviewed` : none, started: p?.terms.reviewed > 0 },
    { id: 'typing', icon: Keyboard, title: 'Typing defense', desc: 'Practice recalling terms under time pressure.', progress: p ? `${Math.min(p.typing.done, p.typing.goal)} / ${p.typing.goal} sessions` : none, started: p?.typing.done > 0 },
    { id: 'panel', icon: Users, title: 'Practice panel', desc: 'Simulate a real defense with an AI panel.', progress: p ? (p.panel.sessions ? `Best score ${p.panel.best} / 10` : 'Not yet started') : none, started: p?.panel.sessions > 0 },
  ]
}

export function SessionCard({ s, go, mobile }) {
  const Icon = s.icon
  return (
    <button onClick={() => go(s.id)} className={`card-link flex w-full items-center text-left ${mobile ? 'min-h-[76px] gap-2.5 p-3' : 'gap-4 p-4'}`}>
      <Icon size={mobile ? 20 : 26} strokeWidth={1.5} className="shrink-0 self-start text-ink" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={`block font-semibold ${mobile ? 'text-[12px] leading-tight' : 'text-[14px]'}`}>{s.title}</span>
        {!mobile && <span className="mt-0.5 block text-[12px] leading-snug text-sub">{s.desc}</span>}
        <span className={`mt-1.5 block font-medium ${mobile ? 'text-[11px]' : 'text-[12px]'} ${s.started ? 'text-brand' : 'text-sub'}`}>{s.progress}</span>
      </span>
      <ChevronRight size={mobile ? 16 : 18} className="shrink-0 text-sub" aria-hidden />
    </button>
  )
}

export function ReadinessCard({ state, pack, mobile, children, go }) {
  const r = readiness(state, pack)
  const weak = pack ? weakestChapter(state, pack) : null
  const rows = [
    { label: 'Knowledge', value: r.knowledge, color: 'bg-brand-2' },
    { label: 'Practice', value: r.practice, color: 'bg-blue' },
    { label: 'Confidence', value: r.confidence, color: 'bg-yellow' },
  ]
  if (mobile) {
    return (
      <section className="card p-4">
        <h2 className="mb-3 text-[14px] font-semibold">Defense readiness</h2>
        <div className="flex items-center gap-5">
          <CircularProgress value={r.overall} size={96} stroke={10} label={`Defense readiness ${r.overall}%`} />
          <div className="flex-1 space-y-2.5">{rows.map((x) => <MetricRow key={x.label} {...x} compact />)}</div>
        </div>
        {weak && go && <WeakChapter weak={weak} go={go} />}
      </section>
    )
  }
  return (
    <section className="card p-5">
      <h2 className="text-[15px] font-semibold">Defense readiness</h2>
      <div className="my-5 flex justify-center">
        <CircularProgress value={r.overall} size={148} stroke={14} label={`Defense readiness ${r.overall}%`} />
      </div>
      <div className="space-y-3.5">{rows.map((x) => <MetricRow key={x.label} {...x} />)}</div>
      {!pack && <p className="mt-4 text-[12px] text-sub">Upload a thesis to start building your score.</p>}
      {weak && go && <WeakChapter weak={weak} go={go} />}
      {children && <div className="mt-5 border-t border-line pt-4">{children}</div>}
    </section>
  )
}

function WeakChapter({ weak, go }) {
  return (
    <button onClick={() => { uiState.openChapter = weak.index; go('guide') }}
      className="mt-4 flex w-full items-center gap-3 rounded-md border border-line bg-bg px-3 py-2.5 text-left hover:border-brand-2/40">
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-sub">Weakest chapter</span>
        <span className="block truncate text-[13px] font-semibold">{weak.title}</span>
      </span>
      <span className="text-[13px] font-semibold text-red">{weak.score}%</span>
      <ChevronRight size={16} className="text-sub" aria-hidden />
    </button>
  )
}

export function FocusChecklist({ state, update, go }) {
  const done = focusDone(state)
  function toggle(id, v) {
    update((s) => {
      const cur = s.profile.focus?.date === today() ? s.profile.focus.done || {} : {}
      return { ...s, profile: { ...s.profile, focus: { date: today(), done: { ...cur, [id]: v } } } }
    })
  }
  const count = FOCUS_TASKS.filter((t) => done[t.id]).length
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Today's focus</h2>
        <span className="text-[12px] text-sub">{count}/{FOCUS_TASKS.length}</span>
      </div>
      {FOCUS_TASKS.map((t) => (
        <div key={t.id} className="flex items-center gap-1">
          <div className="flex-1"><Checkbox checked={!!done[t.id]} onChange={(v) => toggle(t.id, v)} label={t.label} strike /></div>
          <button onClick={() => go(t.to)} className="grid h-8 w-8 place-items-center rounded-md text-sub hover:bg-bg hover:text-ink" aria-label={`Open: ${t.label}`}>
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}

export function ThesisDocumentCard({ pack, active, onOpen, onDelete }) {
  return (
    <div className={`card-link flex items-center gap-1 pr-2 ${active ? '!border-brand-2/40' : ''}`}>
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-4 p-4 text-left">
        <FileText size={26} strokeWidth={1.5} className="shrink-0 text-ink" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[14px] font-semibold leading-snug">{pack.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-sub">
            {active && <span className="tag !border-brand-2/30 !bg-brand-soft !text-brand">Active</span>}
            {pack.sample && <span className="tag">Sample</span>}
            <span>{pack.sections.length} chapters · {pack.terms.length} key terms</span>
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-sub" aria-hidden />
      </button>
      {onDelete && (
        <button onClick={onDelete} className="h-9 rounded-md px-2 text-[12px] font-medium text-sub hover:bg-red-soft hover:text-red" aria-label={`Delete ${pack.title}`}>Delete</button>
      )}
    </div>
  )
}
