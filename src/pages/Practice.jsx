import { Award, Keyboard, Layers, Link2, ListOrdered, Users, UsersRound } from 'lucide-react'
import { IconBox, ListLink, PageHeader, ProgressBar, SectionTitle } from '../components/ui.jsx'
import { getGroup } from '../lib/group.js'
import { packProgress } from '../lib/progress.js'

export default function Practice({ state, pack, go }) {
  const p = packProgress(state, pack)
  const members = pack ? getGroup(pack).members.length : 0
  const matchBest = pack ? state.profile.stats?.matchBest?.[pack.id] : null
  const modes = [
    {
      id: 'cards', icon: Layers, tone: 'brand', title: 'Flashcards',
      desc: 'Flip or type key terms. Cards you miss return sooner through spaced repetition.',
      stat: p ? `${p.terms.mastered} of ${p.terms.total} terms mastered` : 'Needs a thesis',
      pct: p ? (p.terms.mastered / Math.max(p.terms.total, 1)) * 100 : 0, color: 'bg-brand-2',
    },
    {
      id: 'match', icon: Link2, tone: 'brand', title: 'Match & Link',
      desc: 'Drag each term to its chapter or its definition. Learn how your paper fits together.',
      stat: matchBest != null ? `Best accuracy ${matchBest}%` : p ? 'Not yet played' : 'Needs a thesis',
      pct: matchBest || 0, color: 'bg-brand-2',
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
    {
      id: 'group', icon: UsersRound, tone: 'blue', title: 'Group mode',
      desc: 'Split panel questions among groupmates and track who practiced what.',
      stat: members ? `${members} member${members === 1 ? '' : 's'}` : 'No members yet',
      pct: 0, color: 'bg-blue', noBar: true,
    },
  ]
  return (
    <div>
      <PageHeader eyebrow="Practice" title="Choose how to train" desc={pack ? `Built from: ${pack.title}` : 'Upload a thesis to unlock practice modes.'} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((m) => (
          <button key={m.id} onClick={() => go(m.id)} className="card-link flex flex-col p-5 text-left">
            <IconBox icon={m.icon} tone={m.tone} />
            <h2 className="mt-3 text-[15px] font-semibold">{m.title}</h2>
            <p className="mt-1 flex-1 text-[13px] leading-snug text-sub">{m.desc}</p>
            <div className="mt-4 w-full">
              <div className="mb-1.5 text-[12px] font-medium">{m.stat}</div>
              {!m.noBar && <ProgressBar value={m.pct} color={m.color} />}
            </div>
          </button>
        ))}
      </div>
      <SectionTitle>Progress and competition</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        <ListLink icon={Award} tone="yellow" title="Badges" meta={`${Object.keys(state.profile.badges || {}).length} earned`} onClick={() => go('badges')} />
        <ListLink icon={ListOrdered} tone="blue" title="Class leaderboard" meta={state.profile.classCode ? `Class ${state.profile.classCode}` : 'Compete with classmates'} onClick={() => go('leaderboard')} />
      </div>
    </div>
  )
}
