// Converts DB rows (snake_case, integer ids) to the shapes the React frontend expects
// (camelCase, string ids). Timestamps are returned as UTC ISO-8601; calendar dates
// (deadline / due date) are returned as IST date-only strings (YYYY-MM-DD).
import db from '../config/database.js'
import { istDate, isDateOnly, nowIso } from './time.js'

export { nowIso }
const parse = (s) => { try { return JSON.parse(s) } catch { return [] } }
const sid = (v) => (v == null ? v : String(v))
export const ids = (arr) => [...new Set(arr)]
const calendarDate = (s) => (s ? istDate(s) : null) // legacy rows stored a timestamp; new rows store YYYY-MM-DD
const instant = (s) => (s == null ? s : isDateOnly(s) ? `${s}T00:00:00+05:30` : s)

export const userPublic = (u) => u && ({
  id: sid(u.id), name: u.name, role: u.role, title: u.title, company: u.company, location: u.location, bio: u.bio,
  skills: parse(u.skills), hourlyRate: u.hourly_rate, status: u.status, joinedAt: u.created_at,
})
export const userPrivate = (u) => u && ({ ...userPublic(u), email: u.email, hasPassword: !!u.password_hash, authProvider: u.google_sub ? 'google' : 'password' })

export function usersByIds(list) {
  const unique = ids(list)
  if (!unique.length) return new Map()
  const rows = db.prepare(`SELECT * FROM users WHERE id IN (${unique.map(() => '?').join(',')})`).all(...unique)
  return new Map(rows.map((r) => [r.id, r]))
}

export const jobOut = (j, users, proposalCount = 0) => ({
  id: sid(j.id), clientId: sid(j.client_id), title: j.title, description: j.description, category: j.category,
  budgetMin: j.budget_min, budgetMax: j.budget_max, duration: j.duration, experience: j.experience, skills: parse(j.skills),
  deadline: calendarDate(j.deadline), status: j.status, createdAt: j.created_at, proposalCount,
  client: userPublic(users.get(j.client_id)),
})

export const proposalOut = (p, users) => ({
  id: sid(p.id), jobId: sid(p.job_id), freelancerId: sid(p.freelancer_id), amount: p.proposed_amount, deliveryDays: p.delivery_days,
  coverLetter: p.cover_letter, status: p.status, createdAt: p.created_at, freelancer: userPublic(users.get(p.freelancer_id)),
})

export const projectOut = (p, users, job) => ({
  id: sid(p.id), jobId: sid(p.job_id), proposalId: sid(p.proposal_id), clientId: sid(p.client_id), freelancerId: sid(p.freelancer_id),
  title: p.title, budget: p.budget, status: p.status, progress: p.progress, startedAt: p.created_at, dueDate: calendarDate(p.deadline),
  client: userPublic(users.get(p.client_id)), freelancer: userPublic(users.get(p.freelancer_id)),
  job: job ? { id: sid(job.id), title: job.title, category: job.category, status: job.status } : undefined,
})

// Paid/refunded payments carry the actual UTC timestamp; pending ones carry their scheduled due date (YYYY-MM-DD).
export const paymentOut = (p) => ({
  id: sid(p.id), projectId: sid(p.project_id), clientId: sid(p.client_id), freelancerId: sid(p.freelancer_id), amount: p.amount,
  status: p.payment_status, paymentType: p.payment_type, description: p.payment_type === 'deposit' ? 'Deposit (50%)' : 'Final payment (50%)',
  date: p.payment_status === 'pending' ? calendarDate(p.payment_date) : instant(p.payment_date),
})
