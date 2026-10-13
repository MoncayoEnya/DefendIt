// The DefendIt mark: a shield that is also a speech bubble (you defend by speaking), with a check for "ready".
export function LogoMark({ size = 24, className = 'text-brand' }) {
  return (
    <svg viewBox="80 48 352 432" width={size * 0.815} height={size} className={className} aria-hidden>
      <path d="M256 56 L404 108 C414 112 420 120 420 131 L420 246 C420 338 356 404 262 436 L150 470 L176 400 C122 362 92 308 92 246 L92 131 C92 120 98 112 108 108 Z" fill="currentColor" />
      <path d="M186 252 L238 302 L330 200" fill="none" stroke="var(--color-card, #fff)" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
