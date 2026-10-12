// AI brain using Google Gemini.
// Two ways to reach it:
//  1. App-provided AI (recommended): the app calls its own server function (/api/ai),
//     which adds the owner's key from a secret setting. Users set up nothing.
//  2. Personal key (optional): a user pastes their own free key in Settings,
//     and the app calls Gemini directly with it. Used first when present.

const API_BASE = import.meta.env.VITE_API_BASE || '' // set to your live site for the Android app build
let server = { checked: false, enabled: false }
const listeners = new Set()

export async function checkServerAI() {
  try {
    const r = await fetch(`${API_BASE}/api/ai`, { headers: { Accept: 'application/json' } })
    const data = r.ok ? await r.json() : {}
    server = { checked: true, enabled: !!data.enabled }
  } catch {
    server = { checked: true, enabled: false }
  }
  listeners.forEach((fn) => fn(server))
  return server
}

export function onServerAI(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const serverAIEnabled = () => server.enabled

// Is any AI available (personal key or the app's server)?
export function hasAI(state) {
  return !!state.settings.apiKey || server.enabled
}

// AI models love long dashes ("—"); swap them for plain punctuation so every screen reads the same.
function plain(v) {
  if (typeof v === 'string') return v.replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s*[—–]\s*/g, ', ').replace(/,\s*,/g, ',')
  if (Array.isArray(v)) return v.map(plain)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]))
  return v
}

function parse(text, json) {
  if (!json) return plain(text)
  try {
    return plain(JSON.parse(text.replace(/^```(json)?|```$/g, '').trim()))
  } catch {
    throw new Error('The AI answered in an unexpected format. Please try again.')
  }
}

async function gemini({ apiKey, model }, prompt, { json = true, temperature = 0.4 } = {}) {
  if (!apiKey) {
    // app-provided AI through the server function (key stays secret on the server)
    const res = await fetch(`${API_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, json, temperature }),
    }).catch(() => null)
    if (!res) throw new Error('No internet connection.')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `AI request failed (${res.status})`)
    return parse(data.text || '', json)
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}) },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 429) throw new Error('Free AI limit reached for now. Wait a minute and try again, or use Offline mode.')
    throw new Error(data?.error?.message || `AI request failed (${res.status})`)
  }
  return parse(data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '', json)
}

export async function testKey(settings) {
  await gemini(settings, 'Reply with {"ok":true}')
  return true
}

const MAX_CHARS = 350000 // keeps us safely inside free-tier limits

export async function buildAiPack(settings, text, fileName) {
  const doc = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text
  const prompt = `You are an expert thesis adviser preparing a student for their thesis/capstone defense.
Read the paper below and return ONLY JSON with this exact shape:
{
  "title": string,                       // the paper's title
  "overview": string,                    // 3-4 plain-English sentences: problem, method, main finding
  "elevatorPitch": string,               // a 45-second spoken opening the student can practice, first person
  "sections": [ { "title": string, "summary": string, "keyPoints": [string] } ],  // 4-8 sections following the paper's chapters, 2-4 key points each, simple words
  "terms": [ { "term": string, "definition": string, "chapter": number } ],   // chapter = index in "sections" (0-based) where the term matters most. 12-20 important terms/concepts/statistics FROM THIS PAPER, definitions max 25 words, as used in this paper
  "questions": [ { "question": string, "type": string, "idealPoints": [string], "chapter": number } ], // chapter = index in "sections" (0-based) the question is about. 15-20 realistic, tough panel questions specific to THIS paper (methodology, sampling, validity, statistics, results, limitations, significance, novelty, "what if" questions). type = short category. idealPoints = 2-4 things a strong answer must mention, using facts from the paper.
  "weakSpots": [string]                  // 3-6 parts of the paper a panel is likely to attack, and why
}
Use only information from the paper. Keep language simple and clear.

PAPER (${fileName}):
"""
${doc}
"""`
  const pack = await gemini(settings, prompt)
  if (!pack?.questions?.length || !pack?.terms?.length) throw new Error('The AI could not build a study pack from this file.')
  return { ...pack, fileName, source: 'ai' }
}

export async function gradeAnswer(settings, pack, question, answer, persona) {
  const context = JSON.stringify({ title: pack.title, overview: pack.overview, sections: pack.sections }).slice(0, 30000)
  const prompt = `You are ${persona.name}, a thesis defense panelist. Style: ${persona.style}.
Paper context (JSON): ${context}

You asked: "${question.question}"
A strong answer should cover: ${JSON.stringify(question.idealPoints || [])}
The student answered: """${answer}"""

Grade fairly but honestly. Return ONLY JSON:
{
  "score": number,          // 0-10
  "verdict": string,        // one short sentence, in character
  "good": [string],         // 1-3 things done well
  "missing": [string],      // 0-3 things missing or wrong
  "betterAnswer": string,   // a stronger version of their answer, first person, max 90 words, using facts from the paper
  "followUp": string        // one tough follow-up question you would ask next, in character
}`
  return gemini(settings, prompt, { temperature: 0.5 })
}

export async function explainCheck(settings, pack, prompt, answer) {
  const context = JSON.stringify({ title: pack.title, overview: pack.overview }).slice(0, 8000)
  const p = `You are a friendly coach checking whether a student can explain their thesis in plain language.
Thesis context (JSON): ${context}
Task given to the student: "${prompt}"
Student's explanation: """${answer}"""

Judge clarity for a non-expert listener (a parent or a 12-year-old) AND whether it is still accurate to the thesis.
Return ONLY JSON:
{
  "score": number,        // 0-10, 10 = crystal clear, accurate, no unexplained jargon
  "verdict": string,      // one encouraging sentence
  "jargon": [string],     // technical words a non-expert would not understand (max 5)
  "missing": [string],    // important ideas left out or wrong (max 3)
  "simpler": string       // a clearer version in the student's voice, max 80 words, simple words
}`
  return gemini(settings, p, { temperature: 0.4 })
}

export async function reviewSlides(settings, pack, slides) {
  const deck = slides.map((s) => `Slide ${s.n}: ${s.title || '(no title)'}\n${s.text}`).join('\n\n').slice(0, 30000)
  const context = pack ? JSON.stringify({ title: pack.title, sections: pack.sections.map((s) => s.title) }) : '{}'
  const p = `You are a thesis adviser reviewing a student's defense presentation slides.
Thesis (JSON): ${context}
Slides (text only):
"""
${deck}
"""
Give practical, specific feedback. Return ONLY JSON:
{
  "overall": string,                       // 2 sentences: overall impression
  "strengths": [string],                   // max 3
  "fixes": [ { "slide": number, "issue": string, "suggestion": string } ],   // max 8, most important first; slide 0 = whole deck
  "likelyQuestions": [string]              // 3 questions the panel may ask based on these slides
}`
  return gemini(settings, p, { temperature: 0.4 })
}
