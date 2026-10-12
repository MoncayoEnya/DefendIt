// AI brain using Google Gemini's FREE tier.
// Get a free key at https://aistudio.google.com/apikey and paste it in Settings.
// The key stays in your own browser.

async function gemini({ apiKey, model }, prompt, { json = true, temperature = 0.4 } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}) },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error?.message || `AI request failed (${res.status})`
    if (res.status === 429) throw new Error('Free AI limit reached for now. Wait a minute and try again, or use Offline mode.')
    throw new Error(msg)
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  if (!json) return text
  try {
    return JSON.parse(text.replace(/^```(json)?|```$/g, '').trim())
  } catch {
    throw new Error('The AI answered in an unexpected format. Please try again.')
  }
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
  "terms": [ { "term": string, "definition": string } ],   // 12-20 important terms/concepts/statistics FROM THIS PAPER, definitions max 25 words, as used in this paper
  "questions": [ { "question": string, "type": string, "idealPoints": [string] } ], // 15-20 realistic, tough panel questions specific to THIS paper (methodology, sampling, validity, statistics, results, limitations, significance, novelty, "what if" questions). type = short category. idealPoints = 2-4 things a strong answer must mention, using facts from the paper.
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
