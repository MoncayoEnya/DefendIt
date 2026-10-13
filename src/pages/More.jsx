import { Info, BookOpenText, UserRound, Award, ClipboardList, Printer, CalendarDays, MessageSquareText, Presentation, Timer, Cloud, CloudOff, HeartPulse, Keyboard, Link2, ListOrdered, Settings as SettingsIcon, Swords, UsersRound } from 'lucide-react'
import { FocusChecklist, ThesisDocumentCard, ThesisUploadCard, UploadNewButton } from '../components/Dashboard.jsx'
import { ListLink, PageHeader, SectionTitle } from '../components/ui.jsx'
import { levelInfo } from '../lib/storage.js'
import { hasAI } from '../lib/ai.js'
import { deleteText } from '../lib/textstore.js'

export default function More({ state, update, go, uploader, cloud, pack }) {
  const lv = levelInfo(state.profile.xp)

  function remove(p) {
    if (!confirm(`Delete "${p.title}" and its progress?`)) return
    deleteText(p.id)
    update((s) => {
      s.packs = s.packs.filter((x) => x.id !== p.id)
      delete s.mastery[p.id]
      if (s.activeId === p.id) s.activeId = s.packs[0]?.id || null
      return s
    })
  }

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="More" title="Everything else" desc={`Level ${lv.level} · ${lv.name} · ${state.profile.xp} XP · ${state.profile.streak}-day streak`} />

      <div className="card p-4"><FocusChecklist state={state} update={update} go={go} pack={pack} /></div>

      <SectionTitle right={state.packs.length > 0 && <UploadNewButton uploader={uploader} />}>Your thesis documents</SectionTitle>
      {state.packs.length ? (
        <div className="space-y-2">
          {state.packs.map((p) => (
            <ThesisDocumentCard key={p.id} pack={p} active={p.id === state.activeId}
              onOpen={() => { update((s) => ({ ...s, activeId: p.id })); go('guide') }}
              onDelete={() => remove(p)} />
          ))}
        </div>
      ) : (
        <ThesisUploadCard uploader={uploader} hasPacks={false} hasDemo={false} mobile />
      )}

      <SectionTitle>Tools</SectionTitle>
      <div className="space-y-2">
        <ListLink icon={BookOpenText} tone="yellow" title="Read my thesis" meta="Every paragraph explained, even like you're 10" onClick={() => go('read')} />
        <ListLink icon={Printer} tone="brand" title="Printable reviewer" meta="Print or save your study guide as a PDF" onClick={() => go('reviewer')} />
        <ListLink icon={ClipboardList} tone="blue" title="Evaluation survey" meta="Let people rate the app for your thesis" onClick={() => go('evaluation')} />
        <ListLink icon={CalendarDays} tone="brand" title="Defense countdown" meta="Your day-by-day prep plan" onClick={() => go('plan')} />
        <ListLink icon={Timer} tone="yellow" title="Daily challenge" meta="5 minutes: terms and one panel question" onClick={() => go('daily')} />
        <ListLink icon={MessageSquareText} tone="brand" title="Explain it simply" meta="Say your study in plain words" onClick={() => go('explain')} />
        <ListLink icon={Presentation} tone="blue" title="Slide checker" meta="Check your PowerPoint before the defense" onClick={() => go('slides')} />
        <ListLink icon={HeartPulse} tone="yellow" title="Confidence lab" meta="Breathing, speaking drill, helpful lines, checklist" onClick={() => go('confidence')} />
        <ListLink icon={Keyboard} tone="blue" title="Typing defense" meta="Recall key terms under time pressure" onClick={() => go('typing')} />
        <ListLink icon={Link2} tone="brand" title="Match & Link" meta="Drag terms to chapters or definitions" onClick={() => go('match')} />
        <ListLink icon={UsersRound} tone="blue" title="Group mode" meta="Split questions among groupmates" onClick={() => go('group')} />
        <ListLink icon={Award} tone="yellow" title="Badges" meta={`${Object.keys(state.profile.badges || {}).length} earned`} onClick={() => go('badges')} />
        <ListLink icon={ListOrdered} tone="blue" title="Class leaderboard" meta={state.profile.classCode ? `Class ${state.profile.classCode}` : 'Compete with classmates'} onClick={() => go('leaderboard')} />
        <ListLink icon={UserRound} tone="brand" title="Your profile" meta={state.profile.fullName || state.profile.name || 'Name, groupmates, school'} onClick={() => go('profile')} />
        <ListLink icon={cloud?.user ? Cloud : CloudOff} tone="brand" title="Account and cloud saving" meta={cloud?.user ? cloud.user.email : 'Sign in to back up your progress'} onClick={() => go('account')} />
        <ListLink icon={Swords} tone="brand" title="All practice modes" meta="Flashcards, typing defense and the panel" onClick={() => go('practice')} />
        <ListLink icon={Info} title="About DefendIt" meta="What the app does, and common questions" onClick={() => go('welcome')} />
        <ListLink icon={SettingsIcon} title="Settings" meta={hasAI(state) ? 'AI mode is on' : 'AI is off: offline mode'} onClick={() => go('settings')} />
      </div>
    </div>
  )
}
