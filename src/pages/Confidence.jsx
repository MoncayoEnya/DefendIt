import { useCallback, useEffect, useRef, useState } from 'react'
import { Lightbulb, MessageCircleQuestion, Mic, RefreshCw, Square, Wind } from 'lucide-react'
import { Checkbox, IconBox, PageHeader, ProgressBar, SectionTitle } from '../components/ui.jsx'
import { canListen, countFillers, startListening } from '../lib/voice.js'

const SCRIPTS = [
  { when: "You don't know the answer", say: "That's a very good point, and honestly it's outside the scope of our study. We'll note it as a recommendation for future research." },
  { when: 'You need time to think', say: 'Thank you for that question. May I take a moment to think about it?' },
  { when: "You didn't understand the question", say: 'Just to make sure I answer correctly, are you asking about ___ or ___?' },
  { when: 'A panelist points out a mistake', say: "Thank you for catching that. You're right, and we'll revise that part in our final manuscript." },
  { when: 'Your groupmate is stuck', say: 'If I may add to that, ma\'am/sir…' },
  { when: 'Panel disagrees with your method', say: 'We chose this approach because ___. We understand the limitation, and we addressed it by ___.' },
]

const TIPS = [
  ['Answer first, explain second', 'Start with a direct yes/no or one-line answer, then support it. Panels hate long intros.'],
  ['Use the 3-part answer', 'Point → Evidence from your study → Why it matters. Done.'],
  ['Pause instead of "uhm"', 'A 2-second silence looks confident. Filler words look nervous.'],
  ['Look at the asker, then the panel', 'Start your answer to the one who asked, then glance at the others.'],
  ['Know your numbers cold', 'Sample size, key statistics, main results. These are asked every time.'],
  ['Agree before you defend', '"That\'s a valid concern…" calms the room before you explain.'],
  ['Slow down 20%', 'Nervous people talk fast. Aim for about 120–150 words per minute.'],
  ['Power pose before you enter', 'Stand tall for 2 minutes before the defense. It really helps your nerves.'],
]

const PROMPTS = [
  'Introduce yourself and your study title.',
  'Explain your study to a 12-year-old in 30 seconds.',
  'What is the main problem your study solves?',
  'Describe your methodology in 3 sentences.',
  'Say your biggest finding and why it matters.',
  'Name two limitations of your study.',
  'Thank the panel and close your presentation.',
]

const CHECKLIST = [
  'Slides final and saved in 2 places (USB + cloud)',
  'Printed copies for each panelist',
  'Practiced the full presentation out loud at least 3 times',
  'Memorized sample size and key statistics',
  'Prepared answers for the top 10 panel questions',
  'Divided questions among groupmates (who answers what)',
  'Clothes ready the night before',
  'Slept at least 7 hours',
  'Arrive 30 minutes early and test the projector',
  'Water bottle and a pen for panel notes',
]

