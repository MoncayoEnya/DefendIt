// Group mode: split panel questions among groupmates and track each member's practice.
import { chapterIndex } from './chapters.js'

export function getGroup(pack) {
  return pack.group || { members: [], assign: {}, stats: {} }
}

// Gives each member whole chapters where possible, balancing the number of questions.
export function autoSplit(pack, members) {
  if (!members.length) return {}
  const idx = chapterIndex(pack)
  const byChapter = new Map()
  pack.questions.forEach((_, q) => {
    const c = idx.questions[q]
    if (!byChapter.has(c)) byChapter.set(c, [])
    byChapter.get(c).push(q)
  })
  const load = Object.fromEntries(members.map((m) => [m.id, 0]))
  const assign = {}
  const chapters = [...byChapter.entries()].sort((a, b) => b[1].length - a[1].length)
  for (const [, qs] of chapters) {
    const target = members.reduce((a, b) => (load[b.id] < load[a.id] ? b : a), members[0])
    for (const q of qs) assign[q] = target.id
    load[target.id] += qs.length
  }
  // smooth out big imbalances by moving single questions
  for (let guard = 0; guard < 50; guard++) {
    const most = members.reduce((a, b) => (load[b.id] > load[a.id] ? b : a))
    const least = members.reduce((a, b) => (load[b.id] < load[a.id] ? b : a))
    if (load[most.id] - load[least.id] <= 1) break
    const q = Object.keys(assign).find((k) => assign[k] === most.id)
    assign[q] = least.id
    load[most.id]--
    load[least.id]++
  }
  return assign
}

export function memberSummary(pack) {
  const g = getGroup(pack)
  return g.members.map((m) => {
    const assigned = Object.values(g.assign).filter((id) => id === m.id).length
    const st = g.stats[m.id] || { answered: 0, total: 0, practiced: [] }
    return {
      ...m,
      assigned,
      answered: st.answered,
      practiced: new Set(st.practiced || []).size,
      avg: st.answered ? Math.round((st.total / st.answered) * 10) / 10 : null,
    }
  })
}
