import { Keyboard, Layers, Users } from 'lucide-react'
import { IconBox, PageHeader, ProgressBar } from '../components/ui.jsx'
import { packProgress } from '../lib/progress.js'

export default function Practice({ state, pack, go }) {
  const p = packProgress(state, pack)
  const modes = [
    {
      id: 'cards', icon: Layers, tone: 'brand', title: 'Flashcards',
      desc: 'Flip or type key terms. Cards you miss return sooner through spaced repetition.',
      stat: p ? `${p.terms.mastered} of ${p.terms.total} terms mastered` : 'Needs a thesis',
      pct: p ? (p.terms.mastered / Math.max(p.terms.total, 1)) * 100 : 0, color: 'bg-brand-2',
    },
    {
      id: 'typing', icon: Keyboard, tone: 'blue', title: 'Typing defense',
      desc: 'Terms fall toward your base. Type them before they land. Every third wave shows only a definition.',
      stat: p ? `${p.typing.done} session${p.typing.done === 1 ? '' : 's'} played` : 'Needs a thesis',
      pct: p ? (Math.min(p.typing.done, 5) / 5) * 100 : 0, color: 'bg-blue',
    },
    {
      id: 'panel', icon: Users, tone: 'yellow', title: 'Practice panel',
      desc: 'Three panelists ask questions from your paper. Answer by typing or speaking and get scored.',
      stat: p?.panel.sessions ? `Best average ${p.panel.best} / 10` : 'Not yet started',
      pct: p ? p.panel.best * 10 : 0, color: 'bg-yellow',
    },
  ]
  return (
    <div>
      <PageHeader eyebrow="Practice" title="Choose how to train" desc={pack ? `Built from: ${pack.title}` : 'Upload a thesis to unlock practice modes.'} />
      <div className="grid gap-3 md:grid-cols-3">
        {modes.map((m) => (
          <button key={m.id} onClick={() => go(m.id)} className="card-link flex flex-col p-5 text-left">
            <IconBox icon={m.icon} tone={m.tone} />
            <h2 className="mt-3 text-[15px] font-semibold">{m.title}</h2>
            <p className="mt-1 flex-1 text-[13px] leading-snug text-sub">{m.desc}</p>
            <div className="mt-4 w-full">
              <div className="mb-1.5 text-[12px] font-medium">{m.stat}</div>
              <ProgressBar value={m.pct} color={m.color} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
