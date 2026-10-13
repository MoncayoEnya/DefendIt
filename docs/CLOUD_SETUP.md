# Cloud setup: accounts, cloud saving and class leaderboard

DefendIt works fully offline without this. Do these steps once to turn on sign-in,
syncing between devices and the class leaderboard. Supabase's free plan is enough.

## 1. Create a Supabase project (free)
1. Go to https://supabase.com and sign in with GitHub or email.
2. Click **New project**. Pick any name (for example `defendit`), set a database password
   (save it somewhere), and choose the region closest to you (for the Philippines: **Southeast Asia (Singapore)**).
3. Wait about 2 minutes for the project to start.

## 2. Create the tables
1. In your project, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy everything, paste it, and click **Run**.
   You should see "Success. No rows returned."

### 2b. Survey tables (for the evaluation survey)
Open a **New query**, paste everything from `supabase/survey.sql`, and click **Run**.

## 3. Connect the app
1. In Supabase, open **Project Settings** → **API** (or **Data API**).
2. Copy the **Project URL** and the **anon / public** key.
3. In the project folder, copy `.env.example` to a new file named `.env` and paste the values:
   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. Stop the app (Ctrl + C) and run `npm run dev` again.
5. Open the profile menu → **Sign in to back up progress**, and create an account.

The anon key is designed to be public. Your data is protected by the row-level security rules in
`schema.sql`: each person can only read and change their own saved progress.
`.env` is in `.gitignore`, so it will not be uploaded to GitHub.

## 4. Email confirmation
By default Supabase sends a confirmation email when someone signs up.
- For quick testing you can turn it off: **Authentication** → **Sign In / Providers** → **Email** →
  turn off **Confirm email**.
- If you deploy the app (for example on Vercel), add your site link under
  **Authentication** → **URL Configuration** → **Site URL**, so confirmation links open your app.

## 5. Deploying with cloud features (Vercel)
In Vercel: **Project** → **Settings** → **Environment Variables**, add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values, then redeploy.

## How syncing works
- When you sign in, the app compares this device with your cloud copy and keeps the newer one.
- After that, every change is saved to the cloud a few seconds later.
- Your Gemini AI key is never uploaded. Add it on each device in Settings.

## Class leaderboard
- Open **Practice** → **Class leaderboard** and enter a class code everyone agrees on (for example `IT4A-2026`).
- Everyone with the same code sees one leaderboard: XP, best panel score, best typing score and streak.
- Only your display name and scores are shared, never your thesis.
- Set your name first in the profile menu so classmates recognize you.

## Sign in with Google (optional)
The "Continue with Google" button works after these one-time steps:

1. **Google Cloud Console** (https://console.cloud.google.com), free:
   - Create a project (any name), then open **APIs & Services → OAuth consent screen**.
     Choose **External**, fill in the app name (DefendIt), your email, and save.
   - Open **APIs & Services → Credentials → Create credentials → OAuth client ID**.
     Application type: **Web application**.
   - Under **Authorized redirect URIs** add your Supabase callback URL. Find it in Supabase:
     **Authentication → Sign In / Providers → Google** (it looks like
     `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
   - Click **Create** and copy the **Client ID** and **Client secret**.
2. **Supabase**: **Authentication → Sign In / Providers → Google** → turn it on, paste the
   Client ID and Client secret, and save.
3. **Supabase**: **Authentication → URL Configuration**:
   - **Site URL**: your live site (for example `https://defendit.vercel.app`)
   - **Redirect URLs**: add `http://localhost:5173/**` (for testing) and `https://your-site/**`.

### Google sign-in opens "localhost refused to connect" on a phone
Supabase only sends people back to addresses you allowed. If your live link is not allowed,
it falls back to the **Site URL**, which is often `http://localhost:3000`, and a phone cannot open that.
Fix in Supabase → **Authentication → URL Configuration**:
- **Site URL**: your live Vercel link, for example `https://defendit-xxxx.vercel.app` (not localhost)
- **Redirect URLs**: add `https://defendit-xxxx.vercel.app/**` and keep `http://localhost:5173/**`
- Click **Save**, then try again on the phone using the **Vercel link** (not a `192.168…` address).

Notes:
- While the Google consent screen is in "Testing" mode, only the Google accounts you add as
  test users can sign in. Click **Publish app** when you are ready for classmates.
- Google sign-in works in the browser and the installed web app (PWABuilder route).
  In the Capacitor Android app, use email sign-in, or add the deep-link setup from the Supabase docs.


## Google sign-in in the Android app

The Android app returns from Google through the app link `com.defendit.app://auth`.
In Supabase go to **Authentication > URL Configuration > Redirect URLs** and add:

```
com.defendit.app://auth
```

Optional: put your website in `.env` so sign-up and password reset emails sent from the app open the website:

```
VITE_SITE_URL=https://your-app.vercel.app
```

After changing anything here, rebuild the app: `npm run build`, `npx cap sync android`, then build the APK again in Android Studio.
