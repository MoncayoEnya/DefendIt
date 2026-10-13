import { UserRound } from 'lucide-react'
import { fillProfile, missingFields, splitBlanks } from '../lib/profile.js'

// Opening line text with profile details filled in. Blanks we cannot fill are highlighted.
export function OpeningText({ text, profile }) {
  const parts = splitBlanks(fillProfile(text, profile))
  return parts.map((p, i) => (p.blank
    ? <mark key={i} className="rounded bg-yellow-soft px-1 font-medium text-yellow-ink">{p.text.replace(/[[\](){}<>]/g, '')}</mark>
    : <span key={i}>{p.text}</span>))
}

// A small prompt under the opening line when details are missing.
export function MissingProfile({ text, profile, go }) {
  const miss = missingFields(text, profile)
  if (!miss.length) return null
  return (
    <button onClick={() => go('profile')} className="mt-3 flex w-full items-center gap-2.5 rounded-md border border-yellow/50 bg-yellow-soft px-3 py-2.5 text-left text-[13px] text-yellow-ink">
      <UserRound size={16} className="shrink-0" aria-hidden />
      <span className="flex-1">Fill in the blanks with your details</span>
      <span className="font-semibold">Edit profile</span>
    </button>
  )
}
