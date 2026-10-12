import { useEffect, useRef, useState } from 'react'
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Confidence lab</p>
        <h1 className="text-2xl font-bold">💪 Don't be shy. Be ready.</h1>
        <p className="text-muted">Confidence comes from preparation plus practice speaking out loud. Train both here.</p>
      </div>

      <Breathing onDone={() => addXP(10, 'Calm mind')} />
      <SpeakDrill onDone={(clean) => addXP(clean ? 20 : 12, 'Speaking drill')} />

      <section>
        <h2 className="mb-2 text-sm uppercase tracking-wider text-muted">Lifesaver lines</h2>
        <div className="space-y-2">
          {SCRIPTS.map((s, i) => (
            <div key={i} className="card p-4">
              <div className="text-xs font-bold uppercase text-gold">When {s.when.toLowerCase()}</div>
              <p className="mt-1">"{s.say}"</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm uppercase tracking-wider text-muted">Pro tips</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {TIPS.map(([t, d]) => (
            <div key={t} className="card p-4">
              <div className="font-bold text-mint">{t}</div>
              <div className="text-sm text-[#cfd4f5]">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">✅ Defense-day checklist</h2>
          <span className="font-mono text-sm text-mint">{done}/{CHECKLIST.length}</span>
        </div>
        {CHECKLIST.map((c, i) => (
          <label key={i} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-panel2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--color-mint)]"
              checked={!!checked[i]}
              onChange={(e) => update((s) => ({ ...s, profile: { ...s.profile, checklist: { ...checked, [i]: e.target.checked } } }))}
            />
            <span className={checked[i] ? 'text-muted line-through' : ''}>{c}</span>
          </label>
        ))}
      </section>
    </div>
  )
}

function Breathing({ onDone }) {
  const [on, setOn] = useState(false)
  const [step, setStep] = useState(0)
  const [rounds, setRounds] = useState(0)
  const STEPS = ['Breathe in', 'Hold', 'Breathe out', 'Hold']

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
      onDone()
    }
  }, [rounds, on, onDone])

  const big = step === 0 || step === 1
  return (
    <section className="card p-5 text-center">
      <h2 className="font-bold">🫁 Box breathing · 1 minute</h2>
      <p className="text-sm text-muted">Use this right before you enter the room.</p>
      <div className="my-6 grid h-40 place-items-center">
        <div className={`grid place-items-center rounded-full border-2 border-mint bg-mint/10 transition-all ease-in-out ${big && on ? 'h-40 w-40' : 'h-20 w-20'}`} style={{ transitionDuration: '4000ms' }}>
          <span className="text-sm font-bold text-mint">{on ? STEPS[step] : rounds >= 4 ? 'Nice ✓' : 'Ready'}</span>
        </div>
      </div>
      <button className={on ? 'btn-ghost' : 'btn-primary'} onClick={() => { setOn(!on); setStep(0); setRounds(0) }}>{on ? `Stop (${rounds}/4)` : 'Start'}</button>
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
    const wpm = Math.round(words / minutes)
    setReport({ words, wpm, fillers: f })
    if (words > 5) onDone(f.total <= 1)
  }

  return (
    <section className="card p-5">
      <h2 className="font-bold">🎙 Speaking drill</h2>
      <p className="text-sm text-muted">Say it out loud. We count your speed and filler words.</p>
      <div className="my-4 rounded-xl bg-panel2 p-4 text-lg font-medium">"{prompt}"</div>
      {!canListen ? (
        <p className="text-sm text-gold">Voice works best in Chrome (Android or desktop). You can still practice out loud with the prompt above.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {rec ? <button className="btn animate-pulse bg-rose text-ink" onClick={stop}>■ Stop · {secs}s</button> : <button className="btn-primary" onClick={start}>🎤 Start talking</button>}
          <button className="btn-ghost" onClick={() => { setPrompt(PROMPTS[(PROMPTS.indexOf(prompt) + 1) % PROMPTS.length]); setReport(null); setText('') }}>New prompt</button>
        </div>
      )}
      {text && <p className="mt-3 text-sm text-[#cfd4f5]">{text}</p>}
      {report && (
        <div className="pop mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Words/min" value={report.wpm} good={report.wpm >= 110 && report.wpm <= 160} hint={report.wpm > 160 ? 'slow down' : report.wpm < 110 ? 'a bit slow' : 'great pace'} />
          <Stat label="Fillers" value={report.fillers.total} good={report.fillers.total <= 1} hint={report.fillers.total <= 1 ? 'clean!' : Object.keys(report.fillers.found).join(', ')} />
          <Stat label="Words" value={report.words} good={report.words >= 20} hint={report.words >= 20 ? 'solid' : 'say more'} />
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, good, hint }) {
  return (
    <div className="rounded-xl bg-panel2 p-3">
      <div className={`font-mono text-2xl font-bold ${good ? 'text-mint' : 'text-gold'}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xs">{hint}</div>
    </div>
  )
}
