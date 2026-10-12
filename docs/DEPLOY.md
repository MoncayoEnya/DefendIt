# Put DefendIt online with built-in AI (free)

After this, anyone who opens your link gets the AI automatically. Students do not need their own key.
Your keys stay secret on the server.

How it works: the app sends AI requests to `/api/ai` (the file `api/ai.js`). That small server
function adds your keys and talks to the AI. Two free providers work together:
- **Groq**: very fast, used first for short tasks (panel grading, Explain it simply, slide reviews)
- **Gemini**: handles long input, used for building the study pack from a whole thesis
If one is busy or hits its free limit, the other is tried automatically. One key is enough to start.

---

## 1. Get your free AI keys
- **Gemini**: https://aistudio.google.com/apikey → Create API key (if it asks for a project, create one
  at https://console.cloud.google.com first).
- **Groq** (recommended as well): https://console.groq.com/keys → sign in → **Create API Key** → copy it.
  Groq shows the key only once, so save it somewhere safe.

## 2. Try it on your computer first
1. In the project folder, copy `.env.example` to a new file named `.env`.
2. Paste your keys:
   ```
   GEMINI_API_KEY=your-gemini-key
   GROQ_API_KEY=your-groq-key
   ```
3. Restart the app: press Ctrl + C in the terminal, then `npm run dev`.
4. Open Settings. The AI assistant should say **"On · provided by the app"**.
5. Upload your thesis. The study guide is now built by the AI.

## 3. Put it online with Vercel
1. Push the project to GitHub (`git add .`, `git commit -m "..."`, `git push`).
   `.env` is ignored by Git, so your keys are **not** uploaded. That is correct.
2. Go to https://vercel.com, sign in with GitHub, click **Add New → Project**, and import `defendit`.
3. Vercel detects Vite automatically (build command `npm run build`, output `dist`).
4. Before clicking Deploy, open **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `GEMINI_API_KEY` | your Gemini key |
   | `GROQ_API_KEY` | your Groq key |
   | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | only if you set up accounts |
5. Click **Deploy**. After a minute you get a link like `https://defendit-xxxx.vercel.app`.
6. Open the link → Settings → it should say **"On · provided by the app"**.

Changed or added a key later? Vercel → your project → **Settings → Environment Variables**,
edit it, then **Deployments → ⋯ → Redeploy**.

## 4. Protecting your free limits
- Each student (by internet address) can make **60 AI requests per hour** by default.
  Change it with the variable `AI_LIMIT_PER_HOUR`.
- Only your own site (and the Android app) may call `/api/ai`. Other websites are blocked.
- Students can still paste their own Gemini key in Settings if the shared AI is busy.
- Check usage anytime in Google AI Studio and the Groq console.

Note: the hourly limit is kept in the server's memory, so it resets when Vercel restarts the
function. That is fine for a class or a thesis demo. For a big public launch, use a database-backed
limit (for example Upstash Redis on Vercel's free tier).

## 5. The Android app (Capacitor route)
The Android app has no server of its own, so it calls your live site's AI.
Before building it, add your Vercel link to `.env`:
```
VITE_API_BASE=https://defendit-xxxx.vercel.app
```
then run `npm run android:sync`. (The PWABuilder route in `PLAY_STORE.md` needs nothing extra.)

## Troubleshooting
| What you see | Fix |
|---|---|
| Settings says "Offline mode" on the live site | The key variables are missing or misspelled in Vercel. Add them and redeploy. |
| "The free AI limit was reached" | Both providers are at their free limit. Wait a minute, or add the other provider's key. |
| Gemini error "model not found" | Google renamed the model. Add `GEMINI_MODEL` with the current name from AI Studio. |
| Groq error about the model | Groq retired the model. Add `GROQ_MODEL` with a current model from https://console.groq.com/docs/models |
| Study pack takes long or times out | Very long theses can take up to a minute. `vercel.json` already allows 60 seconds. |
