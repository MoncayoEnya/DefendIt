// Accounts, cloud saving and the class leaderboard, using Supabase's free plan.
// Setup: see docs/CLOUD_SETUP.md. Without the two keys in .env, the app simply stays offline.

import { Capacitor } from '@capacitor/core'

const URL = import.meta.env.VITE_SUPABASE_URL
// Supabase calls this the "anon" key in older projects and the "publishable" key in newer ones; both work.
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
export const cloudEnabled = !!(URL && KEY)

let clientPromise = null
export function getClient() {
  if (!cloudEnabled) return Promise.resolve(null)
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } }) // pkce: Google sign-in returns a ?code= instead of using the # part of the link, which the app uses for pages
    )
  }
  return clientPromise
}

// ---------- auth ----------
export async function signUp(email, password) {
  const sb = await getClient()
  const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: homeUrl() } })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const sb = await getClient()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// The Android app runs at https://localhost inside the phone, so Google cannot send people back there.
// Instead it returns to this app link, which Android opens in DefendIt (see AndroidManifest.xml).
export const APP_LINK = 'com.defendit.app://auth'
const native = Capacitor.isNativePlatform()
// Web address used in emails sent from the app (sign-up confirm, password reset)
const SITE = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')
const homeUrl = () => (native ? SITE || APP_LINK : location.origin)

// Called once at start in the Android app: finishes Google sign-in when the app link opens the app.
let listening = false
export async function listenForAppLink(onDone) {
  if (!native || listening || !cloudEnabled) return
  listening = true
  const [{ App }, { Browser }] = await Promise.all([import('@capacitor/app'), import('@capacitor/browser')])
  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url?.startsWith(APP_LINK)) return
    Browser.close().catch(() => {})
    const params = new globalThis.URL(url.replace(APP_LINK, 'https://x/auth'))
    const code = params.searchParams.get('code')
    const err = params.searchParams.get('error_description')
    try {
      if (err) throw new Error(err)
      if (code) {
        const sb = await getClient()
        const { error } = await sb.auth.exchangeCodeForSession(code)
        if (error) throw error
      }
      onDone?.(null)
    } catch (e) { onDone?.(e) }
  })
}

// Google sign-in (turn on the Google provider in Supabase first, see docs/CLOUD_SETUP.md)
export async function signInWithGoogle() {
  const sb = await getClient()
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    // Website: return to the site's main address (no #page part). Android app: return through the app link.
    // Supabase only accepts addresses listed under Authentication > URL Configuration > Redirect URLs;
    // anything else falls back to the Site URL (often localhost).
    options: { redirectTo: native ? APP_LINK : `${location.origin}/`, skipBrowserRedirect: true },
  })
  if (error) throw error
  try { sessionStorage.setItem('defendit:afterAuth', 'account') } catch { /* private mode */ }
  if (native) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url: data.url })
    return
  }
  // Check first, so a disabled provider shows a friendly message instead of a raw error page.
  try {
    const check = await fetch(data.url, { redirect: 'manual' })
    if (check.status === 400) {
      const body = await check.json().catch(() => ({}))
      throw new Error(body.msg || 'provider is not enabled')
    }
  } catch (e) {
    if (/provider|not enabled|validation/i.test(e.message)) throw e
    // network or redirect checks we cannot read: just continue to Google
  }
  try { sessionStorage.setItem('defendit:afterAuth', 'account') } catch { /* private mode */ }
  location.href = data.url
}

export async function resetPassword(email) {
  const sb = await getClient()
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: homeUrl() })
  if (error) throw error
}

export async function signOut() {
  const sb = await getClient()
  await sb?.auth.signOut()
}

export async function onAuthChange(cb) {
  const sb = await getClient()
  if (!sb) return () => {}
  const { data: { session } } = await sb.auth.getSession()
  cb(session?.user || null)
  const { data } = sb.auth.onAuthStateChange((_event, s) => cb(s?.user || null))
  return () => data.subscription.unsubscribe()
}

// ---------- saving ----------
// The AI key never leaves this device.
function forCloud(state) {
  return { ...state, settings: { ...state.settings, apiKey: '' } }
}

export async function pullData(userId) {
  const sb = await getClient()
  const { data, error } = await sb.from('user_data').select('data, updated_at').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.data || null
}

