// Speech-to-text and text-to-speech.
// - In the browser: the free built-in Web Speech API (best in Chrome / Android).
// - In the Android app (Capacitor): native plugins, because Android's web view has no speech recognition.
import { Capacitor } from '@capacitor/core'

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
const isNative = Capacitor.isNativePlatform()
export const canListen = isNative || !!SR

// Returns an object with stop(). onText receives the full text so far.
export function startListening({ onText, onEnd, lang = 'en-US' }) {
  if (isNative) return startNative({ onText, onEnd, lang })
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

// Android: the native recognizer stops after a pause, so we restart it until the user taps Stop.
function startNative({ onText, onEnd, lang }) {
  let stopped = false
  let finalText = ''
  let current = ''
  const handles = []
  const ctl = {
    stop: async () => {
      stopped = true
      const { SpeechRecognition } = await import('@capacitor-community/speech-recognition')
      try { await SpeechRecognition.stop() } catch { /* already stopped */ }
      handles.forEach((h) => h.remove?.())
      onEnd?.()
    },
  }
  ;(async () => {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition')
    try {
      const { available } = await SpeechRecognition.available()
      if (!available) throw new Error('Speech recognition is not available on this phone.')
      const perm = await SpeechRecognition.requestPermissions()
      if (perm.speechRecognition !== 'granted') throw new Error('Microphone permission was not given.')
      handles.push(await SpeechRecognition.addListener('partialResults', (data) => {
        current = data.matches?.[0] || ''
        onText(`${finalText}${current}`.trim())
      }))
      handles.push(await SpeechRecognition.addListener('listeningState', async (data) => {
        if (data.status !== 'stopped') return
        finalText += current ? `${current} ` : ''
        current = ''
        if (!stopped) {
          try { await SpeechRecognition.start({ language: lang, partialResults: true, popup: false }) } catch { ctl.stop() }
        }
      }))
      await SpeechRecognition.start({ language: lang, partialResults: true, popup: false })
    } catch (e) {
      console.warn(e)
      ctl.stop()
    }
  })()
  return ctl
}

export async function speak(text) {
  if (!text) return
  if (isNative) {
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
    try {
      await TextToSpeech.stop()
      await TextToSpeech.speak({ text, lang: 'en-US', rate: 0.95 })
    } catch { /* no voice engine installed */ }
    return
  }
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.95
  speechSynthesis.speak(u)
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
