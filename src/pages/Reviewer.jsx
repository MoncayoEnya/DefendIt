import { useState } from 'react'
import { Printer } from 'lucide-react'
import { BackLink, Checkbox, PageHeader } from '../components/ui.jsx'
import { fillProfile, splitBlanks } from '../lib/profile.js'

const SECTIONS = [
  ['summary', 'Study summary'],
  ['opening', 'Opening line'],
  ['chapters', 'Chapter key points'],
  ['terms', 'Key terms'],
  ['questions', 'Panel questions and answer guides'],
  ['notes', 'Blank lines for notes'],
]

const points = (text) => (text || '').split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter((s) => s.length > 15)

export default function Reviewer({ state, pack, go }) {
  const [on, setOn] = useState(() => Object.fromEntries(SECTIONS.map(([k]) => [k, true])))
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="max-w-4xl">
      <div className="print:hidden">
        <BackLink onClick={() => go('guide')}>Study guide</BackLink>
        <PageHeader eyebrow="Printable reviewer" title="Print or save as PDF" desc="Choose what to include, then print it or save it as a PDF to study offline." />
        <section className="card mb-4 p-4">
          <div className="grid gap-x-6 sm:grid-cols-2">
            {SECTIONS.map(([k, label]) => (
              <Checkbox key={k} checked={on[k]} onChange={(v) => setOn({ ...on, [k]: v })} label={label} />
            ))}
          </div>
          <button className="btn-primary mt-3 h-11 w-full sm:w-auto" onClick={() => window.print()}><Printer size={16} /> Print or save as PDF</button>
          <p className="mt-2 text-[12px] text-sub">To get a PDF, choose "Save as PDF" as the printer. On a phone: browser menu, then Share or Print.</p>
        </section>
      </div>

      {/* The paper. Always light, even in dark mode. */}
      <article className="paper rounded-lg border border-line p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none md:p-10">
        <header className="border-b-2 border-brand pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand">DefendIt reviewer</p>
          <h1 className="mt-1 text-[22px] font-bold leading-tight">{pack.title}</h1>
          <p className="mt-1 text-[12px] text-sub">{pack.fileName} · {date}</p>
        </header>

        {on.summary && pack.overview && (
          <Block title="Study summary">
            <ol className="list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed">
              {points(pack.overview).map((p, i) => <li key={i}>{p}</li>)}
            </ol>
          </Block>
        )}

        {on.opening && pack.elevatorPitch && (
          <Block title="Opening line">
            <p className="rounded border-l-4 border-brand bg-brand-soft/50 p-3 text-[13px] italic leading-relaxed">{splitBlanks(fillProfile(pack.elevatorPitch, state.profile)).map((p) => (p.blank ? '______________' : p.text)).join('')}</p>
          </Block>
        )}

        {on.chapters && (
          <Block title="Chapter key points">
            <div className="space-y-3">
              {pack.sections.map((s, i) => (
                <div key={i} className="break-inside-avoid">
                  <h3 className="text-[14px] font-semibold">{i + 1}. {s.title}</h3>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] leading-snug">
                    {(s.keyPoints?.length ? s.keyPoints : points(s.summary).slice(0, 3)).map((k, j) => <li key={j}>{k}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Block>
        )}

        {on.terms && pack.terms.length > 0 && (
          <Block title="Key terms">
            <table className="w-full border-collapse text-[12.5px]">
              <tbody>
                {pack.terms.map((t, i) => (
                  <tr key={i} className="break-inside-avoid border-b border-line align-top">
                    <td className="w-[32%] py-1.5 pr-3 font-semibold">{t.term}</td>
                    <td className="py-1.5 leading-snug">{t.definition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Block>
        )}

        {on.questions && pack.questions.length > 0 && (
          <Block title="Panel questions">
            <ol className="space-y-2.5">
              {pack.questions.map((q, i) => (
                <li key={i} className="break-inside-avoid">
                  <p className="text-[13px] font-semibold">{i + 1}. {q.question}</p>
                  {q.idealPoints?.length > 0 && (
                    <p className="mt-0.5 pl-4 text-[12px] text-sub">Cover: {q.idealPoints.join('; ')}</p>
                  )}
                </li>
              ))}
            </ol>
          </Block>
        )}

        {on.notes && (
          <Block title="My notes">
            <div aria-hidden>{Array.from({ length: 10 }, (_, i) => <div key={i} className="h-7 border-b border-line" />)}</div>
          </Block>
        )}
      </article>
    </div>
  )
}

function Block({ title, children }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-brand">{title}</h2>
      {children}
    </section>
  )
}
