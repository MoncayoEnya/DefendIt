// Badge rules. Each badge checks real progress, so nothing is given for free.
import { BookOpen, CalendarCheck, CalendarDays, Crown, Flame, FileUp, Keyboard, Layers, Link2, Mic, ShieldCheck, Trophy, Users, UsersRound, Wind, AudioLines } from 'lucide-react'
import { levelInfo } from './storage.js'
import { readiness } from './progress.js'

const stats = (s) => s.profile.stats || {}
const anyPack = (s, fn) => s.packs.reduce((best, p) => Math.max(best, fn(p, s)), 0)
const mastered = (p, s) => Object.entries(s.mastery[p.id] || {}).filter(([k, v]) => k.startsWith('t') && v.box >= 3).length
const typingBest = (s) => Math.max(0, ...Object.entries(s.profile.best || {}).filter(([k]) => k.startsWith('typing:')).map(([, v]) => v))

export const BADGES = [
  { id: 'first-upload', name: 'First Upload', desc: 'Import your own thesis', icon: FileUp, goal: 1, value: (s) => s.packs.filter((p) => !p.sample).length },
  { id: 'bookworm', name: 'Bookworm', desc: 'Review every chapter of a thesis', icon: BookOpen, goal: 1, value: (s) => (s.packs.some((p) => (p.readSections || []).length >= p.sections.length) ? 1 : 0) },
  { id: 'term-master', name: 'Term Master', desc: 'Master 10 key terms', icon: Layers, goal: 10, value: (s) => anyPack(s, mastered) },
  { id: 'perfect-match', name: 'Perfect Match', desc: 'Get a perfect Match & Link round', icon: Link2, goal: 1, value: (s) => stats(s).matchPerfect || 0 },
  { id: 'sharpshooter', name: 'Sharpshooter', desc: 'Score 1,000 in Typing defense', icon: Keyboard, goal: 1000, value: (s) => typingBest(s) },
  { id: 'first-defense', name: 'First Defense', desc: 'Finish your first panel session', icon: Users, goal: 1, value: (s) => anyPack(s, (p) => p.panelSessions || 0) },
  { id: 'defense-passed', name: 'Defense Passed', desc: 'Convince all three panelists', icon: ShieldCheck, goal: 1, value: (s) => stats(s).panelWins || 0 },
  { id: 'pressure', name: 'Survived Pressure Mode', desc: 'Pass the panel in Pressure mode', icon: Flame, goal: 1, value: (s) => stats(s).pressureWins || 0 },
  { id: 'no-fillers', name: 'No Filler Words', desc: 'Give a 20+ word answer with zero fillers', icon: Mic, goal: 1, value: (s) => stats(s).cleanAnswers || 0 },
  { id: 'smooth-talker', name: 'Smooth Talker', desc: 'Give 10 clean answers with zero fillers', icon: AudioLines, goal: 10, value: (s) => stats(s).cleanAnswers || 0 },
  { id: 'team-player', name: 'Team Player', desc: 'Finish a group practice session', icon: UsersRound, goal: 1, value: (s) => stats(s).groupSessions || 0 },
  { id: 'calm-mind', name: 'Calm Mind', desc: 'Complete 3 breathing exercises', icon: Wind, goal: 3, value: (s) => s.profile.confidence?.breaths || 0 },
  { id: 'streak-3', name: '3-Day Streak', desc: 'Practice 3 days in a row', icon: CalendarDays, goal: 3, value: (s) => s.profile.streak || 0 },
  { id: 'streak-7', name: '7-Day Streak', desc: 'Practice 7 days in a row', icon: CalendarCheck, goal: 7, value: (s) => s.profile.streak || 0 },
  { id: 'ready', name: 'Defense Ready', desc: 'Reach 80% defense readiness', icon: Trophy, goal: 80, value: (s) => anyPack(s, (p) => readiness(s, p).overall) },
  { id: 'legend', name: 'Thesis Legend', desc: 'Reach the highest level', icon: Crown, goal: 6, value: (s) => levelInfo(s.profile.xp).level },
]

export function badgeStatus(state) {
  const earned = state.profile.badges || {}
  return BADGES.map((b) => {
    const value = b.value(state)
    return { ...b, value: Math.min(value, b.goal), earnedAt: earned[b.id] || null, done: !!earned[b.id] || value >= b.goal }
  })
}

// Returns badges that are newly complete but not yet recorded.
export function newBadges(state) {
  const earned = state.profile.badges || {}
  return BADGES.filter((b) => !earned[b.id] && b.value(state) >= b.goal)
}
