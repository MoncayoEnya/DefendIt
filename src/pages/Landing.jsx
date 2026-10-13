import { useState } from 'react'
import {
  ArrowRight, BookOpen, BookOpenText, Brain, CalendarDays, ClipboardList, Cloud, FileCheck2, FileText, Flame, Layers,
  MessageSquareText, Mic, MonitorSmartphone, Moon, Plus, Printer, ScanText, Target, Trophy, UserRound, Users, WifiOff, Wind,
} from 'lucide-react'
import { LogoMark } from '../components/Logo.jsx'
import photo from '../assets/landing-study.webp'
import photoMobile from '../assets/landing-study-m.webp'

const PANEL = [
  {
    who: 'Panelist on methodology',
    q: 'Why did you choose this sample size, and how did you get it?',
    a: ['Name the formula you used, like Slovin\'s, and the margin of error.', 'Say the total population you started from.', 'Explain why that number is enough for your design.'],
  },
  {
    who: 'Panelist on results',
    q: 'What is the biggest limitation of your study?',
    a: ['Say it plainly. Panels trust students who admit limits.', 'Explain what you did to reduce its effect.', 'Suggest how a future study could fix it.'],
  },
  {
    who: 'Your adviser',
    q: 'How is your study different from the ones in your literature review?',
    a: ['Point to the gap you found in past studies.', 'Name what is new: your setting, your respondents or your method.', 'Say who benefits from that difference.'],
  },
]

const GROUPS = [
  {
    name: 'Learn',
    blurb: 'Understand every part of your paper.',
    items: [
      [BookOpen, 'A study guide from your thesis', 'Chapter summaries, key terms, likely panel questions and the parts a panel may attack.'],
      [BookOpenText, 'Read my thesis', 'Every paragraph explained in plain words. Stuck? Ask for the version a 10-year-old would get.'],
      [Layers, 'Flashcards and games', 'Flashcards that repeat what you miss, Match and Link, and a timed typing game.'],
    ],
  },
  {
    name: 'Practice',
    blurb: 'Say your answers out loud before the real day.',
    items: [
      [Mic, 'Mock panel', 'Three AI panelists ask about your study. Answer by voice or typing and get feedback on each answer.'],
      [MessageSquareText, 'Explain it simply', 'Describe your study in everyday words and see how clear you were.'],
      [Users, 'Group practice', 'Split the questions among groupmates and take turns on one phone.'],
    ],
  },
  {
    name: 'Prepare',
    blurb: 'Get the details right before you walk in.',
    items: [
      [CalendarDays, 'A plan up to your defense date', 'Set the date and get a short list of tasks for each day.'],
      [Wind, 'Confidence lab', 'Breathing practice, your opening line and a checklist for defense day.'],
      [FileCheck2, 'Slide checker', 'Finds crowded slides and missing defense sections in your PowerPoint.'],
    ],
  },
]

const STEPS = [
  ['Upload your thesis', 'PDF, Word or text. Scanned pages and phone photos work too.'],
  ['Practice a little every day', 'Use the guide, the games and the panel. Readiness by chapter shows what to study next.'],
  ['Walk in ready', 'Follow your plan to the big day and print a reviewer for one last look.'],
]

const TOOLS = [
  [Flame, 'Daily challenge', 'Five terms and one panel question, about five minutes.'],
  [Target, 'Readiness by chapter', 'See your weakest chapter at a glance.'],
  [Trophy, 'Badges and streaks', 'Small rewards for showing up every day.'],
  [Printer, 'Printable reviewer', 'Your study guide on paper or as a PDF.'],
  [ClipboardList, 'Evaluation survey', 'SUS and ISO 25010 results for your own Results chapter.'],
  [CalendarDays, 'Reminders', 'A daily nudge in your calendar or on your Android phone.'],
  [ScanText, 'Scanned files', 'Reads photos and scanned PDFs with built-in text recognition.'],
  [WifiOff, 'Offline mode', 'The study guide and games still work without AI.'],
  [Cloud, 'Cloud saving', 'Sign in with email or Google and join a class leaderboard.'],
  [UserRound, 'Your profile', 'Your name and groupmates fill in your opening line.'],
  [Moon, 'Dark mode', 'Easier on the eyes for late-night review.'],
  [MonitorSmartphone, 'Phone and computer', 'Install it on your phone. It also has an Android app.'],
]

