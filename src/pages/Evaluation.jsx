import { Fragment, useCallback, useEffect, useState } from 'react'
import { AlertCircle, ClipboardList, Copy, Download, Link2, Loader2, LogIn, Plus, Printer, QrCode, RefreshCw, Smartphone, Trash2 } from 'lucide-react'
import { CircularProgress, Hint, IconBox, Notice, PageHeader, ProgressBar, SectionTitle, centerOnTap } from '../components/ui.jsx'
import { cloudEnabled, createSurvey, deleteSurvey, fetchSurveyResponses, mySurveys } from '../lib/cloud.js'
import { GROUPS, SUS, interpret, makeCode, summarize, toCsv } from '../lib/survey.js'

// Researcher view: create a survey, share it, and read the results.
export default function Evaluation({ state, update, cloud, go }) {
  const signedIn = cloudEnabled && cloud.user
  const [surveys, setSurveys] = useState([])
  const [source, setSource] = useState(signedIn ? null : 'local')
  const [title, setTitle] = useState('DefendIt evaluation')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [responses, setResponses] = useState(null)

  const loadSurveys = useCallback(async () => {
    if (!signedIn) return
    try {
      const list = await mySurveys()
      setSurveys(list)
      setSource((s) => s || list[0]?.code || 'local')
    } catch (e) {
      setErr(/does not exist|relation/i.test(e.message) ? 'The survey tables are missing. Run supabase/survey.sql in Supabase (SQL Editor).' : e.message)
    }
  }, [signedIn])

  useEffect(() => { loadSurveys() }, [loadSurveys])

  const loadResponses = useCallback(async () => {
    if (!source) return
    if (source === 'local') { setResponses(state.surveyLocal || []); return }
    setResponses(null)
    try {
      setResponses(await fetchSurveyResponses(source))
    } catch (e) {
      setErr(e.message)
      setResponses([])
    }
  }, [source, state.surveyLocal])

  useEffect(() => { loadResponses() }, [loadResponses])

  async function create() {
    setBusy(true)
    setErr('')
    try {
      const code = makeCode()
      await createSurvey(code, title.trim() || 'DefendIt evaluation')
      await loadSurveys()
      setSource(code)
    } catch (e) {
      setErr(/does not exist|relation/i.test(e.message) ? 'The survey tables are missing. Run supabase/survey.sql in Supabase (SQL Editor).' : e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(code) {
    if (!confirm(`Delete survey ${code} and all its answers? This cannot be undone.`)) return
    await deleteSurvey(code).catch((e) => setErr(e.message))
    setSource(null)
    loadSurveys()
  }

  function download() {
    const blob = new Blob(['﻿' + toCsv(responses || [])], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `defendit-survey-${source}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const current = surveys.find((s) => s.code === source)

  return (
    <div className="max-w-5xl">
      <div className="print-hide">
        <PageHeader eyebrow="Evaluation" title="Evaluation survey" desc="Let people rate DefendIt, then use the results in your thesis." />

        {!signedIn && (
          <section className="card mb-4 flex flex-wrap items-center gap-3 p-4">
            <IconBox icon={LogIn} />
            <p className="min-w-0 flex-1 text-[13px]">{cloudEnabled ? 'Sign in to share a survey link with many people.' : 'Online surveys need cloud saving. You can still collect answers on this device.'}</p>
            {cloudEnabled && <button className="btn-primary" onClick={() => go('account')}>Sign in</button>}
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {signedIn && (
            <section className="card p-4 md:p-5">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Link2 size={17} className="text-brand" aria-hidden />Share online</h2>
              <p className="mt-0.5 text-[12px] text-sub">People answer from their own phones. No account needed.</p>
              <div className="mt-3 flex gap-2">
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Survey title" maxLength={120} />
                <button className="btn-primary shrink-0" onClick={create} disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create</button>
              </div>
            </section>
          )}
          <section className="card p-4 md:p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Smartphone size={17} className="text-brand" aria-hidden />Collect on this device</h2>
            <p className="mt-0.5 text-[12px] text-sub">Pass this phone or laptop around. Answers stay here.</p>
            <button className="btn-outline mt-3" onClick={() => { history.replaceState(null, '', `${location.pathname}#survey`); go('survey') }}>Open the survey here</button>
          </section>
        </div>

        {err && <div className="mt-4"><Notice tone="red" icon={AlertCircle}>{err}</Notice></div>}

        <SectionTitle>Results</SectionTitle>
        <div className="swipe-row -mx-4 mb-3 flex gap-1.5 px-4 md:mx-0 md:flex-wrap md:px-0" onClickCapture={centerOnTap}>
          {surveys.map((s) => (
            <button key={s.code} onClick={() => setSource(s.code)} className={`h-9 shrink-0 rounded-full border px-3 text-[12px] font-medium ${source === s.code ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-card text-sub'}`}>{s.code}</button>
          ))}
          <button onClick={() => setSource('local')} className={`h-9 shrink-0 rounded-full border px-3 text-[12px] font-medium ${source === 'local' ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-card text-sub'}`}>This device ({(state.surveyLocal || []).length})</button>
        </div>

        {current && <ShareCard survey={current} onDelete={() => remove(current.code)} />}
      </div>

      {responses === null ? (
        <div className="flex items-center gap-2 py-8 text-[13px] text-sub"><Loader2 size={16} className="animate-spin" /> Loading answers</div>
      ) : responses.length === 0 ? (
        <section className="card p-8 text-center">
          <ClipboardList size={34} strokeWidth={1.5} className="mx-auto text-sub" aria-hidden />
          <p className="mt-2 text-[14px] font-medium">No answers yet</p>
          <p className="text-[12px] text-sub">{source === 'local' ? 'Open the survey here and let people answer.' : 'Share the link or QR code above.'}</p>
        </section>
      ) : (
        <Results responses={responses} source={source} onCsv={download} onRefresh={loadResponses} onClearLocal={source === 'local' ? () => confirm('Delete all answers saved on this device?') && update((s) => ({ ...s, surveyLocal: [] })) : null} />
      )}
    </div>
  )
}

function ShareCard({ survey, onDelete }) {
  const link = `${location.origin}/?survey=${survey.code}#survey`
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    import('qrcode').then((QR) => QR.toDataURL(link, { margin: 1, width: 360, color: { dark: '#151b22', light: '#ffffff' } })).then(setQr).catch(() => {})
  }, [link])
  return (
    <section className="card mb-4 grid gap-4 p-4 sm:grid-cols-[auto_1fr] md:p-5">
      {qr ? <img src={qr} alt={`QR code for survey ${survey.code}`} className="h-40 w-40 rounded-md border border-line bg-white p-1" /> : <div className="grid h-40 w-40 place-items-center rounded-md border border-line"><QrCode className="text-sub" /></div>}
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold">{survey.title}</h3>
        <p className="text-[12px] text-sub">Code <span className="font-mono font-semibold text-ink">{survey.code}</span> · Show the QR code or send the link</p>
        <div className="mt-3 flex gap-2">
          <input className="input font-mono !text-[12px]" readOnly value={link} aria-label="Survey link" onFocus={(e) => e.target.select()} />
          <button className="btn-ghost shrink-0" onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) }}><Copy size={15} /> {copied ? 'Copied' : 'Copy'}</button>
        </div>
        <button className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-sub hover:bg-red-soft hover:text-red" onClick={onDelete}><Trash2 size={14} /> Delete survey</button>
      </div>
    </section>
  )
}

