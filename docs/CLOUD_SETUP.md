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
