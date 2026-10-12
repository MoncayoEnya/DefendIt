// Server-side AI: the app sends prompts here, and this function calls the AI with YOUR keys,
// which are stored as secret environment variables (never sent to the browser).
// Two free providers work together:
//   - Groq   (very fast)  → short tasks first: panel grading, simple explanations, slide reviews
//   - Gemini (long input) → whole-thesis study packs
// If one fails or hits its free limit, the other is tried automatically.
//
// Runs as a free Vercel serverless function in production (route: /api/ai),
// and inside the Vite dev server when you run `npm run dev` (see vite.config.js).
//
// Environment variables (Vercel → Project → Settings → Environment Variables, or .env locally):
//   GEMINI_API_KEY      your key from https://aistudio.google.com/apikey
//   GROQ_API_KEY        your key from https://console.groq.com/keys
//                       (add at least one of the two; both is best)
//   GEMINI_MODEL        optional  default "gemini-2.5-flash"
//   GROQ_MODEL          optional  default "openai/gpt-oss-120b"
//   AI_LIMIT_PER_HOUR   optional  requests per user (IP) per hour, default 60
//   ALLOWED_ORIGINS     optional  extra sites allowed to call this, comma separated

const MAX_PROMPT = 400000 // characters (a long thesis is about 300k)
const hits = new Map() // simple per-IP rate limit (resets when the server restarts)

function allowedOrigin(origin, host) {
  if (!origin) return true // same-origin requests and server tools
  try {
    const o = new URL(origin)
    if (o.host === host) return true // the app itself
    if (['localhost', '127.0.0.1'].includes(o.hostname)) return true // local dev + Android app (https://localhost)
    if (o.protocol === 'capacitor:') return true
    const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
    return extra.includes(origin)
  } catch {
    return false
  }
}

function rateLimited(ip) {
  const limit = Number(process.env.AI_LIMIT_PER_HOUR || 60)
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now > h.reset) {
    hits.set(ip, { count: 1, reset: now + 3600000 })
    return false
  }
  h.count++
  if (hits.size > 5000) hits.clear() // keep memory small
  return h.count > limit
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')
  const chunks = []
  for await (const c of req) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

function send(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export default async function handler(req, res) {
  const origin = req.headers.origin
  const host = req.headers['x-forwarded-host'] || req.headers.host
  if (origin && allowedOrigin(origin, host)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
  if (req.method === 'OPTIONS') return send(res, 204, {})
  if (!allowedOrigin(origin, host)) return send(res, 403, { error: 'This site is not allowed to use the AI.' })

  const providers = available()
  // GET = status check, so the app knows whether AI is available without a personal key
  if (req.method === 'GET') return send(res, 200, { enabled: providers.length > 0, providers: providers.map((p) => p.name) })
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
  if (!providers.length) return send(res, 503, { error: 'The app owner has not added an AI key on the server yet.' })

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  if (rateLimited(ip)) return send(res, 429, { error: 'You have used the AI a lot this hour. Please wait a bit and try again.' })

  let body
  try {
    body = await readBody(req)
  } catch {
    return send(res, 400, { error: 'Bad request' })
  }
  const prompt = typeof body.prompt === 'string' ? body.prompt : ''
  if (!prompt) return send(res, 400, { error: 'Missing prompt' })
  if (prompt.length > MAX_PROMPT) return send(res, 413, { error: 'This document is too long for the AI. Try a shorter file.' })
  const temperature = Math.min(1, Math.max(0, Number(body.temperature ?? 0.4)))
  const json = body.json !== false

  // short prompts → Groq first (fast); long prompts (a whole thesis) → Gemini first (huge input limit)
  const order = [...providers].sort((x, y) => (prompt.length <= GROQ_MAX ? rank(x, 'groq') - rank(y, 'groq') : rank(x, 'gemini') - rank(y, 'gemini')))
  let last = null
  for (const p of order) {
    if (p.name === 'groq' && prompt.length > GROQ_MAX) continue // too long for Groq's free limits
    try {
      const text = await p.call(prompt, { json, temperature })
      return send(res, 200, { text, provider: p.name })
    } catch (e) {
      last = e
    }
  }
  const status = last?.status === 429 ? 429 : 502
  return send(res, status, { error: status === 429 ? 'The free AI limit was reached for now. Please try again in a minute.' : last?.message || 'Could not reach the AI service.' })
}

// ---------- providers ----------
const GROQ_MAX = 40000 // characters; longer prompts go to Gemini only
const rank = (p, first) => (p.name === first ? 0 : 1)

function available() {
  const list = []
  if (process.env.GEMINI_API_KEY) list.push({ name: 'gemini', call: callGemini })
  if (process.env.GROQ_API_KEY) list.push({ name: 'groq', call: callGroq })
  return list
}

function fail(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

async function callGemini(prompt, { json, temperature }) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}) },
    }),
  }).catch(() => { throw fail(502, 'Could not reach Gemini.') })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw fail(r.status, data?.error?.message || 'Gemini had a problem.')
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  if (!text) throw fail(502, 'Gemini returned an empty answer.')
  return text
}

async function callGroq(prompt, { json, temperature }) {
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
  const send = (useJsonMode) => fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        ...(json ? [{ role: 'system', content: 'Reply with valid JSON only. No markdown, no extra text.' }] : []),
        { role: 'user', content: prompt },
      ],
      ...(useJsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  }).catch(() => { throw fail(502, 'Could not reach Groq.') })
  let r = await send(json)
  // some models do not support JSON mode; retry without it (the system message still asks for JSON)
  if (r.status === 400 && json) r = await send(false)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw fail(r.status, data?.error?.message || 'Groq had a problem.')
  const text = data?.choices?.[0]?.message?.content || ''
  if (!text) throw fail(502, 'Groq returned an empty answer.')
  return text
}
