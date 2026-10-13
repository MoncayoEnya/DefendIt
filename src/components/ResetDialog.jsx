import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CloudOff, Loader2, Smartphone, X } from 'lucide-react'
import { deleteCloudData } from '../lib/cloud.js'

async function wipeDevice() {
  try { await new Promise((ok) => { const r = indexedDB.deleteDatabase('defendit-files'); r.onsuccess = r.onerror = r.onblocked = ok }) } catch { /* not supported */ }
  try { localStorage.clear(); sessionStorage.clear() } catch { /* private mode */ }
  location.replace(`${location.origin}/#overview`)
  location.reload()
}

// Reset with a clear choice: this device only, or everything including the cloud backup.
export default function ResetDialog({ user, onClose }) {
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [busy, onClose])

  async function run(all) {
    setErr('')
    setBusy(all ? 'all' : 'device')
    try {
      if (all && user) await deleteCloudData(user.id)
      await wipeDevice()
    } catch (e) {
      setErr(/fetch|network/i.test(e.message) ? 'No internet connection. Your cloud backup was not deleted. Try again when online.' : e.message)
      setBusy('')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="reset-title" className="fade-up w-full rounded-t-2xl bg-card p-5 pb-8 sm:max-w-md sm:rounded-2xl sm:pb-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-soft text-red-ink"><AlertTriangle size={20} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 id="reset-title" className="text-[17px] font-semibold">Reset DefendIt?</h2>
            <p className="mt-0.5 text-[13px] text-sub">This deletes your theses, progress, XP, badges and settings. It cannot be undone.</p>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-md text-sub hover:bg-bg" onClick={onClose} disabled={!!busy} aria-label="Close"><X size={17} /></button>
        </div>

        <div className="mt-5 space-y-2.5">
          {user && (
            <button onClick={() => run(true)} disabled={!!busy}
              className="flex w-full items-start gap-3 rounded-lg border border-red/40 bg-red-soft/50 p-3.5 text-left transition-transform hover:bg-red-soft active:scale-[.99] disabled:opacity-60">
              {busy === 'all' ? <Loader2 size={19} className="mt-0.5 shrink-0 animate-spin text-red-ink" /> : <CloudOff size={19} className="mt-0.5 shrink-0 text-red-ink" aria-hidden />}
              <span>
                <span className="block text-[14px] font-semibold text-red-ink">Delete everything</span>
                <span className="block text-[12px] text-ink-2">This device, your cloud backup and your leaderboard rows. You will be signed out.</span>
              </span>
            </button>
          )}
          <button onClick={() => run(false)} disabled={!!busy}
            className="flex w-full items-start gap-3 rounded-lg border border-line p-3.5 text-left transition-transform hover:bg-bg active:scale-[.99] disabled:opacity-60">
            {busy === 'device' ? <Loader2 size={19} className="mt-0.5 shrink-0 animate-spin" /> : <Smartphone size={19} className="mt-0.5 shrink-0 text-ink-2" aria-hidden />}
            <span>
              <span className="block text-[14px] font-semibold">{user ? 'Reset this device only' : 'Reset this device'}</span>
              <span className="block text-[12px] text-sub">{user ? 'Your cloud backup stays. It comes back when you sign in again.' : 'Everything saved in this browser is removed.'}</span>
            </span>
          </button>
        </div>
        {err && <p className="mt-3 text-[13px] text-red-ink">{err}</p>}
        <button className="btn-ghost mt-4 w-full" onClick={onClose} disabled={!!busy}>Cancel</button>
      </div>
    </div>,
    document.body,
  )
}
