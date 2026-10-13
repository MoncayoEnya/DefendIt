import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, ClipboardList, Loader2 } from 'lucide-react'
import { Notice, ProgressBar } from '../components/ui.jsx'
import { cloudEnabled, submitSurvey, surveyInfo } from '../lib/cloud.js'
import { GROUPS, ROLES, SCALE, SUS, allItemKeys } from '../lib/survey.js'

// Respondent view. Opened from a shared link (…/?survey=EVAL-XXXXX#survey) or on the researcher's device.
// (The link uses ?survey= because Supabase sign-in uses ?code= for its own purpose.)
export default function Survey({ update, go }) {
  const urlCode = new URLSearchParams(location.search).get('survey')?.toUpperCase() || ''
  const [code, setCode] = useState(urlCode)
  const [typed, setTyped] = useState('')
  const local = !code // no code = answers are saved on this device
  const [info, setInfo] = useState(null)
  const [status, setStatus] = useState(code ? 'checking' : 'ready') // checking | ready | missing | sending | done
  const [err, setErr] = useState('')
  const [a, setA] = useState({})
  const doneKey = `defendit:survey-done:${code || 'local'}`

  useEffect(() => {
    if (!code) return
    if (!cloudEnabled) { setStatus('missing'); setErr('This copy of DefendIt is not connected to the cloud, so it cannot open shared surveys.'); return }
    surveyInfo(code).then((s) => {
      if (!s) { setStatus('missing'); setErr(`No survey found with the code ${code}.`); return }
      setInfo(s)
      setStatus(localStorage.getItem(doneKey) ? 'done' : 'ready')
    }).catch((e) => { setStatus('missing'); setErr(e.message) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const likertKeys = allItemKeys()
  const answered = likertKeys.filter((k) => a[k]).length + (a.role ? 1 : 0)
  const total = likertKeys.length + 1
  const complete = answered === total

  async function submit() {
    setErr('')
    const answers = { ...a, at: new Date().toISOString() }
    if (local) {
      update((s) => ({ ...s, surveyLocal: [...(s.surveyLocal || []), { answers, created_at: answers.at }] }))
      setStatus('done')
      return
    }
    setStatus('sending')
    try {
      await submitSurvey(code, answers)
      try { localStorage.setItem(doneKey, '1') } catch { /* private mode */ }
      setStatus('done')
    } catch (e) {
      setErr(/fetch|network/i.test(e.message) ? 'No internet connection. Please try again.' : e.message)
      setStatus('ready')
    }
  }

  if (status === 'checking') return <div className="flex items-center gap-2 py-10 text-[14px] text-sub"><Loader2 size={18} className="animate-spin" /> Opening survey</div>

  if (status === 'missing') {
    return (
      <div className="max-w-xl">
        <Notice tone="red" icon={AlertCircle}>{err}</Notice>
        <CodeEntry typed={typed} setTyped={setTyped} onGo={() => { setCode(typed.trim().toUpperCase()); setStatus('checking') }} />
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="max-w-xl">
        <section className="card fade-up p-8 text-center">
          <CheckCircle2 size={44} strokeWidth={1.6} className="mx-auto text-brand" />
          <h1 className="mt-3 text-[22px] font-bold">Thank you!</h1>
          <p className="mt-1 text-[14px] text-sub">Your answers were saved. They help improve DefendIt.</p>
          <button className="btn-ghost mt-5" onClick={() => { setA({}); setStatus('ready'); try { localStorage.removeItem(doneKey) } catch { /* ignore */ } window.scrollTo(0, 0) }}>
            Answer again (shared device)
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-4">
        <p className="eyebrow mb-1 flex items-center gap-1.5"><ClipboardList size={14} aria-hidden /> Evaluation survey{code ? ` · ${code}` : ' · this device'}</p>
        <h1 className="text-[22px] font-bold leading-tight md:text-[28px]">{info?.title || 'Help us evaluate DefendIt'}</h1>
        <p className="mt-1 text-[14px] text-sub">About 3 minutes. There are no right or wrong answers.</p>
      </header>

      <div className="sticky top-14 z-20 -mx-4 mb-4 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur md:top-16 md:mx-0 md:rounded-md md:border md:px-3">
        <div className="flex items-center gap-3 text-[12px] text-sub"><ProgressBar value={(answered / total) * 100} className="h-1.5 flex-1" /><span>{answered}/{total}</span></div>
      </div>

      <Part title="About you">
        <p className="mb-2 text-[14px] font-medium">I am a…</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button key={r} onClick={() => setA({ ...a, role: r })} className={`h-10 rounded-full border px-4 text-[13px] font-medium ${a.role === r ? 'border-brand bg-brand text-white' : 'border-line bg-card hover:bg-bg'}`}>{r}</button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="course" className="text-[12px] font-medium text-sub">Course or strand (optional)</label>
            <input id="course" className="input mt-1" value={a.course || ''} onChange={(e) => setA({ ...a, course: e.target.value.slice(0, 60) })} placeholder="e.g. BSIT" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-sub">Did you use it to prepare for a defense?</span>
            <div className="mt-1 flex gap-2">
              {['Yes', 'No'].map((v) => (
                <button key={v} onClick={() => setA({ ...a, used: v })} className={`h-10 flex-1 rounded-md border text-[13px] font-medium ${a.used === v ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-card hover:bg-bg'}`}>{v}</button>
              ))}
            </div>
          </div>
        </div>
      </Part>

      <Part title="Using the app" note="1 = Strongly disagree, 5 = Strongly agree">
        {SUS.map((text, i) => <Likert key={i} n={i + 1} text={text} value={a[`sus${i + 1}`]} onChange={(v) => setA({ ...a, [`sus${i + 1}`]: v })} />)}
      </Part>

      <Part title="DefendIt's features" note="1 = Strongly disagree, 5 = Strongly agree">
        {GROUPS.flatMap((g) => g.items).map(([k, text], i) => <Likert key={k} n={i + 11} text={text} value={a[k]} onChange={(v) => setA({ ...a, [k]: v })} />)}
      </Part>

      <Part title="Your thoughts (optional)">
        <label htmlFor="liked" className="text-[13px] font-medium">What did you like most?</label>
        <textarea id="liked" className="input mt-1 !h-auto min-h-20 py-2" value={a.liked || ''} onChange={(e) => setA({ ...a, liked: e.target.value.slice(0, 600) })} />
        <label htmlFor="improve" className="mt-3 block text-[13px] font-medium">What should we improve?</label>
        <textarea id="improve" className="input mt-1 !h-auto min-h-20 py-2" value={a.improve || ''} onChange={(e) => setA({ ...a, improve: e.target.value.slice(0, 600) })} />
      </Part>

      {err && <div className="mb-3"><Notice tone="red" icon={AlertCircle}>{err}</Notice></div>}
      <button className="btn-primary h-12 w-full text-[15px]" disabled={!complete || status === 'sending'} onClick={submit}>
        {status === 'sending' ? <><Loader2 size={16} className="animate-spin" /> Sending</> : complete ? 'Submit answers' : `Answer ${total - answered} more to submit`}
      </button>
      {local && <p className="mt-2 text-center text-[12px] text-sub">Answers are saved on this device. <button className="font-semibold text-brand" onClick={() => go('evaluation')}>See results</button></p>}
    </div>
  )
}

function CodeEntry({ typed, setTyped, onGo }) {
  return (
    <form className="card mt-4 flex gap-2 p-4" onSubmit={(e) => { e.preventDefault(); onGo() }}>
      <input className="input font-mono uppercase" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Survey code, e.g. EVAL-AB12C" aria-label="Survey code" />
      <button className="btn-primary shrink-0" disabled={typed.trim().length < 4}>Open</button>
    </form>
  )
}

function Part({ title, note, children }) {
  return (
    <section className="card mb-4 p-4 md:p-5">
      <h2 className="text-[16px] font-semibold">{title}</h2>
      {note && <p className="mb-2 text-[12px] text-sub">{note}</p>}
      <div className="mt-2">{children}</div>
    </section>
  )
}

function Likert({ n, text, value, onChange }) {
  return (
    <fieldset className="border-t border-line py-3.5 first:border-0 first:pt-1">
      <legend className="sr-only">{text}</legend>
      <p className="text-[14px] leading-snug" aria-hidden><span className="mr-1.5 text-sub">{n}.</span>{text}</p>
      <div className="mt-2.5 grid grid-cols-5 gap-1.5">
        {SCALE.map((s) => (
          <button key={s.v} type="button" onClick={() => onChange(s.v)} aria-pressed={value === s.v} aria-label={`${s.v}, ${s.label}`}
            className={`flex h-11 flex-col items-center justify-center rounded-md border text-[14px] font-semibold leading-none transition-colors ${value === s.v ? 'border-brand bg-brand text-white' : 'border-line bg-card hover:bg-bg'}`}>
            {s.v}
            <span className={`mt-0.5 text-[9px] font-medium ${value === s.v ? 'text-white/80' : 'text-sub'}`}>{s.short}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
