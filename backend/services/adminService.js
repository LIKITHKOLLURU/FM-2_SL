import db from '../config/database.js'
import { conflict, forbidden, notFound } from '../utils/apiResponse.js'
import { userPrivate } from '../utils/mappers.js'
import { resetAndSeed } from '../database/seed.js'

const count = (sql, ...a) => db.prepare(sql).get(...a).n

export function dashboard() {
  const sum = (s) => db.prepare(`SELECT COALESCE(SUM(amount),0) AS n FROM payments WHERE payment_status = ?`).get(s).n
  const grouped = (table, col) => Object.fromEntries(db.prepare(`SELECT ${col} AS k, COUNT(*) AS n FROM ${table} GROUP BY ${col}`).all().map((r) => [r.k, r.n]))
  const monthly = db.prepare(`SELECT strftime('%Y-%m', payment_date, '+330 minutes') AS month, SUM(amount) AS amount FROM payments WHERE payment_status = 'paid' GROUP BY month ORDER BY month`).all()
  return {
    users: { total: count('SELECT COUNT(*) n FROM users'), suspended: count(`SELECT COUNT(*) n FROM users WHERE status = 'suspended'`), byRole: grouped('users', 'role') },
    jobs: { total: count('SELECT COUNT(*) n FROM jobs'), byStatus: grouped('jobs', 'status') },
    proposals: { total: count('SELECT COUNT(*) n FROM proposals'), byStatus: grouped('proposals', 'status') },
    projects: { total: count('SELECT COUNT(*) n FROM projects'), byStatus: grouped('projects', 'status') },
    payments: { paid: sum('paid'), pending: sum('pending'), refunded: sum('refunded'), count: count('SELECT COUNT(*) n FROM payments'), monthly },
  }
}

export function listUsers({ q, role, status } = {}) {
  const where = ['1=1'], args = []
  if (q) { const like = `%${String(q).trim().toLowerCase()}%`; where.push(`(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(company) LIKE ?)`); args.push(like, like, like) }
  if (role) { where.push('role = ?'); args.push(role) }
  if (status) { where.push('status = ?'); args.push(status) }
  return db.prepare(`SELECT * FROM users WHERE ${where.join(' AND ')} ORDER BY created_at DESC, id DESC`).all(...args).map(userPrivate)
}

function target(admin, id) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!u) throw notFound('User not found.')
  if (u.id === admin.id) throw forbidden('You cannot change or delete your own account.')
  if (u.role === 'admin') throw forbidden('Admin accounts cannot be suspended or deleted.')
  return u
}

export function setUserStatus(admin, id, status) {
  target(admin, id)
  db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), id)
  return userPrivate(db.prepare('SELECT * FROM users WHERE id = ?').get(id))
}

export function deleteUser(admin, id) {
  target(admin, id)
  if (db.prepare('SELECT 1 FROM projects WHERE client_id = ? OR freelancer_id = ?').get(id, id))
    throw conflict('This user has projects and cannot be deleted. Suspend them instead.')
  db.prepare('DELETE FROM users WHERE id = ?').run(id) // jobs + proposals cascade
}

export function resetDemo() {
  if (process.env.NODE_ENV === 'production') throw forbidden('Reset is disabled in production.')
  resetAndSeed()
}
