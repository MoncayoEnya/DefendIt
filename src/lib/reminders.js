// Reminders that work for free on every device:
//  - Calendar file (.ics): a daily practice reminder plus your defense date, with alarms.
//    Works with Google Calendar, Apple Calendar and Outlook on any phone.
//  - Android app (Capacitor): real phone notifications scheduled on the device.
//  - Browser: a notification and a banner when the app is open after your reminder time.
import { Capacitor } from '@capacitor/core'
import { today } from './storage.js'

export const isNative = Capacitor.isNativePlatform()
const pad = (n) => String(n).padStart(2, '0')
const icsDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
const icsDay = (iso) => iso.replaceAll('-', '')
const esc = (s) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')

export function buildIcs({ time = '19:00', defenseDate, title }) {
  const [h, m] = time.split(':').map(Number)
  const start = new Date()
  start.setHours(h, m, 0, 0)
  if (start < new Date()) start.setDate(start.getDate() + 1)
  const end = new Date(start.getTime() + 15 * 60000)
  const stamp = icsDate(new Date())
  const url = location.origin
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DefendIt//Reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:defendit-daily-${Date.now()}@defendit`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    defenseDate ? `RRULE:FREQ=DAILY;UNTIL=${icsDay(defenseDate)}T235959` : 'RRULE:FREQ=DAILY;COUNT=60',
    'SUMMARY:DefendIt: 5-minute defense practice',
    `DESCRIPTION:${esc(`Open DefendIt and finish today's focus: ${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Time to practice for your defense', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT',
  ]
  if (defenseDate) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:defendit-defense-${defenseDate}@defendit`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDay(defenseDate)}`,
      `SUMMARY:${esc(`Thesis defense${title ? `: ${title.slice(0, 60)}` : ''}`)}`,
      `DESCRIPTION:${esc(`You prepared for this. Breathe, smile, answer first then explain. ${url}`)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Your defense is tomorrow', 'TRIGGER:-PT15H', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Defense day. You are ready.', 'TRIGGER:PT7H', 'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(opts) {
  const blob = new Blob([buildIcs(opts)], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'defendit-reminders.ics'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
}

// ---------- Android app: real scheduled notifications ----------
export async function scheduleNative({ enabled, time = '19:00', defenseDate }) {
  if (!isNative) return false
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
  if (!enabled) return true
  const perm = await LocalNotifications.requestPermissions()
  if (perm.display !== 'granted') throw new Error('Notifications are blocked. Allow them in your phone settings.')
  const [hour, minute] = time.split(':').map(Number)
  const list = [{ id: 1, title: 'Time to practice', body: "Finish today's focus in DefendIt. It only takes 5 minutes.", schedule: { on: { hour, minute }, allowWhileIdle: true } }]
  if (defenseDate) {
    const eve = new Date(`${defenseDate}T19:00:00`); eve.setDate(eve.getDate() - 1)
    const morning = new Date(`${defenseDate}T07:00:00`)
    if (eve > new Date()) list.push({ id: 2, title: 'Your defense is tomorrow', body: 'Light review, finish your checklist, and sleep early.', schedule: { at: eve, allowWhileIdle: true } })
    if (morning > new Date()) list.push({ id: 3, title: 'Defense day', body: 'You prepared for this. Breathe and walk in confident.', schedule: { at: morning, allowWhileIdle: true } })
  }
  await LocalNotifications.schedule({ notifications: list })
  return true
}

// ---------- Browser: remind when the app is open ----------
export function reminderDue(state) {
  const r = state.profile.reminders
  if (!r?.enabled) return false
  const [h, m] = (r.time || '19:00').split(':').map(Number)
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m
}

export async function notifyOnce(state, text) {
  try {
    const key = `defendit:notified:${today()}`
    if (localStorage.getItem(key) || !('Notification' in window) || Notification.permission !== 'granted') return
    localStorage.setItem(key, '1')
    const reg = await navigator.serviceWorker?.getRegistration()
    const opts = { body: text, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'defendit-daily' }
    if (reg) reg.showNotification('Time to practice', opts)
    else new Notification('Time to practice', opts)
  } catch { /* notifications not supported */ }
}

export async function askBrowserPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'default') return Notification.requestPermission()
  return Notification.permission
}
