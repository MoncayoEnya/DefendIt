import { CountdownCard, FocusChecklist, NextStepCard, ReadinessCard, SessionCard, ThesisDocumentCard, ThesisUploadCard, UploadNewButton, WelcomeSection, sessionList } from '../components/Dashboard.jsx'
import { BellRing } from 'lucide-react'
import { Notice, SectionTitle } from '../components/ui.jsx'

export default function Overview({ state, update, pack, go, uploader, remind }) {
  const sessions = sessionList(state, pack)
  const hasPacks = state.packs.length > 0
  const hasOwn = state.packs.some((p) => !p.sample)
  const hasDemo = state.packs.some((p) => p.id === 'demo')
  const name = state.profile.name
  // the big upload card only shows until you upload your own thesis
  const showUpload = !hasOwn || uploader.busy || uploader.error

  function openPack(p) {
    update((s) => ({ ...s, activeId: p.id }))
    if (p.id === state.activeId) go('guide')
  }

  return (
    <>
      {remind > 0 && <div className="mb-4"><Notice tone="yellow" icon={BellRing}>Reminder: {remind} task{remind === 1 ? '' : 's'} left today.</Notice></div>}
      {/* Phone */}
      <div className="space-y-4 md:hidden">
        <WelcomeSection name={name} mobile />
        {showUpload && <ThesisUploadCard uploader={uploader} hasPacks={hasOwn} hasDemo={hasDemo} mobile />}
        <NextStepCard state={state} pack={pack} go={go} />
        <ReadinessCard state={state} pack={pack} mobile go={go} />
        <CountdownCard state={state} pack={pack} go={go} mobile />
        <div>
          <h2 className="mb-2.5 text-[15px] font-semibold">Practice</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {sessions.map((s) => <SessionCard key={s.id} s={s} go={go} mobile />)}
          </div>
        </div>
      </div>

      {/* Tablet and desktop */}
      <div className="hidden md:block">
        <WelcomeSection name={name} />
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
          <div className="min-w-0 space-y-4">
            {showUpload && <ThesisUploadCard uploader={uploader} hasPacks={hasOwn} hasDemo={hasDemo} />}
            <NextStepCard state={state} pack={pack} go={go} />
            <div>
              <SectionTitle>Pick your next session</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {sessions.map((s) => <SessionCard key={s.id} s={s} go={go} />)}
              </div>
            </div>
            {hasPacks && (
              <div>
                <SectionTitle right={!showUpload && <UploadNewButton uploader={uploader} />}>Your thesis{state.packs.length > 1 ? 'es' : ''}</SectionTitle>
                <div className="space-y-2">
                  {state.packs.map((p) => (
                    <ThesisDocumentCard key={p.id} pack={p} active={p.id === state.activeId} onOpen={() => openPack(p)} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-4">
            <CountdownCard state={state} pack={pack} go={go} />
            <ReadinessCard state={state} pack={pack} go={go}>
              <FocusChecklist state={state} update={update} go={go} pack={pack} />
            </ReadinessCard>
          </div>
        </div>
      </div>
    </>
  )
}
