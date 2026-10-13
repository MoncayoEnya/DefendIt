// Light / dark mode. "system" follows the phone or computer setting.
const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

export function resolveTheme(pref = 'system') {
  if (pref === 'dark' || pref === 'light') return pref
  return mq?.matches ? 'dark' : 'light'
}

export function applyTheme(pref) {
  const t = resolveTheme(pref)
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#161c22' : '#ffffff')
}

export function watchSystemTheme(getPref) {
  if (!mq) return () => {}
  const on = () => getPref() === 'system' && applyTheme('system')
  mq.addEventListener('change', on)
  return () => mq.removeEventListener('change', on)
}

// Apply as early as possible (before React renders) to avoid a white flash.
export function applySavedTheme() {
  try {
    applyTheme(JSON.parse(localStorage.getItem('defendit:v1'))?.settings?.theme || 'system')
  } catch {
    applyTheme('system')
  }
}
