# DefendIt – Thesis Defense Trainer

Upload your thesis (PDF, Word or .txt) and train for your defense like a game.
Works on computer and phone (installable as an app). 100% free.

## Features
- **Study guide**: chapter summaries, key terms, likely panel questions, "where the panel will attack", and an opening line you can practice (with text-to-speech).
- **Flashcards**: Flip mode and Type mode, with spaced repetition, so cards you miss come back sooner.
- **Typing Defense**: terms from your thesis fall down; type them to destroy them. Every 3rd wave is a boss that shows only the definition.
- **Boss Battle: The Panel**: 3 panelists with HP bars. Answer by typing or speaking. AI grades you, writes a stronger answer and asks follow-ups. Includes a filler-word counter and Pressure mode.
- **Confidence lab**: box breathing, a speaking drill (words per minute and filler words), lifesaver lines for hard questions, pro tips, and a defense-day checklist.
- **XP, levels, daily streak, readiness score.**

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
  pages/                     Overview, Guide, Practice, Flashcards, TypingDefense, MockPanel, Confidence, More, Settings
```

## Design
Light, clean dashboard style. Colors live in `src/index.css` (`@theme`): primary green #075B3D, background #F4F7F9, blue for practice, yellow for confidence. Icons come from Lucide (`lucide-react`), no emojis.

## Ideas for next versions
- Accounts and cloud sync (Supabase or Firebase free plan)
- Group mode: split questions among groupmates
- Slide checker: upload your PPT and get feedback
- Leaderboards between classmates
- Scanned PDF support with Tesseract.js (OCR)

## Notes
- Everything is saved in the browser (localStorage). Clearing browser data erases progress.
- Voice features work best in Chrome (Android or desktop).
- Free AI tiers have daily limits. The study pack is generated once per file and saved, so it uses very little.
