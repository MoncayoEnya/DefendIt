# DefendIt – Thesis Defense Trainer

Upload your thesis (PDF, Word or .txt) and train for your defense like a game.
Works on computer and phone (installable as an app). 100% free.

## Features
- **Study guide**: chapter summaries, key terms, likely panel questions, weak spots, an opening statement to practice, and **readiness by chapter** (the overview shows your weakest chapter).
- **Flashcards**: Flip and Type modes with spaced repetition.
- **Match & Link**: drag terms to their chapter or definition (tap-to-place on phones).
- **Typing defense**: type falling terms before they hit your base; definition waves every third wave.
- **Practice panel**: three AI panelists, voice or typed answers, filler-word counter, Pressure mode.
- **Group mode**: split questions among groupmates by chapter, take turns on one device, track each member's practice.
- **Confidence lab**: breathing, speaking drill, helpful lines, defense-day checklist.
- **Defense countdown**: set your defense date and get a day-by-day prep plan (Learn → Practice → Polish → Final prep).
- **Smart Today's focus**: tasks tick themselves off when you actually do them (cards, chapters, panel answers…).
- **Daily challenge**: 5 key terms + 1 panel question every day, bonus XP.
- **Explain it simply**: explain your study in plain words; get a clarity score, jargon list and (with AI) a simpler version.
- **Slide checker**: upload your PowerPoint (.pptx); finds wordy slides, missing titles and missing defense parts, optional AI review.
- **Badges** (19), XP levels, daily streak, readiness score from real activity.
- **Accounts (email or Google), cloud saving and class leaderboard** (optional, free Supabase): see `docs/CLOUD_SETUP.md`.
- **Scanned PDFs and photos** are read with built-in OCR (no internet needed after install).
- **Android app / Play Store** with native voice answers: see `docs/PLAY_STORE.md`.

## AI (Gemini + Groq, free)
- **Built-in AI (recommended)**: put your free keys on the server (`GEMINI_API_KEY`, `GROQ_API_KEY`).
  Every student gets AI automatically, with nothing to set up, and the keys stay secret. See `docs/DEPLOY.md`.
  Groq (fast) handles short tasks; Gemini handles whole theses; each backs up the other.
- **Personal key (optional)**: a student can paste their own Gemini key in Settings.
- **Offline mode**: with no AI at all, everything still works with simpler text analysis.

## Run it on your computer
Requires Node.js 20+ (free from https://nodejs.org).

```bash
npm install
npm run dev
```
`npm install` also copies the OCR files into `public/ocr` automatically.

Copy `.env.example` to `.env` and add your AI keys (and optionally Supabase keys). See `docs/DEPLOY.md`.
Open the link it shows (e.g. http://localhost:5173).
To test on your phone, connect to the same Wi-Fi and open the "Network" link it shows.

## Put it online for free
Follow `docs/DEPLOY.md`: push to GitHub, import on Vercel, add your AI keys as environment variables, deploy.
Open the link on your phone → "Add to Home screen".

## Project structure
```
src/
  App.jsx                    routing, uploads, XP, levels, streak
  components/Layout.jsx      DesktopHeader, MobileHeader, BottomNavigation, profile menu, toast
  components/Dashboard.jsx   WelcomeSection, ThesisUploadCard, SessionCard, ReadinessCard, FocusChecklist, ThesisDocumentCard
  components/ui.jsx          CircularProgress, ProgressBar, Checkbox and other building blocks
  lib/progress.js            readiness score (knowledge, practice, confidence) from real activity
  lib/extract.js             reads PDF / Word / txt in the browser
  lib/offline.js             offline study pack builder (no AI)
  lib/ai.js                  Gemini prompts: study pack + answer grading
  lib/voice.js               speech-to-text + filler word counter
  lib/storage.js             saving progress, levels, spaced repetition
  lib/demo.js                sample thesis
  lib/chapters.js            links terms/questions to chapters, per-chapter scores
  lib/badges.js              badge rules
  lib/group.js               group mode: splitting questions, member stats
  lib/cloud.js               Supabase: sign-in (email + Google), cloud saving, leaderboard
  lib/activity.js            daily activity log (drives Today's focus and the plan)
  lib/plan.js                defense countdown and day-by-day prep plan
  lib/plain.js               offline plain-language checker
  lib/slides.js              reads and checks PowerPoint files
  pages/                     Overview, Guide, Practice, Flashcards, MatchLink, TypingDefense, MockPanel, Group,
                             Confidence, Badges, Account, Leaderboard, More, Settings,
                             Plan, Daily, Explain, Slides
api/ai.js                    server AI function (keeps the Gemini/Groq keys secret, rate limit, fallback)
vercel.json                  lets the AI function run up to 60 seconds
supabase/schema.sql          database tables and security rules
docs/                        DEPLOY.md, CLOUD_SETUP.md, PLAY_STORE.md
android/                     Capacitor Android project (icons and splash included)
scripts/copy-ocr.mjs         copies OCR files into public/ocr after npm install
```

## Design
Light, clean dashboard style. Colors live in `src/index.css` (`@theme`): primary green #075B3D, background #F4F7F9, blue for practice, yellow for confidence. Icons come from Lucide (`lucide-react`), no emojis.

## Ideas for next versions
- Push notifications for the daily challenge and plan reminders
- Export your study guide as a printable PDF reviewer

## Notes
- Everything is saved in the browser (localStorage). Clearing browser data erases progress.
- Voice features work best in Chrome (Android or desktop).
- Free AI tiers have daily limits. The study pack is generated once per file and saved, so it uses very little.
