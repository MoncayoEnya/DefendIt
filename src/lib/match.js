export const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

export function similarity(a, b) {
  a = norm(a)
  b = norm(b)
  if (!a || !b) return 0
  if (a === b) return 1
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return 1 - dp[a.length][b.length] / Math.max(a.length, b.length)
}

// Hide the term inside its own definition so the clue doesn't give it away.
export function maskTerm(definition, term) {
  let out = definition
  for (const w of norm(term).split(' ').filter((w) => w.length > 3)) {
    out = out.replace(new RegExp(`\\b${w}\\w*`, 'gi'), '____')
  }
  return out
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
