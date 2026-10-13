// Keeps the full text of each uploaded thesis (and the paragraph explanations) on this device.
// It uses IndexedDB, which holds much more than localStorage, and is NOT sent to cloud sync.
const DB = 'defendit-files'
let dbp = null

function open() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore('texts')
        req.result.createObjectStore('notes')
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbp
}

async function run(store, mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(tx.error)
  })
}

export const saveText = (id, text) => run('texts', 'readwrite', (s) => s.put(text, id)).catch(() => {})
export const loadText = (id) => run('texts', 'readonly', (s) => s.get(id)).catch(() => null)
export const saveNotes = (id, notes) => run('notes', 'readwrite', (s) => s.put(notes, id)).catch(() => {})
export const loadNotes = (id) => run('notes', 'readonly', (s) => s.get(id)).catch(() => null)
export async function deleteText(id) {
  await run('texts', 'readwrite', (s) => s.delete(id)).catch(() => {})
  await run('notes', 'readwrite', (s) => s.delete(id)).catch(() => {})
}
