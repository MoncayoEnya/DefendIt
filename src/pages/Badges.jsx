import { Lock } from 'lucide-react'
import { PageHeader, ProgressBar } from '../components/ui.jsx'
import { badgeStatus } from '../lib/badges.js'

export default function Badges({ state }) {
  const list = badgeStatus(state)
  const earned = list.filter((b) => b.done).length
  return (
    <div>
      <PageHeader eyebrow="Badges" title="Your achievements" desc={`${earned} of ${list.length} earned. Badges come from real practice, so each one means something.`} />
      <ProgressBar value={(earned / list.length) * 100} className="mb-5 h-2" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((b) => (
          <div key={b.id} className={`card flex gap-3 p-4 ${b.done ? '' : 'bg-card/60'}`}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${b.done ? 'bg-brand text-white' : 'bg-track text-sub'}`}>
              {b.done ? <b.icon size={20} strokeWidth={1.75} aria-hidden /> : <Lock size={17} strokeWidth={1.75} aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`text-[14px] font-semibold ${b.done ? '' : 'text-sub'}`}>{b.name}</div>
              <div className="text-[12px] leading-snug text-sub">{b.desc}</div>
              {b.done ? (
                <div className="mt-1.5 text-[11px] font-medium text-brand">{b.earnedAt ? `Earned ${new Date(b.earnedAt).toLocaleDateString()}` : 'Earned'}</div>
              ) : b.goal > 1 ? (
                <div className="mt-2">
                  <ProgressBar value={(b.value / b.goal) * 100} className="h-1" />
                  <div className="mt-1 text-[11px] text-sub">{b.value.toLocaleString()} / {b.goal.toLocaleString()}</div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
