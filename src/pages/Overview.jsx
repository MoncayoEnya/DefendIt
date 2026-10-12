import { FocusChecklist, ReadinessCard, SessionCard, ThesisDocumentCard, ThesisUploadCard, WelcomeSection, sessionList } from '../components/Dashboard.jsx'
import { SectionTitle } from '../components/ui.jsx'

export default function Overview({ state, update, pack, go, uploader }) {
  const sessions = sessionList(state, pack)
  const hasPacks = state.packs.length > 0
  const hasOwn = state.packs.some((p) => !p.sample)
  const hasDemo = state.packs.some((p) => p.id === 'demo')
  const name = state.profile.name

  function openPack(p) {
    update((s) => ({ ...s, activeId: p.id }))
    if (p.id === state.activeId) go('guide')
  }

  return (
    <>
      {/* Mobile layout */}
      <div className="space-y-4 md:hidden">
        <WelcomeSection name={name} mobile />
        <ReadinessCard state={state} pack={pack} mobile go={go} />
        <ThesisUploadCard uploader={uploader} hasPacks={hasOwn} hasDemo={hasDemo} mobile />
        <div>
          <h2 className="mb-2.5 text-[15px] font-semibold">Your next session</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {sessions.map((s) => <SessionCard key={s.id} s={s} go={go} mobile />)}
          </div>
        </div>
      </div>

      {/* Tablet & desktop layout */}
      <div className="hidden md:block">
        <WelcomeSection name={name} />
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
          <div className="min-w-0">
            <ThesisUploadCard uploader={uploader} hasPacks={hasOwn} hasDemo={hasDemo} />
            <SectionTitle>Pick your next session</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {sessions.map((s) => <SessionCard key={s.id} s={s} go={go} />)}
            </div>
            {hasPacks && (
              <>
                <SectionTitle>Your thesis document{state.packs.length > 1 ? 's' : ''}</SectionTitle>
                <div className="space-y-2">
                  {state.packs.map((p) => (
                    <ThesisDocumentCard key={p.id} pack={p} active={p.id === state.activeId} onOpen={() => openPack(p)} />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="min-w-0">
            <ReadinessCard state={state} pack={pack} go={go}>
              <FocusChecklist state={state} update={update} go={go} />
            </ReadinessCard>
          </div>
        </div>
      </div>
    </>
  )
}
