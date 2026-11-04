// Time convention: full timestamps are stored/transported as UTC ISO-8601; calendar dates
// (deadlines, due dates) are plain YYYY-MM-DD in Indian Standard Time (Asia/Kolkata, UTC+05:30).
export const TIME_ZONE = 'Asia/Kolkata'
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

const fmt = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })

export const isDateOnly = (v) => typeof v === 'string' && DATE_ONLY.test(v)

/** IST calendar date (YYYY-MM-DD) of an instant; date-only strings pass through unchanged. */
export function istDate(value = new Date()) {
  if (isDateOnly(value)) return value
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}`
}

/** Today in IST plus N calendar days, as YYYY-MM-DD. */
export function istDatePlusDays(days, from = new Date()) {
  const [y, m, d] = istDate(from).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + Number(days))).toISOString().slice(0, 10)
}

export const nowIso = () => new Date().toISOString()