export async function pushData(userId, state) {
  const sb = await getClient()
  const { error } = await sb.from('user_data').upsert({ user_id: userId, data: forCloud(state), updated_at: new Date().toISOString() })
  if (error) throw error
  if (state.profile.classCode) await pushLeaderboard(userId, state)
}

// ---------- leaderboard ----------
export function leaderboardRow(state) {
  const best = state.profile.best || {}
  return {
    display_name: (state.profile.name || 'Student').slice(0, 30),
    xp: state.profile.xp || 0,
    streak: state.profile.streak || 0,
    best_panel: Math.max(0, ...state.packs.map((p) => p.panelBest || 0)),
    best_typing: Math.max(0, ...Object.entries(best).filter(([k]) => k.startsWith('typing:')).map(([, v]) => v)),
    badges: Object.keys(state.profile.badges || {}).length,
  }
}

// Extra details classmates see when they open your profile (needs supabase/leaderboard-profile.sql).
export function profileRow(state) {
  const p = state.profile
  const share = p.shareProfile !== false
  return {
    full_name: (p.fullName || '').slice(0, 60) || null,
    photo: share && p.photo && p.photo.length <= 20000 ? p.photo : null,
    course: share ? (p.course || '').slice(0, 40) || null : null,
    school: share ? (p.school || '').slice(0, 80) || null : null,
    badge_ids: Object.keys(p.badges || {}),
  }
}

export let profileColumnsMissing = false

export async function pushLeaderboard(userId, state) {
  const sb = await getClient()
  const code = normalizeCode(state.profile.classCode)
  if (!code) return
  const base = { class_code: code, user_id: userId, ...leaderboardRow(state), updated_at: new Date().toISOString() }
  let { error } = await sb.from('leaderboard').upsert({ ...base, ...profileRow(state) })
  // the profile columns are not added yet: save the scores anyway
  if (error && /column|schema cache/i.test(error.message)) {
    profileColumnsMissing = true
    ;({ error } = await sb.from('leaderboard').upsert(base))
  } else if (!error) profileColumnsMissing = false
  if (error) throw error
}

export async function leaveLeaderboard(userId, code) {
  const sb = await getClient()
  await sb.from('leaderboard').delete().eq('class_code', normalizeCode(code)).eq('user_id', userId)
}

export async function fetchLeaderboard(code) {
  const sb = await getClient()
  const { data, error } = await sb.from('leaderboard').select('*').eq('class_code', normalizeCode(code)).order('xp', { ascending: false }).limit(100)
  if (error) throw error
  return data
}

export function normalizeCode(code) {
  return (code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20)
}

// ---------- evaluation survey ----------
export async function createSurvey(code, title) {
  const sb = await getClient()
  const { data: { user } } = await sb.auth.getUser()
  const { error } = await sb.from('surveys').insert({ code, title, owner: user.id })
  if (error) throw error
}

export async function mySurveys() {
  const sb = await getClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data, error } = await sb.from('surveys').select('code, title, created_at').eq('owner', user.id).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function surveyInfo(code) {
  const sb = await getClient()
  const { data, error } = await sb.from('surveys').select('code, title').eq('code', code).maybeSingle()
  if (error) throw error
  return data
}

export async function submitSurvey(code, answers) {
  const sb = await getClient()
  const { error } = await sb.from('survey_responses').insert({ code, answers })
  if (error) throw error
}

export async function fetchSurveyResponses(code) {
  const sb = await getClient()
  const { data, error } = await sb.from('survey_responses').select('answers, created_at').eq('code', code).order('created_at')
  if (error) throw error
  return data
}

export async function deleteSurvey(code) {
  const sb = await getClient()
  const { error } = await sb.from('surveys').delete().eq('code', code)
  if (error) throw error
}

// Deletes your cloud backup and your leaderboard rows (for "Delete everything").
export async function deleteCloudData(userId) {
  const sb = await getClient()
  if (!sb || !userId) return
  const a = await sb.from('user_data').delete().eq('user_id', userId)
  if (a.error) throw a.error
  await sb.from('leaderboard').delete().eq('user_id', userId)
  await sb.auth.signOut()
}