export default function Confidence({ state, update, addXP }) {
  const checked = state.profile.checklist || {}
  const done = CHECKLIST.filter((_, i) => checked[i]).length

  const bump = useCallback((key) => update((s) => ({ ...s, profile: { ...s.profile, confidence: { ...(s.profile.confidence || {}), [key]: ((s.profile.confidence || {})[key] || 0) + 1 } } })), [update])

  return (
    <div>
      <PageHeader eyebrow="Confidence" title="Calm, clear and ready" desc="Confidence comes from preparation and from practicing out loud. Train both here." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Breathing onDone={() => { bump('breaths'); addXP(10, 'Breathing exercise') }} />
        <SpeakDrill onDone={(clean) => { bump('drills'); addXP(clean ? 20 : 12, 'Speaking drill') }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0">
          <SectionTitle>Helpful lines for hard moments</SectionTitle>
          <div className="card divide-y divide-line">
            {SCRIPTS.map((s, i) => (
              <div key={i} className="flex gap-3 p-4">
                <MessageCircleQuestion size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-brand-2" aria-hidden />
                <div>
                  <div className="text-[12px] font-semibold text-sub">When {s.when.toLowerCase()}</div>
                  <p className="mt-0.5 text-[14px]">"{s.say}"</p>
                </div>
              </div>
            ))}
          </div>

          <SectionTitle>Tips from good defenders</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {TIPS.map(([t, d]) => (
              <div key={t} className="card flex gap-3 p-4">
                <Lightbulb size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#b38a00]" aria-hidden />
                <div>
                  <div className="text-[13px] font-semibold">{t}</div>
                  <div className="text-[12px] leading-snug text-sub">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <SectionTitle right={<span className="text-[12px] text-sub">{done} of {CHECKLIST.length}</span>}>Defense-day checklist</SectionTitle>
          <section className="card p-4">
            <ProgressBar value={(done / CHECKLIST.length) * 100} color="bg-yellow" className="mb-2 h-1.5" />
            {CHECKLIST.map((c, i) => (
              <Checkbox key={i} checked={!!checked[i]} strike label={c}
                onChange={(v) => update((s) => ({ ...s, profile: { ...s.profile, checklist: { ...(s.profile.checklist || {}), [i]: v } } }))} />
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}

function Breathing({ onDone }) {
  const [on, setOn] = useState(false)
  const [step, setStep] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [finished, setFinished] = useState(false)
  const STEPS = ['Breathe in', 'Hold', 'Breathe out', 'Hold']
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (!on) return
    const t = setInterval(() => {
      setStep((s) => {
        if (s === 3) setRounds((r) => r + 1)
        return (s + 1) % 4
      })
    }, 4000)
    return () => clearInterval(t)
  }, [on])

  useEffect(() => {
    if (rounds >= 4 && on) {
      setOn(false)
      setFinished(true)
      doneRef.current()
    }
  }, [rounds, on])

  const big = on && (step === 0 || step === 1)
  return (
    <section className="card mt-0 p-5">
      <div className="flex items-start gap-3">
        <IconBox icon={Wind} tone="blue" size="sm" />
        <div>
          <h2 className="text-[15px] font-semibold">Box breathing</h2>
          <p className="text-[12px] text-sub">One minute. Use it right before you enter the room.</p>
        </div>
      </div>
      <div className="my-5 grid h-36 place-items-center">
        <div className={`grid place-items-center rounded-full border-2 border-blue/60 bg-blue-soft transition-all ease-in-out ${big ? 'h-36 w-36' : 'h-20 w-20'}`} style={{ transitionDuration: '4000ms' }}>
          <span className="text-[12px] font-semibold text-blue">{on ? STEPS[step] : finished ? 'Done' : 'Ready'}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-sub">{on ? `Round ${Math.min(rounds + 1, 4)} of 4` : '4 rounds · 4 seconds each step'}</span>
        <button className={on ? 'btn-ghost' : 'btn-primary'} onClick={() => { setOn(!on); setStep(0); setRounds(0); setFinished(false) }}>{on ? 'Stop' : 'Start'}</button>
      </div>
    </section>
  )
}

function SpeakDrill({ onDone }) {
  const [prompt, setPrompt] = useState(PROMPTS[0])
  const [text, setText] = useState('')
  const [rec, setRec] = useState(false)
  const [secs, setSecs] = useState(0)
  const [report, setReport] = useState(null)
  const recRef = useRef(null)
  const startRef = useRef(0)

  useEffect(() => {
    if (!rec) return
    const t = setInterval(() => setSecs(Math.round((Date.now() - startRef.current) / 1000)), 250)
    return () => clearInterval(t)
  }, [rec])

  function start() {
    setText('')
    setReport(null)
    startRef.current = Date.now()
    setSecs(0)
    setRec(true)
    recRef.current = startListening({ onText: setText, onEnd: () => setRec(false) })
  }

  function stop() {
    recRef.current?.stop()
    setRec(false)
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const minutes = Math.max((Date.now() - startRef.current) / 60000, 1 / 60)
    const f = countFillers(text)
    setReport({ words, wpm: Math.round(words / minutes), fillers: f })
    if (words > 5) onDone(f.total <= 1)
  }

  return (
    <section className="card p-5">
      <div className="flex items-start gap-3">
        <IconBox icon={Mic} tone="yellow" size="sm" />
        <div>
          <h2 className="text-[15px] font-semibold">Speaking drill</h2>
          <p className="text-[12px] text-sub">Answer out loud. We measure your pace and filler words.</p>
        </div>
      </div>
      <div className="my-4 rounded-md border border-line bg-bg p-4 text-[15px] font-medium">{prompt}</div>
      {!canListen ? (
        <p className="text-[12px] text-sub">Voice works best in Chrome on Android or desktop. You can still practice out loud with the prompt above.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {rec
            ? <button className="btn border border-red bg-red-soft text-red" onClick={stop}><Square size={13} className="fill-current" /> Stop · {secs}s</button>
            : <button className="btn-primary" onClick={start}><Mic size={16} /> Start speaking</button>}
          <button className="btn-ghost" onClick={() => { setPrompt(PROMPTS[(PROMPTS.indexOf(prompt) + 1) % PROMPTS.length]); setReport(null); setText('') }}><RefreshCw size={15} /> New prompt</button>
        </div>
      )}
      {text && <p className="mt-3 text-[13px] text-sub">{text}</p>}
      {report && (
        <div className="fade-up mt-4 grid grid-cols-3 divide-x divide-line rounded-md border border-line">
          <Stat label="Words per min" value={report.wpm} good={report.wpm >= 110 && report.wpm <= 160} hint={report.wpm > 160 ? 'Slow down' : report.wpm < 110 ? 'A little slow' : 'Good pace'} />
          <Stat label="Filler words" value={report.fillers.total} good={report.fillers.total <= 1} hint={report.fillers.total <= 1 ? 'Clean' : Object.keys(report.fillers.found).join(', ')} />
          <Stat label="Words" value={report.words} good={report.words >= 20} hint={report.words >= 20 ? 'Solid' : 'Say more'} />
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, good, hint }) {
  return (
    <div className="p-3 text-center">
      <div className={`text-[20px] font-bold ${good ? 'text-brand' : 'text-[#8a6a00]'}`}>{value}</div>
      <div className="text-[11px] text-sub">{label}</div>
      <div className="truncate text-[11px]">{hint}</div>
    </div>
  )
}
