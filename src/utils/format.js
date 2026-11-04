import { formatDate, formatDateTime, istDayDiff, getCurrentISTDate } from './datetime.js'

export const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
// Dates/times are always shown in IST (see utils/datetime.js).
export const dateFmt = formatDate
export const dateTimeFmt = formatDateTime
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('')
export const labelize = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
export const budgetRange = (j) => `${money(j.budgetMin)} – ${money(j.budgetMax)}`
export const timeAgo = (iso) => {
  const days = istDayDiff(iso, getCurrentISTDate())
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return formatDate(iso)
}
