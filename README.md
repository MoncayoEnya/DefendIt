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
- **Badges** (16), XP levels, daily streak, readiness score from real activity.
- **Accounts, cloud saving and class leaderboard** (optional, free Supabase): see `docs/CLOUD_SETUP.md`.
- **Scanned PDFs and photos** are read with built-in OCR (no internet needed after install).
- **Android app / Play Store**: see `docs/PLAY_STORE.md`.

## Two modes
- **Offline mode** (default): no internet or key needed. Uses simple text analysis. Good, but basic.
- **AI mode** (recommended, free): paste a free Google Gemini API key in ⚙︎ Settings.
  Get one at https://aistudio.google.com/apikey. The key stays in your browser.

## Run it on your computer
Requires Node.js 20+ (free from https://nodejs.org).

```bash
npm install
npm run dev
```
`npm install` also copies the OCR files into `public/ocr` automatically.

Optional: copy `.env.example` to `.env` and add Supabase keys to turn on accounts and the leaderboard.
Open the link it shows (e.g. http://localhost:5173).
To test on your phone, connect to the same Wi-Fi and open the "Network" link it shows.

## Put it online for free
1. Push this folder to a GitHub repository.
2. Go to https://vercel.com (or Netlify / Cloudflare Pages), import the repo.
3. Build command: `npm run build` · Output folder: `dist`.
4. You get a free link. Open it on your phone → "Add to Home screen".

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
  lib/cloud.js               Supabase: sign-in, cloud saving, leaderboard
  pages/                     Overview, Guide, Practice, Flashcards, MatchLink, TypingDefense, MockPanel, Group,
                             Confidence, Badges, Account, Leaderboard, More, Settings
supabase/schema.sql          database tables and security rules
docs/                        CLOUD_SETUP.md, PLAY_STORE.md
android/                     Capacitor Android project (icons and splash included)
scripts/copy-ocr.mjs         copies OCR files into public/ocr after npm install
```

## Design
Light, clean dashboard style. Colors live in `src/index.css` (`@theme`): primary green #075B3D, background #F4F7F9, blue for practice, yellow for confidence. Icons come from Lucide (`lucide-react`), no emojis.

## Ideas for next versions
- Defense countdown with a day-by-day prep plan
- Slide checker: upload your PowerPoint and get feedback
- Sign in with Google
- Voice answers inside the Capacitor Android app (native speech plugin)

## Notes
- Everything is saved in the browser (localStorage). Clearing browser data erases progress.
- Voice features work best in Chrome (Android or desktop).
- Free AI tiers have daily limits. The study pack is generated once per file and saved, so it uses very little.
