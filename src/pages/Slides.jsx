import { useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, Check, ChevronDown, FileUp, Image, Info, Lightbulb, Loader2, MessageCircleQuestion, Presentation, Sparkles, X } from 'lucide-react'
import { BackLink, CircularProgress, Notice, PageHeader, SectionTitle } from '../components/ui.jsx'
import { hasAI, reviewSlides } from '../lib/ai.js'
import { checkSlides, readPptx } from '../lib/slides.js'

export default function Slides({ state, pack, addXP, track, go, update }) {
  const fileRef = useRef()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [report, setReport] = useState(null)
  const [fileName, setFileName] = useState('')
  const [open, setOpen] = useState(null)
  const [ai, setAi] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)

  async function onFile(file) {
    if (!file) return
    setErr('')
    setAi(null)
    if (!/\.pptx$/i.test(file.name)) {
      setErr('Please upload a .pptx file. Old .ppt files: open in PowerPoint and Save As .pptx. Google Slides: choose File, then Download, then Microsoft PowerPoint.')
      return
    }
    setBusy(true)
    try {
      const slides = await readPptx(file)
      setReport(checkSlides(slides, pack))
      setFileName(file.name)
      track('slides')
      addXP(15, 'Slides checked')
      update((s) => ({ ...s, profile: { ...s.profile, stats: { ...(s.profile.stats || {}), slidesChecked: (s.profile.stats?.slidesChecked || 0) + 1 } } }))
    } catch (e) {
      setErr(e.message || 'Could not read this file.')
    } finally {
      setBusy(false)
      fileRef.current.value = ''
    }
  }

  async function askAi() {
    setAiBusy(true)
    setErr('')
    try {
      setAi(await reviewSlides(state.settings, pack, report.slides))
    } catch (e) {
      setErr(e.message)
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <BackLink onClick={() => go('practice')}>Practice</BackLink>
      <PageHeader eyebrow="Slide checker" title="Check your defense slides" desc="Upload your PowerPoint. We check every slide for too much text, missing titles and the parts a defense needs. Your file stays on this device." />
      <input ref={fileRef} type="file" accept=".pptx" className="hidden" onChange={(e) => onFile(e.target.files[0])} />

      <section className="card flex flex-col items-center justify-center gap-2 border-dashed p-6 text-center">
        {busy ? (
          <><Loader2 size={26} className="animate-spin text-brand" /><p className="text-[14px] font-semibold">Reading your slides</p></>
        ) : (
          <>
            <Presentation size={28} strokeWidth={1.5} aria-hidden />
            <h2 className="text-[16px] font-semibold">{report ? fileName : 'Upload your presentation'}</h2>
            <p className="text-[13px] text-sub">PowerPoint (.pptx). From Google Slides: choose File, then Download, then Microsoft PowerPoint.</p>
            <button className="btn-primary mt-2" onClick={() => fileRef.current.click()}><FileUp size={16} /> {report ? 'Check another file' : 'Upload slides'}</button>
          </>
        )}
      </section>
      {err && <div className="mt-3"><Notice tone="red" icon={AlertCircle}>{err}</Notice></div>}

      {report && (
        <div className="fade-up">
          <section className="card mt-4 flex flex-wrap items-center gap-5 p-5">
            <CircularProgress value={report.score} size={96} stroke={9} label={`Slide score ${report.score} out of 100`} />
            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-bold">{report.score >= 85 ? 'Defense-ready slides' : report.score >= 65 ? 'Good, with a few fixes' : 'Needs work before the defense'}</div>
              <div className="mt-1 flex flex-wrap gap-x-4 text-[13px] text-sub">
                <span>{report.slides.length} slides</span>
                <span>~{report.avgWords} words per slide</span>
                <span>{report.missing.length ? `${report.missing.length} missing part${report.missing.length === 1 ? '' : 's'}` : 'All key parts found'}</span>
              </div>
            </div>
            {hasAI(state) && !ai && (
              <button className="btn-outline" onClick={askAi} disabled={aiBusy}>{aiBusy ? <><Loader2 size={15} className="animate-spin" /> Reviewing</> : <><Sparkles size={15} /> Get AI review</>}</button>
            )}
          </section>

          {ai && (
            <section className="card mt-4 p-5">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Sparkles size={17} className="text-brand" /> AI review</h2>
              <p className="mt-1.5 text-[14px]">{ai.overall}</p>
              {ai.strengths?.length > 0 && (
                <ul className="mt-3 space-y-1">{ai.strengths.map((x, i) => <li key={i} className="flex gap-2 text-[13px]"><Check size={15} className="mt-0.5 shrink-0 text-brand" />{x}</li>)}</ul>
              )}
              {ai.fixes?.length > 0 && (
                <div className="mt-3 divide-y divide-line rounded-md border border-line">
                  {ai.fixes.map((f, i) => (
                    <div key={i} className="p-3 text-[13px]">
                      <span className="tag mr-2">{f.slide ? `Slide ${f.slide}` : 'Whole deck'}</span>
                      <span className="font-medium">{f.issue}</span>
                      <p className="mt-1 text-sub">{f.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
              {ai.likelyQuestions?.length > 0 && (
                <div className="mt-3">
                  <div className="eyebrow mb-1">The panel may ask</div>
                  <ul className="space-y-1">{ai.likelyQuestions.map((q, i) => <li key={i} className="flex gap-2 text-[13px]"><MessageCircleQuestion size={15} className="mt-0.5 shrink-0 text-brand-2" />{q}</li>)}</ul>
                </div>
              )}
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <SectionTitle>Defense parts</SectionTitle>
              <section className="card divide-y divide-line">
                {report.parts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                    {p.slide ? <Check size={16} className="text-brand" aria-label="Found" /> : <X size={16} className="text-red" aria-label="Missing" />}
                    <span className={`flex-1 ${p.slide ? '' : 'font-medium text-red'}`}>{p.name}</span>
                    <span className="text-[12px] text-sub">{p.slide ? `Slide ${p.slide}` : 'Missing'}</span>
                  </div>
                ))}
              </section>
            </div>
            <div>
              <SectionTitle>Whole deck</SectionTitle>
              <section className="card space-y-2.5 p-4">
                {report.deckIssues.length === 0 && <p className="flex gap-2 text-[13px]"><Check size={15} className="mt-0.5 text-brand" />Good length and structure.</p>}
                {report.deckIssues.map((d, i) => <p key={i} className="flex gap-2 text-[13px]"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#b38a00]" />{d}</p>)}
                {report.termsMissing.length > 0 && (
                  <div>
                    <p className="flex gap-2 text-[13px]"><Info size={15} className="mt-0.5 shrink-0 text-blue" />Key terms from your thesis that never appear on a slide:</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 pl-6">{report.termsMissing.map((t) => <span key={t} className="tag">{t}</span>)}</div>
                  </div>
                )}
              </section>
            </div>
          </div>

          <SectionTitle>Slide by slide</SectionTitle>
          <section className="card divide-y divide-line">
            {report.slides.map((s) => {
              const bad = s.issues.filter((i) => i.level === 'bad').length
              const warn = s.issues.filter((i) => i.level === 'warn').length
              const isOpen = open === s.n
              return (
                <div key={s.n}>
                  <button className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left" onClick={() => setOpen(isOpen ? null : s.n)} aria-expanded={isOpen}>
                    <span className="w-7 shrink-0 text-[12px] font-semibold text-sub">{s.n}</span>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{s.title || <span className="text-sub">(no title)</span>}</span>
                    {(s.images > 0 || s.charts > 0) && <Image size={15} className="text-sub" aria-label="Has visuals" />}
                    <span className="hidden text-[12px] text-sub sm:inline">{s.words} word{s.words === 1 ? '' : 's'}</span>
                    {bad > 0 ? <span className="tag !border-red/40 !bg-red-soft !text-red">{bad + warn} issue{bad + warn === 1 ? '' : 's'}</span>
                      : warn > 0 ? <span className="tag !border-yellow/50 !bg-yellow-soft !text-[#6b5300]">{warn} to fix</span>
                        : <Check size={16} className="text-brand" aria-label="Looks good" />}
                    <ChevronDown size={16} className={`text-sub transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="fade-up space-y-2 px-4 pb-4 sm:pl-14">
                      {s.issues.length === 0 && <p className="text-[13px] text-brand">This slide looks good.</p>}
                      {s.issues.map((iss, i) => (
                        <p key={i} className="flex gap-2 text-[13px]">
                          {iss.level === 'bad' ? <AlertCircle size={15} className="mt-0.5 shrink-0 text-red" /> : iss.level === 'warn' ? <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#b38a00]" /> : <Lightbulb size={15} className="mt-0.5 shrink-0 text-blue" />}
                          {iss.text}
                        </p>
                      ))}
                      {s.text && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-bg p-3 font-sans text-[12px] text-sub">{s.text}</pre>}
                      {s.notes && <p className="text-[12px] text-sub"><span className="font-semibold">Speaker notes:</span> {s.notes.slice(0, 200)}{s.notes.length > 200 ? '…' : ''}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </section>
          {pack && <button className="btn-ghost mt-4 w-full" onClick={() => go('panel')}>Practice answering the panel next</button>}
        </div>
      )}
    </div>
  )
}
