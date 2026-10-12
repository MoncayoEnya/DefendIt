import { useState } from 'react'
import { Play, Plus, Shuffle, Trash2, UsersRound } from 'lucide-react'
import { Avatar } from '../components/Layout.jsx'
import { BackLink, Notice, PageHeader, ProgressBar, SectionTitle } from '../components/ui.jsx'
import { chapterIndex, uiState } from '../lib/chapters.js'
import { autoSplit, getGroup, memberSummary } from '../lib/group.js'

export default function Group({ pack, update, go }) {
  const [name, setName] = useState('')
  const g = getGroup(pack)
  const summary = memberSummary(pack)
  const idx = chapterIndex(pack)

  function saveGroup(fn) {
    update((s) => {
      const p = s.packs.find((x) => x.id === pack.id)
      p.group = fn(structuredClone(getGroup(p)))
      return s
    })
  }

  function addMember(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n || g.members.length >= 8) return
    saveGroup((gr) => {
      gr.members.push({ id: crypto.randomUUID().slice(0, 8), name: n })
      gr.assign = autoSplit(pack, gr.members)
      return gr
    })
    setName('')
  }

  function removeMember(id) {
    if (!confirm('Remove this member and their practice record?')) return
    saveGroup((gr) => {
      gr.members = gr.members.filter((m) => m.id !== id)
      delete gr.stats[id]
      gr.assign = autoSplit(pack, gr.members)
      return gr
    })
  }

  const ready = g.members.length >= 2

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink onClick={() => go('practice')}>Practice</BackLink>
      <PageHeader eyebrow="Group mode" title="Defend as a team" desc="Add your groupmates, split the panel questions fairly, then practice together on one device. Each member's answers are tracked separately." />

      <section className="card p-5">
        <h2 className="text-[15px] font-semibold">Members</h2>
        <form onSubmit={addMember} className="mt-3 flex gap-2">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Groupmate's name" aria-label="Groupmate's name" maxLength={30} />
          <button className="btn-primary shrink-0" disabled={!name.trim() || g.members.length >= 8}><Plus size={16} /> Add</button>
        </form>
        {g.members.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[12px] text-sub">
                  <th className="py-2 font-medium">Member</th>
                  <th className="py-2 font-medium">Assigned</th>
                  <th className="py-2 font-medium">Practiced</th>
                  <th className="py-2 pl-4 font-medium">Avg score</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {summary.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5"><span className="flex items-center gap-2"><Avatar name={m.name} size={28} /><span className="font-medium">{m.name}</span></span></td>
                    <td className="py-2.5">{m.assigned} questions</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={m.assigned ? (m.practiced / m.assigned) * 100 : 0} className="h-1.5 w-16" />
                        <span>{m.practiced}/{m.assigned}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-4 font-semibold">{m.avg != null ? `${m.avg} / 10` : <span className="font-normal text-sub">None yet</span>}</td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => removeMember(m.id)} className="grid h-8 w-8 place-items-center rounded-md text-sub hover:bg-red-soft hover:text-red" aria-label={`Remove ${m.name}`}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-sub">No members yet. Add at least two to split the questions.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary" disabled={!ready} onClick={() => { uiState.groupMode = true; go('panel') }}><Play size={15} /> Start group practice</button>
          <button className="btn-ghost" disabled={!ready} onClick={() => saveGroup((gr) => ({ ...gr, assign: autoSplit(pack, gr.members) }))}><Shuffle size={15} /> Split again</button>
        </div>
      </section>

      {ready ? (
        <>
          <SectionTitle>Who answers what</SectionTitle>
          <p className="-mt-1 mb-3 text-[13px] text-sub">Questions are split by chapter so each member owns a part of the paper. Change any assignment below.</p>
          <div className="card divide-y divide-line">
            {pack.questions.map((q, i) => (
              <div key={i} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap gap-1.5"><span className="tag">{q.type}</span><span className="tag">{pack.sections[idx.questions[i]]?.title}</span></div>
                  <p className="text-[13px] font-medium">{q.question}</p>
                </div>
                <select
                  className="input !h-9 sm:!w-44"
                  value={g.assign[i] || ''}
                  aria-label="Assigned member"
                  onChange={(e) => saveGroup((gr) => ({ ...gr, assign: { ...gr.assign, [i]: e.target.value } }))}
                >
                  {g.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4"><Notice tone="blue" icon={UsersRound}>Tip: in real defenses, panels often ask a specific member. Splitting questions makes sure everyone can answer their part confidently.</Notice></div>
      )}
    </div>
  )
}
