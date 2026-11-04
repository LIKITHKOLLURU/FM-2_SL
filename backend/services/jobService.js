import db from '../config/database.js'
import { conflict, forbidden, notFound } from '../utils/apiResponse.js'
import { jobOut, nowIso, usersByIds } from '../utils/mappers.js'

const COUNT_SQL = `(SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id AND p.status <> 'withdrawn')`

// Which jobs a viewer may see: guests/others see open jobs; plus jobs they own or are involved in; admins see all.
function visibility(user) {
  if (!user) return { sql: `j.status = 'open'`, args: [] }
  if (user.role === 'admin') return { sql: '1=1', args: [] }
  if (user.role === 'client') return { sql: `(j.status = 'open' OR j.client_id = ?)`, args: [user.id] }
  return { sql: `(j.status = 'open' OR j.id IN (SELECT job_id FROM proposals WHERE freelancer_id = ?) OR j.id IN (SELECT job_id FROM projects WHERE freelancer_id = ?))`, args: [user.id, user.id] }
}

const hydrate = (rows) => {
  const users = usersByIds(rows.map((r) => r.client_id))
  return rows.map((r) => jobOut(r, users, r.proposal_count))
}

export function listJobs(user, q = {}) {
  const vis = visibility(user)
  const where = [vis.sql], args = [...vis.args]
  if (q.q) {
    const like = `%${String(q.q).trim().toLowerCase()}%`
    where.push(`(LOWER(j.title) LIKE ? OR LOWER(j.description) LIKE ? OR LOWER(j.category) LIKE ? OR LOWER(j.skills) LIKE ?)`)
    args.push(like, like, like, like)
  }
  if (q.category) { where.push('j.category = ?'); args.push(q.category) }
  if (q.experience) { where.push('j.experience = ?'); args.push(q.experience) }
  if (q.status) { where.push('j.status = ?'); args.push(q.status) }
  if (q.maxBudget) { where.push('j.budget_min <= ?'); args.push(Number(q.maxBudget)) }
  if (q.minBudget) { where.push('j.budget_max >= ?'); args.push(Number(q.minBudget)) }
  if (q.mine === 'true' && user) { where.push('j.client_id = ?'); args.push(user.id) }
  const order = { budget_high: 'j.budget_max DESC', budget_low: 'j.budget_min ASC' }[q.sort] || 'j.created_at DESC, j.id DESC'
  return hydrate(db.prepare(`SELECT j.*, ${COUNT_SQL} AS proposal_count FROM jobs j WHERE ${where.join(' AND ')} ORDER BY ${order}`).all(...args))
}

export function getJob(user, id) {
  const vis = visibility(user)
  const row = db.prepare(`SELECT j.*, ${COUNT_SQL} AS proposal_count FROM jobs j WHERE j.id = ? AND ${vis.sql}`).get(id, ...vis.args)
  if (!row) throw notFound('Job not found.')
  return hydrate([row])[0]
}

export function createJob(user, b) {
  const now = nowIso()
  const info = db.prepare(`INSERT INTO jobs (client_id, title, description, category, budget_min, budget_max, duration, experience, skills, deadline, status, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?, 'open', ?, ?)`)
    .run(user.id, b.title.trim(), b.description.trim(), b.category, Number(b.budgetMin), Number(b.budgetMax), (b.duration || '').trim(), b.experience || 'Intermediate', JSON.stringify(b.skills || []), b.deadline || null, now, now)
  return getJob(user, info.lastInsertRowid)
}

function ownedJob(user, id) {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id)
  if (!job) throw notFound('Job not found.')
  if (user.role !== 'admin' && job.client_id !== user.id) throw forbidden('You can only manage your own jobs.')
  return job
}

export function updateJob(user, id, b) {
  const job = ownedJob(user, id)
  const map = { title: 'title', description: 'description', category: 'category', duration: 'duration', experience: 'experience', deadline: 'deadline' }
  const sets = [], vals = []
  for (const [k, col] of Object.entries(map)) if (b[k] !== undefined) { sets.push(`${col} = ?`); vals.push(typeof b[k] === 'string' ? b[k].trim() : b[k]) }
  if (b.budgetMin !== undefined) { sets.push('budget_min = ?'); vals.push(Number(b.budgetMin)) }
  if (b.budgetMax !== undefined) { sets.push('budget_max = ?'); vals.push(Number(b.budgetMax)) }
  if (b.skills !== undefined) { sets.push('skills = ?'); vals.push(JSON.stringify(b.skills)) }
  if (b.status !== undefined && b.status !== job.status) {
    // in_progress / completed are driven by the project workflow, not set manually.
    if (db.prepare('SELECT 1 FROM projects WHERE job_id = ?').get(id)) throw conflict('This job has a project; its status follows the project.')
    sets.push('status = ?'); vals.push(b.status)
  }
  const nextMin = b.budgetMin !== undefined ? Number(b.budgetMin) : job.budget_min
  const nextMax = b.budgetMax !== undefined ? Number(b.budgetMax) : job.budget_max
  if (nextMax < nextMin) throw conflict('Maximum budget must be greater than or equal to the minimum.')
  if (sets.length) db.prepare(`UPDATE jobs SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...vals, nowIso(), id)
  return getJob(user, id)
}

// Aggregate numbers for the public landing page (no personal data).
export function publicStats() {
  const n = (sql) => db.prepare(sql).get().n
  return {
    freelancers: n(`SELECT COUNT(*) n FROM users WHERE role = 'freelancer' AND status = 'active'`),
    openJobs: n(`SELECT COUNT(*) n FROM jobs WHERE status = 'open'`),
    completedProjects: n(`SELECT COUNT(*) n FROM projects WHERE status = 'completed'`),
    paidTotal: db.prepare(`SELECT COALESCE(SUM(amount),0) n FROM payments WHERE payment_status = 'paid'`).get().n,
  }
}

export function deleteJob(user, id) {
  ownedJob(user, id)
  if (db.prepare('SELECT 1 FROM projects WHERE job_id = ?').get(id)) throw conflict('This job already has a project and cannot be deleted.')
  db.prepare('DELETE FROM jobs WHERE id = ?').run(id) // proposals cascade
}
