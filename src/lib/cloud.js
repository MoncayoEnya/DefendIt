// Accounts, cloud saving and the class leaderboard, using Supabase's free plan.
// Setup: see docs/CLOUD_SETUP.md. Without the two keys in .env, the app simply stays offline.

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
  const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const sb = await getClient()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// Google sign-in (turn on the Google provider in Supabase first, see docs/CLOUD_SETUP.md)
export async function signInWithGoogle() {
  const sb = await getClient()
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}${location.pathname}#account`, skipBrowserRedirect: true },
  })
  if (error) throw error
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
  location.href = data.url
}

export async function resetPassword(email) {
  const sb = await getClient()
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin })
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

export async function pushLeaderboard(userId, state) {
  const sb = await getClient()
  const code = normalizeCode(state.profile.classCode)
  if (!code) return
  const { error } = await sb.from('leaderboard').upsert({ class_code: code, user_id: userId, ...leaderboardRow(state), updated_at: new Date().toISOString() })
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
