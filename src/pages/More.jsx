import { HeartPulse, Keyboard, Settings as SettingsIcon, Swords } from 'lucide-react'
import { FocusChecklist, ThesisDocumentCard, ThesisUploadCard } from '../components/Dashboard.jsx'
import { ListLink, PageHeader, SectionTitle } from '../components/ui.jsx'
import { levelInfo } from '../lib/storage.js'

export default function More({ state, update, go, uploader }) {
  const lv = levelInfo(state.profile.xp)

  function remove(p) {
    if (!confirm(`Delete "${p.title}" and its progress?`)) return
    update((s) => {
      s.packs = s.packs.filter((x) => x.id !== p.id)
      delete s.mastery[p.id]
      if (s.activeId === p.id) s.activeId = s.packs[0]?.id || null
      return s
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="More" title="Everything else" desc={`Level ${lv.level} · ${lv.name} · ${state.profile.xp} XP · ${state.profile.streak}-day streak`} />

      <div className="card p-4"><FocusChecklist state={state} update={update} go={go} /></div>

      <SectionTitle>Your thesis documents</SectionTitle>
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
        <ListLink icon={HeartPulse} tone="yellow" title="Confidence lab" meta="Breathing, speaking drill, helpful lines, checklist" onClick={() => go('confidence')} />
        <ListLink icon={Keyboard} tone="blue" title="Typing defense" meta="Recall key terms under time pressure" onClick={() => go('typing')} />
        <ListLink icon={Swords} tone="brand" title="All practice modes" meta="Flashcards, typing defense and the panel" onClick={() => go('practice')} />
        <ListLink icon={SettingsIcon} title="Settings" meta={state.settings.apiKey ? 'AI mode is on' : 'Add a free AI key for smarter results'} onClick={() => go('settings')} />
      </div>
    </div>
  )
}
