import db from '../config/database.js'
import { badRequest, conflict, forbidden, notFound } from '../utils/apiResponse.js'
import { nowIso, projectOut, usersByIds } from '../utils/mappers.js'

export const STATUSES = ['not_started', 'in_progress', 'in_review', 'on_hold', 'completed']

// Allowed moves (same status = progress-only update). Completed projects can only be reopened by an admin.
const TRANSITIONS = {
  not_started: ['in_progress', 'on_hold'],
  in_progress: ['not_started', 'in_review', 'on_hold', 'completed'],
  in_review: ['in_progress', 'on_hold', 'completed'],
  on_hold: ['not_started', 'in_progress', 'in_review'],
  completed: [],
}

const hydrate = (rows) => {
  const users = usersByIds(rows.flatMap((r) => [r.client_id, r.freelancer_id]))
  const jobs = new Map(db.prepare(`SELECT * FROM jobs WHERE id IN (SELECT job_id FROM projects)`).all().map((j) => [j.id, j]))
  return rows.map((r) => projectOut(r, users, jobs.get(r.job_id)))
}

export function listProjects(user) {
  const order = 'ORDER BY created_at DESC, id DESC'
  if (user.role === 'admin') return hydrate(db.prepare(`SELECT * FROM projects ${order}`).all())
  const col = user.role === 'client' ? 'client_id' : 'freelancer_id'
  return hydrate(db.prepare(`SELECT * FROM projects WHERE ${col} = ? ${order}`).all(user.id))
}

export function getProject(user, id) {
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  if (!p) throw notFound('Project not found.')
  if (user.role !== 'admin' && p.client_id !== user.id && p.freelancer_id !== user.id) throw forbidden('You are not part of this project.')
  return hydrate([p])[0]
}

export function updateStatus(user, id, { status, progress }) {
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  if (!p) throw notFound('Project not found.')
  const isAdmin = user.role === 'admin'
  if (!isAdmin && p.freelancer_id !== user.id) throw forbidden('Only the assigned freelancer or an admin can update this project.')
  if (!STATUSES.includes(status)) throw badRequest('Invalid project status.')

  if (status !== p.status) {
    const allowed = p.status === 'completed' && isAdmin ? ['in_progress'] : TRANSITIONS[p.status]
    if (!allowed.includes(status)) throw conflict(`A project cannot move from ${p.status.replace('_', ' ')} to ${status.replace('_', ' ')}.`)
  } else if (p.status === 'completed') throw conflict('This project is already completed.')

  let next = p.progress
  if (status === 'completed') next = 100
  else if (status === 'not_started') next = 0
  else if (typeof progress === 'number' && Number.isFinite(progress)) next = Math.min(99, Math.max(0, Math.round(progress)))
  else if (p.progress === 100) next = 99
  if (status === 'in_progress' && next === 0) next = 5

  const now = nowIso()
  db.transaction(() => {
    db.prepare('UPDATE projects SET status = ?, progress = ?, updated_at = ? WHERE id = ?').run(status, next, now, id)
    db.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?').run(status === 'completed' ? 'completed' : 'in_progress', now, p.job_id)
  }).immediate()
  return getProject(user, id)
}
