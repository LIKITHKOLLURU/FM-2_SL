// Central date/time module. The whole app uses Indian Standard Time (Asia/Kolkata, UTC+05:30),
// independent of the browser's or computer's timezone.
//
// Two kinds of values flow through the app:
//   * timestamps  - full ISO-8601 instants from the API (e.g. "2026-11-04T11:00:00.000Z"): converted to IST.
//   * date-only   - calendar dates "YYYY-MM-DD" (job deadlines, project due dates): shown as-is, never
//                   converted, so they cannot shift to the previous/next day.
export const TIME_ZONE = 'Asia/Kolkata'
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export const isDateOnly = (v) => typeof v === 'string' && DATE_ONLY.test(v)

const dateParts = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: '2-digit', month: 'short', year: 'numeric' })
const timeParts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: true })
const ymdParts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })

const toDate = (v) => {
  if (v == null || v === '') return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Calendar date (YYYY-MM-DD) in IST for a timestamp; date-only values are returned unchanged. */
export function toISTDateString(value) {
  if (isDateOnly(value)) return value
  const d = toDate(value)
  if (!d) return null
  const p = Object.fromEntries(ymdParts.formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}`
}

/** "04 Nov 2026" */
export function formatDate(value) {
  if (isDateOnly(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return formatCalendar(y, m, d)
  }
  const d = toDate(value)
  return d ? dateParts.format(d).replace(',', '') : '—'
}

// Date-only: built at UTC noon and formatted in UTC so no timezone can move the calendar day.
function formatCalendar(y, m, d) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, d, 12))).replace(',', '')
}

/** "04:30 PM IST" (timestamps only; a date-only value has no time of day). */
export function formatTime(value) {
  const d = toDate(isDateOnly(value) ? null : value)
  return d ? `${timeParts.format(d)} IST` : '—'
}

/** "04 Nov 2026, 04:30 PM IST"; date-only values render as just the date. */
export function formatDateTime(value) {
  if (isDateOnly(value)) return formatDate(value)
  const d = toDate(value)
  return d ? `${formatDate(d)}, ${formatTime(d)}` : '—'
}

/** Today's date in India as YYYY-MM-DD. */
export const getCurrentISTDate = () => toISTDateString(new Date())

/** Current time in India, e.g. "04:30 PM IST". */
export const getCurrentISTTime = () => formatTime(new Date())

/** Whole calendar days from `a` to `b` measured on IST calendar dates (b - a). */
export function istDayDiff(a, b) {
  const [ay, am, ad] = toISTDateString(a).split('-').map(Number)
  const [by, bm, bd] = toISTDateString(b).split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000)
}

/** "YYYY-MM" bucket in IST (for monthly charts). */
export const istMonthKey = (value) => (toISTDateString(value) || '').slice(0, 7)

/** "Nov 2026" label for a "YYYY-MM" key. */
export function formatMonthKey(key) {
  const [y, m] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'short', year: '2-digit' }).format(new Date(Date.UTC(y, m - 1, 1, 12)))
}