const FAQ = [
  ['Is DefendIt free?', 'Yes. There is no subscription and no ads. The AI features run on free services, so very heavy use in one day may hit a limit. Offline mode keeps working when that happens.'],
  ['What files can I upload?', 'PDF, Word (.docx) and plain text. Scanned PDFs and photos of pages are read with built-in text recognition. The slide checker takes PowerPoint (.pptx).'],
  ['Does it work without internet?', 'The study guide, flashcards and games work offline. AI feedback and cloud saving need a connection.'],
  ['Can my research group use it together?', 'Yes. Group mode splits the panel questions by chapter, lets you take turns on one device and tracks each member.'],
  ['Will it replace my adviser?', 'No. DefendIt helps you practice. AI feedback can be wrong, so check it against your paper and your adviser\'s advice.'],
]

export default function Landing({ start, sample }) {
  const [qi, setQi] = useState(0)
  const [open, setOpen] = useState(false)
  const card = PANEL[qi]
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })

  return (
    <div className="landing min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 md:px-6">
          <a href="#welcome" className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink" aria-label="DefendIt home">
            <LogoMark size={28} /> DefendIt
          </a>
          <nav className="flex items-center gap-1" aria-label="Page sections">
            <button className="hidden h-10 rounded-md px-3 text-[14px] font-medium text-ink-2 hover:bg-bg md:block" onClick={() => jump('features')}>Features</button>
            <button className="hidden h-10 rounded-md px-3 text-[14px] font-medium text-ink-2 hover:bg-bg md:block" onClick={() => jump('how')}>How it works</button>
            <button className="hidden h-10 rounded-md px-3 text-[14px] font-medium text-ink-2 hover:bg-bg md:block" onClick={() => jump('faq')}>Questions</button>
            <button className="btn-primary ml-2 !h-10 !text-[14px]" onClick={start}>Open DefendIt</button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero: photo with the words on the empty left side, and a real panel question to try */}
        <section className="relative overflow-hidden border-b border-line" aria-labelledby="hero-title">
          <picture>
            <source media="(min-width: 900px)" srcSet={photo} />
            <img src={photoMobile} alt="Three students reviewing their thesis together at a laptop" className="h-64 w-full object-cover object-[70%_30%] min-[900px]:absolute min-[900px]:inset-0 min-[900px]:h-full min-[900px]:object-center" width="1600" height="907" fetchPriority="high" />
          </picture>
          <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-white via-white/85 to-transparent min-[900px]:block" aria-hidden />

          <div className="relative mx-auto max-w-[1180px] px-4 pb-10 pt-8 md:px-6 min-[900px]:pb-24 min-[900px]:pt-24">
            <div className="max-w-[540px]">
              <h1 id="hero-title" className="font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.01em] text-ink md:text-[60px]">
                Know your thesis well enough to defend it.
              </h1>
              <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink-2">
                Upload your paper. DefendIt turns it into a study guide, flashcards and a mock panel that asks the questions your real panel might ask.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button className="btn-primary !h-12 !px-6 !text-[15px]" onClick={start}>Start preparing <ArrowRight size={17} /></button>
                <button className="btn-ghost !h-12 !px-6 !text-[15px]" onClick={sample}>Try it with a sample thesis</button>
              </div>
              <p className="mt-4 text-[13px] text-sub">Free for students. Works on your phone and computer.</p>
            </div>

            {/* the one interactive moment on the page */}
            <div className="mt-10 max-w-[440px] min-[900px]:absolute min-[900px]:bottom-8 min-[900px]:w-[400px] min-[900px]:right-6 min-[900px]:mt-0 min-[1180px]:right-[max(24px,calc((100vw-1180px)/2+24px))]">
              <article className="rounded-xl border border-line bg-white p-5 shadow-[0_18px_40px_-18px_rgba(7,91,61,.35)]" aria-live="polite">
                <div className="flex items-center gap-2 text-[13px] text-sub">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-brand"><Users size={15} aria-hidden /></span>
                  {card.who}
                </div>
                <p className="mt-3 font-serif text-[21px] leading-snug text-ink">{card.q}</p>
                {open && (
                  <div className="mt-4 rounded-lg bg-brand-soft p-3.5">
                    <p className="text-[13px] font-semibold text-brand">A strong answer covers</p>
                    <ul className="mt-1.5 space-y-1.5 text-[14px] leading-snug text-ink-2">
                      {card.a.map((x) => <li key={x} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />{x}</li>)}
                    </ul>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button className="text-left text-[14px] font-semibold text-brand hover:underline" onClick={() => setOpen(!open)} aria-expanded={open}>
                    {open ? 'Hide the answer' : 'Show a strong answer'}
                  </button>
                  <button className="btn-ghost !h-9 shrink-0 !text-[13px]" onClick={() => { setQi((qi + 1) % PANEL.length); setOpen(false) }}>
                    Next question <span className="hidden text-sub sm:inline">{qi + 1} of {PANEL.length}</span>
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <div className="border-b border-line bg-bg">
          <ul className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-4 gap-y-3 px-4 py-5 text-[14px] font-medium text-ink-2 md:grid-cols-4 md:px-6">
            {[[FileText, 'Built from your own thesis'], [Brain, 'Feedback on every answer'], [MonitorSmartphone, 'Phone or computer'], [WifiOff, 'Studies work offline']].map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-2.5"><Icon size={18} className="shrink-0 text-brand" aria-hidden />{t}</li>
            ))}
          </ul>
        </div>

        <section id="features" className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-[620px]">
            <h2 className="font-serif text-[32px] font-semibold leading-tight md:text-[42px]">From reading your paper to answering out loud</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-sub">DefendIt helps in three ways. Use the ones you need.</p>
          </div>
          <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-8">
            {GROUPS.map((g) => (
              <div key={g.name}>
                <div className="border-t-2 border-brand pt-4">
                  <h3 className="text-[19px] font-semibold">{g.name}</h3>
                  <p className="mt-0.5 text-[14px] text-sub">{g.blurb}</p>
                </div>
                <ul className="mt-6 space-y-6">
                  {g.items.map(([Icon, t, d]) => (
                    <li key={t} className="flex gap-3.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Icon size={19} strokeWidth={1.8} aria-hidden /></span>
                      <div>
                        <h4 className="text-[15px] font-semibold leading-snug">{t}</h4>
                        <p className="mt-1 text-[14px] leading-relaxed text-sub">{d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-16 bg-brand text-white">
          <div className="mx-auto max-w-[1180px] px-4 py-16 md:px-6 md:py-20">
            <h2 className="font-serif text-[32px] font-semibold leading-tight md:text-[42px]">How it works</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="relative md:pt-12">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[15px] font-bold text-brand md:absolute md:left-0 md:top-0">{i + 1}</span>
                  {i < STEPS.length - 1 && <span className="absolute left-12 right-0 top-[18px] hidden h-px bg-white/30 md:block" aria-hidden />}
                  <h3 className="mt-3 text-[18px] font-semibold md:mt-0">{t}</h3>
                  <p className="mt-1.5 max-w-[34ch] text-[15px] leading-relaxed text-white/80">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
            <div>
              <h2 className="font-serif text-[32px] font-semibold leading-tight md:text-[38px]">And the smaller things</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-sub">Tools that help on busy weeks, and one that helps with your Results chapter.</p>
            </div>
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {TOOLS.map(([Icon, t, d]) => (
                <li key={t} className="flex gap-3 border-b border-line py-4">
                  <Icon size={19} strokeWidth={1.8} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                  <div>
                    <h3 className="text-[15px] font-semibold">{t}</h3>
                    <p className="mt-0.5 text-[14px] leading-snug text-sub">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="scroll-mt-16 border-t border-line bg-bg">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[320px_1fr] lg:gap-16">
            <h2 className="font-serif text-[32px] font-semibold leading-tight md:text-[38px]">Questions students ask</h2>
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <Plus size={18} className="shrink-0 text-brand transition-transform group-open:rotate-45" aria-hidden />
                  </summary>
                  <p className="-mt-1 max-w-[62ch] pb-5 text-[15px] leading-relaxed text-ink-2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center md:px-6">
            <div>
              <h2 className="font-serif text-[28px] font-semibold leading-tight md:text-[34px]">Your panel will have questions. Be ready for them.</h2>
              <p className="mt-2 text-[15px] text-sub">It takes about a minute to upload your thesis and start.</p>
            </div>
            <button className="btn-primary !h-12 shrink-0 !px-6 !text-[15px]" onClick={start}>Start preparing <ArrowRight size={17} /></button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-bg">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-8 text-[13px] text-sub md:flex-row md:items-center md:justify-between md:px-6">
          <span className="flex items-center gap-2 font-semibold text-ink"><LogoMark size={20} /> DefendIt</span>
          <p>Free thesis defense practice, made for students.</p>
          <button className="self-start font-semibold text-brand hover:underline md:self-auto" onClick={start}>Open the app</button>
        </div>
      </footer>
    </div>
  )
}
