# Putting DefendIt on the Google Play Store

Publishing on Google Play needs a **Google Play Console developer account**, which has a
**one-time US$25 fee** (https://play.google.com/console). Everything else below is free.

There are two ways. **Route A is recommended**, because the app runs inside real Chrome,
so every feature works, including voice answers and the filler-word counter.

---

## Route A (recommended): PWABuilder, from your live website

The app already has everything this needs: a web manifest, PNG icons and a service worker.

1. Put the app online first (see README: deploy on Vercel). You need an `https://` link.
2. Open https://www.pwabuilder.com, paste your link, and click **Start**.
3. Click **Package for stores** → **Android** → **Generate package**.
   - Package ID: `com.defendit.app` (or your own, e.g. `com.yourname.defendit`)
   - App name: `DefendIt`
4. Download the zip. It contains:
   - an `.aab` file (this is what you upload to Google Play)
   - a `signing.keystore` file and its passwords. **Back these up**: you need them for every update.
   - `assetlinks.json`
5. Upload `assetlinks.json` so Android trusts your site (this removes the browser address bar):
   put it in this project at `public/.well-known/assetlinks.json`, then redeploy.
   Check it opens at `https://your-site/.well-known/assetlinks.json`.
6. In Play Console: **Create app** → fill in name, language, free app →
   **Production** (or **Internal testing** first) → **Create new release** → upload the `.aab`.
7. Complete the store listing: short and full description, the 512×512 icon (`public/icon-512.png`),
   at least 2 phone screenshots, a feature graphic (1024×500), a privacy policy link,
   content rating questionnaire, and target audience.
8. Submit for review. New apps usually take a few days.

Updates: just redeploy the website. The Play Store app shows the new version automatically.

---

## Route B: Capacitor (a real Android project, already set up in `android/`)

Use this if you want an app that bundles all files inside (works fully offline from the first open)
or want to add native features later.

Requirements: **Android Studio** (free, https://developer.android.com/studio).

```bash
npm install
npm run android:sync     # builds the web app and copies it into android/
npm run android:open     # opens the project in Android Studio
```

In Android Studio:
- Press **Run** to test on a phone (USB debugging on) or an emulator.
- For the Play Store: **Build → Generate Signed App Bundle or APK → Android App Bundle**,
  create a new key store (back it up!), and build the `.aab`. Upload it in Play Console as in Route A, step 6.

Notes for Route B:
- Run `npm run android:sync` after every code change.
- If you use cloud saving, create `.env` before syncing so the keys are included in the build.
- Voice answers use native Android plugins in this version (speech recognition and text-to-speech).
  The first time a student taps **Speak**, Android asks for microphone permission. The phone needs
  Google's speech services (preinstalled on most Android phones).
- App icons and splash screens are already generated in `android/app/src/main/res/`.

---

## Privacy policy (required by Google Play)
You can host a simple page stating: files are processed on the device; if the user signs in,
progress is stored in Supabase; if an AI key is added, document text is sent to Google Gemini
to build the study pack; no data is sold or shared. Free hosts: a GitHub Pages page or a Google Doc set to public.
