import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Lightbulb, Loader2, MessageSquareText, Mic, RefreshCw, Square, Volume2 } from 'lucide-react'
import { BackLink, CircularProgress, Notice, PageHeader } from '../components/ui.jsx'
import { explainCheck, hasAI } from '../lib/ai.js'
import { checkPlain } from '../lib/plain.js'
import { canListen, speak, startListening } from '../lib/voice.js'

export default function Explain({ state, pack, update, addXP, go, track }) {
  const prompts = useMemo(() => [
    'Explain your whole study to a 12-year-old.',
    'Tell your parents what problem your study solves and why it matters.',
    'Explain how you did your study, like you are telling a friend.',
    ...pack.terms.slice(0, 4).map((t) => `Explain "${t.term}" without using that word.`),
    ...pack.sections.slice(0, 6).map((s) => `Sum up "${s.title}" in three simple sentences.`),
  ], [pack])
  const [pi, setPi] = useState(0)
  const [answer, setAnswer] = useState('')
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const recRef = useRef(null)
  const best = state.profile.stats?.plainBest || 0

  function mic() {
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const base = answer ? answer + ' ' : ''
    recRef.current = startListening({ onText: (t) => setAnswer(base + t), onEnd: () => setListening(false) })
    setListening(true)
  }

  async function check() {
    recRef.current?.stop()
    setListening(false)
    setErr('')
    const offline = checkPlain(answer, pack)
    let ai = null
    if (hasAI(state)) {
      setBusy(true)
      try {
        ai = await explainCheck(state.settings, pack, prompts[pi], answer)
      } catch (e) {
        setErr(`${e.message} Showing the offline check instead.`)
      } finally {
        setBusy(false)
      }
    }
    const score = ai ? Math.max(0, Math.min(10, Math.round(Number(ai.score) || 0))) : offline.score
    setResult({ offline, ai, score })
    track('explain')
    addXP(8 + score, 'Explained simply')
    update((s) => ({ ...s, profile: { ...s.profile, stats: { ...(s.profile.stats || {}), plainBest: Math.max(s.profile.stats?.plainBest || 0, score) } } }))
  }

  function nextPrompt() {
    setPi((pi + 1) % prompts.length)
    setAnswer('')
    setResult(null)
  }

  const o = result?.offline
  const jargon = result ? [...new Set([...(result.ai?.jargon || []), ...o.jargon])].slice(0, 8) : []

  return (
    <div className="max-w-3xl">
      <BackLink onClick={() => go('practice')}>Practice</BackLink>
      <PageHeader eyebrow="Explain it simply" title="Can you say it in plain words?" desc="Panels love students who explain their work clearly. If a 12-year-old could follow you, you really understand it." />

      <section className="card p-5">
        <label htmlFor="prompt" className="eyebrow">Your task</label>
        <div className="relative mt-1.5">
          <select id="prompt" className="input appearance-none !h-auto py-2.5 pr-9 text-[15px] font-medium" value={pi} onChange={(e) => { setPi(Number(e.target.value)); setResult(null) }}>
            {prompts.map((p, i) => <option key={i} value={i}>{p}</option>)}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub" aria-hidden />
        </div>
        <textarea className="input mt-3 !h-auto min-h-36 py-3 leading-relaxed" value={answer} onChange={(e) => { setAnswer(e.target.value); setResult(null) }}
          placeholder="Type or say your explanation. Use everyday words, short sentences and one example." aria-label="Your explanation" />
        <div className="mt-1 flex justify-between text-[12px] text-sub">
          <span>{(answer.match(/\S+/g) || []).length} words · aim for 40 to 120</span>
          {best > 0 && <span>Best score {best}/10</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {canListen && <button className={listening ? 'btn border border-red bg-red-soft text-red' : 'btn-ghost'} onClick={mic}>{listening ? <><Square size={13} className="fill-current" /> Stop</> : <><Mic size={16} /> Speak</>}</button>}
          <button className="btn-primary flex-1" disabled={busy || (answer.match(/\S+/g) || []).length < 5} onClick={check}>{busy ? <><Loader2 size={16} className="animate-spin" /> Checking</> : 'Check my explanation'}</button>
          <button className="btn-ghost" onClick={nextPrompt}><RefreshCw size={15} /> Next task</button>
        </div>
        {!hasAI(state) && <p className="mt-3 text-[12px] text-sub">Offline check: reading level, sentence length and jargon. Add a free AI key in Settings for a rewritten, simpler version.</p>}
      </section>

      {err && <div className="mt-3"><Notice tone="red" icon={MessageSquareText}>{err}</Notice></div>}

      {result && (
        <section className="card fade-up mt-4 p-5">
          <div className="flex flex-wrap items-center gap-5">
            <CircularProgress value={result.score * 10} size={84} stroke={8} label={`Plain language score ${result.score} out of 10`} />
            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-bold">{result.score >= 8 ? 'Clear and simple' : result.score >= 5 ? 'Getting there' : 'Too technical for now'}</div>
              {result.ai?.verdict && <p className="text-[14px]">{result.ai.verdict}</p>}
              <div className="mt-1 flex flex-wrap gap-x-4 text-[12px] text-sub">
                <span>{o.words} words</span>
                <span>Reading level: grade {o.grade}</span>
                <span>~{o.avgSentence} words per sentence</span>
              </div>
            </div>
          </div>

          {jargon.length > 0 && (
            <div className="mt-4">
              <div className="eyebrow mb-1.5">Words a non-expert may not know</div>
              <div className="flex flex-wrap gap-1.5">{jargon.map((j) => <span key={j} className="tag !bg-yellow-soft !text-[#6b5300] !border-yellow/50">{j}</span>)}</div>
            </div>
          )}

          <div className="mt-4">
            <div className="eyebrow mb-1.5">Tips</div>
            <ul className="space-y-1.5">
              {[...(result.ai?.missing || []).map((m) => `Missing: ${m}`), ...o.tips].slice(0, 5).map((t, i) => (
                <li key={i} className="flex gap-2 text-[13px]"><Lightbulb size={15} className="mt-0.5 shrink-0 text-[#b38a00]" />{t}</li>
              ))}
            </ul>
          </div>

          {result.ai?.simpler && (
            <div className="mt-4 rounded-md border border-brand-2/25 bg-brand-soft p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="eyebrow !text-brand">A simpler way to say it</span>
                <button onClick={() => speak(result.ai.simpler)} className="grid h-7 w-7 place-items-center rounded text-brand hover:bg-white" aria-label="Listen"><Volume2 size={15} /></button>
              </div>
              <p className="text-[14px] leading-relaxed text-[#1f3a2e]">{result.ai.simpler}</p>
            </div>
          )}
          <button className="btn-ghost mt-4 w-full" onClick={nextPrompt}>Try the next task</button>
        </section>
      )}
    </div>
  )
}
