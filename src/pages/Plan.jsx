import { useState } from 'react'
import { CalendarDays, Check, ChevronRight, Circle, X } from 'lucide-react'
import { Notice, PageHeader, ProgressBar } from '../components/ui.jsx'
import { metricValue, taskDone } from '../lib/activity.js'
import { uiState } from '../lib/chapters.js'
import { buildPlan, daysUntil, localToday, PHASES } from '../lib/plan.js'

const fmt = (iso, opts) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', opts)

export default function Plan({ state, pack, update, go }) {
  const [date, setDate] = useState(pack.defenseDate || '')
  const [showAll, setShowAll] = useState(false)
  const saved = pack.defenseDate
  const n = daysUntil(saved)
  const plan = saved ? buildPlan(state, pack, saved) : []
  const todayIso = localToday()

  function save(e) {
    e.preventDefault()
    if (!date) return
    update((s) => {
      s.packs.find((p) => p.id === pack.id).defenseDate = date
      return s
    })
  }

  function clear() {
    update((s) => {
      delete s.packs.find((p) => p.id === pack.id).defenseDate
      return s
    })
    setDate('')
  }

  // phase ranges for the timeline
  const ranges = []
  for (const d of plan) {
    const last = ranges[ranges.length - 1]
    if (last && last.phase === d.phase) last.to = d.date
    else ranges.push({ phase: d.phase, from: d.date, to: d.date, count: 0 })
    ranges[ranges.length - 1].count++
  }

  const visible = showAll ? plan : plan.slice(0, 14)

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Prep plan" title="Defense countdown" desc="Set your defense date and follow a day-by-day plan. Each day's tasks appear in Today's focus and tick themselves off as you practice." />

      <section className="card grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <form onSubmit={save} className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="ddate" className="text-[12px] font-medium text-sub">Defense date</label>
            <input id="ddate" type="date" min={todayIso} value={date} onChange={(e) => setDate(e.target.value)} className="input mt-1 !w-48" />
          </div>
          <button className="btn-primary" disabled={!date || date === saved}>{saved ? 'Update date' : 'Build my plan'}</button>
          {saved && <button type="button" className="btn-ghost" onClick={clear}>Remove</button>}
        </form>
        {saved && n !== null && (
          <div className="flex items-center gap-3 md:justify-end">
            <CalendarDays size={22} strokeWidth={1.75} className="text-brand" aria-hidden />
            <div>
              <div className="text-[28px] font-bold leading-none">{n < 0 ? 'Done' : n === 0 ? 'Today' : n}</div>
              <div className="text-[12px] text-sub">{n < 0 ? 'Your defense date has passed' : n === 0 ? 'is your defense. You got this.' : `day${n === 1 ? '' : 's'} to go · ${fmt(saved, { weekday: 'short', month: 'short', day: 'numeric' })}`}</div>
            </div>
          </div>
        )}
      </section>

      {saved && n < 0 && (
        <div className="mt-4"><Notice tone="green" icon={Check}>Congratulations on reaching your defense. Set a new date if you have a re-defense or final presentation.</Notice></div>
      )}

      {plan.length > 0 && (
        <>
          <section className="mt-4 card p-5">
            <h2 className="mb-3 text-[15px] font-semibold">Your phases</h2>
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {ranges.map((r) => <div key={r.phase} className={PHASES[r.phase].color} style={{ width: `${(r.count / plan.length) * 100}%` }} />)}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {ranges.map((r) => (
                <div key={r.phase}>
                  <div className="flex items-center gap-2 text-[13px] font-semibold"><span className={`h-2.5 w-2.5 rounded-full ${PHASES[r.phase].color}`} />{PHASES[r.phase].name}</div>
                  <div className="text-[12px] text-sub">{r.from === r.to ? fmt(r.from, { month: 'short', day: 'numeric' }) : `${fmt(r.from, { month: 'short', day: 'numeric' })} to ${fmt(r.to, { month: 'short', day: 'numeric' })}`}</div>
                  <div className="text-[12px] leading-snug text-sub">{PHASES[r.phase].desc}</div>
                </div>
              ))}
            </div>
          </section>

          <h2 className="mb-2.5 mt-6 text-[15px] font-semibold md:text-[17px]">Day by day</h2>
          <div className="space-y-2.5">
            {visible.map((d) => {
              const isToday = d.date === todayIso
              const past = d.date < todayIso
              const done = d.tasks.filter((t) => taskDone(state, t, d.date)).length
              return (
                <section key={d.date} className={`card p-4 ${isToday ? '!border-brand-2/60 ring-2 ring-brand-soft' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold">{fmt(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        {isToday && <span className="tag !border-brand-2/30 !bg-brand-soft !text-brand">Today</span>}
                        <span className="tag">{PHASES[d.phase].name}</span>
                      </div>
                      <h3 className="mt-1 text-[14px] font-medium">{d.title}</h3>
                    </div>
                    <span className="text-[12px] text-sub">{d.remaining === 0 ? 'Defense' : `${d.remaining} day${d.remaining === 1 ? '' : 's'} left`} · {done}/{d.tasks.length}</span>
                  </div>
                  <ProgressBar value={(done / d.tasks.length) * 100} className="my-3 h-1" />
                  <ul className="space-y-1">
                    {d.tasks.map((t) => {
                      const ok = taskDone(state, t, d.date)
                      const missed = past && !ok
                      return (
                        <li key={t.id}>
                          <button
                            className="flex min-h-9 w-full items-center gap-2.5 rounded-md px-1 text-left hover:bg-bg disabled:hover:bg-transparent"
                            disabled={!isToday}
                            onClick={() => { if (t.chapter != null) uiState.openChapter = t.chapter; go(t.to) }}
                          >
                            {ok ? <Check size={16} className="shrink-0 text-brand" aria-label="Done" /> : missed ? <X size={16} className="shrink-0 text-red" aria-label="Missed" /> : <Circle size={15} className="shrink-0 text-line-strong" aria-hidden />}
                            <span className={`flex-1 text-[13px] ${ok ? 'text-sub line-through' : ''}`}>{t.label}</span>
                            {isToday && !ok && t.goal > 1 && <span className="text-[12px] text-sub">{Math.min(metricValue(state, t, d.date), t.goal)}/{t.goal}</span>}
                            {isToday && !ok && <ChevronRight size={15} className="text-sub" aria-hidden />}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
          {plan.length > 14 && (
            <button className="btn-ghost mt-3 w-full" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer days' : `Show all ${plan.length} days`}</button>
          )}
        </>
      )}
    </div>
  )
}