function Results({ responses, source, onCsv, onRefresh, onClearLocal }) {
  const s = summarize(responses)
  const overall = s.groups.filter((g) => g.mean != null)
  const overallMean = overall.length ? Math.round((overall.reduce((a, g) => a + g.mean, 0) / overall.length) * 100) / 100 : null
  const report = `A total of ${s.n} respondent${s.n === 1 ? '' : 's'} evaluated DefendIt. The app obtained a mean System Usability Scale (SUS) score of ${s.sus.mean} (SD = ${s.sus.sd}), which is rated "${s.sus.adjective}" and "${s.sus.acceptability}", and is ${s.sus.aboveAverage ? 'above' : 'below'} the industry average of 68. For the ISO/IEC 25010-based items, the overall weighted mean was ${overallMean}, interpreted as "${s.groups.length ? overallInterp(overallMean) : '-'}".`
  return (
    <div className="space-y-4">
      <div className="print-hide flex flex-wrap gap-2">
        <button className="btn-primary" onClick={onCsv}><Download size={15} /> Download for Excel (CSV)</button>
        <button className="btn-ghost" onClick={() => window.print()}><Printer size={15} /> Print results</button>
        {source !== 'local' && <button className="btn-ghost" onClick={onRefresh}><RefreshCw size={15} /> Refresh</button>}
        {onClearLocal && <button className="btn-ghost text-red" onClick={onClearLocal}><Trash2 size={15} /> Clear</button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <section className="card p-4">
          <p className="eyebrow">Respondents</p>
          <p className="mt-1 text-[30px] font-bold leading-none">{s.n}</p>
          <p className="mt-1 text-[12px] text-sub">{Object.entries(s.roles).filter(([, v]) => v).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(' · ') || '-'}</p>
        </section>
        <section className="card flex items-center gap-3 p-4">
          <CircularProgress value={Math.round(s.sus.mean || 0)} size={70} stroke={8} label={`SUS score ${s.sus.mean}`} />
          <div>
            <p className="eyebrow flex items-center">SUS score<Hint text="System Usability Scale, 0 to 100. Above 68 is above average." /></p>
            <p className="text-[15px] font-semibold">{s.sus.adjective}</p>
            <p className="text-[12px] text-sub">{s.sus.acceptability} · SD {s.sus.sd}</p>
          </div>
        </section>
        <section className="card p-4">
          <p className="eyebrow flex items-center">Features mean<Hint align="right" text="Average of the DefendIt items, 1 to 5." /></p>
          <p className="mt-1 text-[30px] font-bold leading-none">{overallMean ?? '-'}</p>
          <p className="mt-1 text-[12px] text-sub">{overallInterp(overallMean)}</p>
        </section>
      </div>

      <section className="card overflow-x-auto p-4 md:p-5">
        <h2 className="mb-3 text-[15px] font-semibold">DefendIt features (ISO/IEC 25010)</h2>
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead><tr className="border-b border-line text-[12px] text-sub"><th className="py-2 font-medium">Indicator</th><th className="w-16 py-2 font-medium">Mean</th><th className="w-14 py-2 font-medium">SD</th><th className="w-36 py-2 font-medium">Interpretation</th></tr></thead>
          <tbody>
            {GROUPS.map((g) => (
              <Fragment key={g.id}>
                <tr className="bg-bg"><td className="px-1 py-1.5 font-semibold" colSpan={1}>{g.name}</td><td className="py-1.5 font-semibold">{s.groups.find((x) => x.id === g.id).mean ?? '-'}</td><td /><td className="py-1.5 font-semibold">{s.groups.find((x) => x.id === g.id).interpretation}</td></tr>
                {g.items.map(([k, text]) => (
                  <tr key={k} className="border-b border-line">
                    <td className="py-2 pl-3 pr-2">{text}</td><td className="py-2">{s.items[k].mean ?? '-'}</td><td className="py-2 text-sub">{s.items[k].sd}</td><td className="py-2">{s.items[k].interpretation}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-sub">Scale: 4.21 to 5.00 Strongly agree · 3.41 to 4.20 Agree · 2.61 to 3.40 Neutral · 1.81 to 2.60 Disagree · 1.00 to 1.80 Strongly disagree</p>
      </section>

      <section className="card p-4 md:p-5">
        <h2 className="mb-3 text-[15px] font-semibold">System Usability Scale items</h2>
        <ul className="space-y-2.5">
          {SUS.map((t, i) => {
            const it = s.items[`sus${i + 1}`]
            return (
              <li key={i}>
                <div className="mb-1 flex justify-between gap-3 text-[13px]"><span>{i + 1}. {t}</span><span className="shrink-0 font-semibold">{it.mean ?? '-'}</span></div>
                <ProgressBar value={((it.mean || 0) / 5) * 100} color={i % 2 ? 'bg-yellow' : 'bg-brand-2'} className="h-1.5" />
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-[11px] text-sub">Odd items are positive (higher is better). Even items are negative (lower is better).</p>
      </section>

      <section className="card p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">Ready-to-use summary</h2>
          <button className="print-hide btn-ghost !h-8 !text-[12px]" onClick={() => navigator.clipboard?.writeText(report)}><Copy size={14} /> Copy</button>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{report}</p>
        <p className="mt-2 text-[11px] text-sub">Check the numbers and edit the wording to match your school's format.</p>
      </section>

      {(s.liked.length > 0 || s.improve.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Comments title="What people liked" items={s.liked} />
          <Comments title="What to improve" items={s.improve} />
        </div>
      )}
    </div>
  )
}

const overallInterp = interpret

function Comments({ title, items }) {
  return (
    <section className="card p-4 md:p-5">
      <h2 className="mb-2 text-[15px] font-semibold">{title}</h2>
      {items.length ? (
        <ul className="space-y-2">{items.map((c, i) => <li key={i} className="rounded-md bg-bg p-2.5 text-[13px] text-ink-2">"{c}"</li>)}</ul>
      ) : <p className="text-[13px] text-sub">No comments yet.</p>}
    </section>
  )
}
