// Free speech-to-text using the browser's built-in Web Speech API (works best in Chrome / Android).
const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
export const canListen = !!SR

export function startListening({ onText, onEnd, lang = 'en-US' }) {
  if (!SR) return null
  const rec = new SR()
  rec.lang = lang
  rec.continuous = true
  rec.interimResults = true
  let finalText = ''
  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) finalText += r[0].transcript + ' '
      else interim += r[0].transcript
    }
    onText((finalText + interim).trim())
  }
  rec.onend = () => onEnd?.()
  rec.onerror = () => onEnd?.()
  rec.start()
  return rec
}

const FILLERS = ['um', 'uhm', 'umm', 'uh', 'uhh', 'ah', 'ahh', 'eh', 'like', 'you know', 'basically', 'actually', 'so yeah', 'i mean', 'kind of', 'sort of', 'parang', 'ano']

export function countFillers(text) {
  const t = ' ' + text.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ') + ' '
  const found = {}
  let total = 0
  for (const f of FILLERS) {
    const n = (t.match(new RegExp(`(?<= )${f}(?= )`, 'g')) || []).length
    if (n) {
      found[f] = n
      total += n
    }
  }
  return { total, found }
}
