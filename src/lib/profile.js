// Fills blanks like "[Your Name]" or "(name)" in AI text with details from the student's profile.

const W = '[\\[\\(<{]' // opening bracket
const E = '[\\]\\)>}]' // closing bracket
const blank = (words) => new RegExp(`${W}\\s*(?:${words})\\s*${E}`, 'gi')

export const FIELDS = [
  { key: 'fullName', label: 'Full name', re: blank("(?:your |my |student'?s? |presenter'?s? |researcher'?s? )?(?:full |complete )?name(?:s)?|name of (?:the )?(?:student|presenter|researcher)") },
  { key: 'members', label: 'Groupmates', re: blank("(?:names? of )?(?:my |our |your )?(?:group ?mates?|group members?|members?|co-?(?:authors?|researchers?)|teammates?)(?:'? names?)?") },
  { key: 'school', label: 'School', re: blank("(?:your |our |my )?(?:school|university|college|institution)(?: name)?") },
  { key: 'course', label: 'Course or strand', re: blank("(?:your |our |my )?(?:course|program|programme|strand|degree|section|year and section)") },
  { key: 'adviser', label: 'Adviser', re: blank("(?:your |our |my )?(?:research |thesis )?advis[eo]r(?:'?s)?(?: name)?") },
]

// "Ana Cruz" or "Ana Cruz, Ben Reyes and Carla Lim"
function joinNames(list) {
  const xs = list.filter(Boolean)
  if (xs.length <= 1) return xs[0] || ''
  return `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`
}

export function profileValues(profile = {}) {
  const members = (profile.members || '').split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
  return {
    fullName: (profile.fullName || profile.name || '').trim(),
    members: joinNames(members),
    school: (profile.school || '').trim(),
    course: (profile.course || '').trim(),
    adviser: (profile.adviser || '').trim(),
  }
}

// Returns the text with every blank filled in that we have a value for.
export function fillProfile(text, profile) {
  if (!text) return text
  const v = profileValues(profile)
  let out = text
  for (const f of FIELDS) if (v[f.key]) out = out.replace(f.re, v[f.key])
  return out
}

// Which profile details this text still needs.
export function missingFields(text, profile) {
  if (!text) return []
  const v = profileValues(profile)
  return FIELDS.filter((f) => !v[f.key] && new RegExp(f.re.source, 'i').test(text))
}

// Splits text into parts so leftover blanks can be shown highlighted.
const ANY = new RegExp(FIELDS.map((f) => `(?:${f.re.source})`).join('|'), 'gi')
export function splitBlanks(text) {
  const parts = []
  let last = 0
  for (const m of text.matchAll(ANY)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) })
    parts.push({ text: m[0], blank: true })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

// For reading aloud: say "your name" instead of brackets.
export function speakable(text, profile) {
  return fillProfile(text, profile).replace(ANY, (m) => m.replace(/[[\](){}<>]/g, ''))
}

// Turns a picked image into a small square photo (about 10 KB) that fits in the cloud and on the leaderboard.
export function squarePhoto(file, size = 160) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) return reject(new Error('Please choose a photo (JPG, PNG or WebP).'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const s = Math.min(img.naturalWidth, img.naturalHeight)
      const c = document.createElement('canvas')
      c.width = c.height = size
      c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size)
      URL.revokeObjectURL(url)
      let out = c.toDataURL('image/webp', 0.8)
      if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', 0.8) // older Safari
      resolve(out)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not open that photo. Try another one.')) }
    img.src = url
  })
}

// First and full name from a Google account
export function namesFromUser(user) {
  const md = user?.user_metadata || {}
  const full = (md.full_name || md.name || '').trim()
  return { full, first: (md.given_name || full.split(/\s+/)[0] || '').trim(), photo: md.avatar_url || md.picture || '' }
}
