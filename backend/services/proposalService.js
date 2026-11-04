import db from '../config/database.js'
import { conflict, forbidden, notFound } from '../utils/apiResponse.js'
import { nowIso, proposalOut, projectOut, usersByIds } from '../utils/mappers.js'
import { istDatePlusDays } from '../utils/time.js'

const hydrate = (rows) => {
  const users = usersByIds(rows.map((r) => r.freelancer_id))
  return rows.map((r) => proposalOut(r, users))
}

export function listProposals(user) {
  const base = 'SELECT p.* FROM proposals p'
  const order = 'ORDER BY p.created_at DESC, p.id DESC'
  if (user.role === 'admin') return hydrate(db.prepare(`${base} ${order}`).all())
  if (user.role === 'freelancer') return hydrate(db.prepare(`${base} WHERE p.freelancer_id = ? ${order}`).all(user.id))
  return hydrate(db.prepare(`${base} JOIN jobs j ON j.id = p.job_id WHERE j.client_id = ? AND p.status <> 'withdrawn' ${order}`).all(user.id))
}

export const myProposals = (user) => hydrate(db.prepare('SELECT * FROM proposals WHERE freelancer_id = ? ORDER BY created_at DESC, id DESC').all(user.id))

export function proposalsForJob(user, jobId) {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId)
  if (!job) throw notFound('Job not found.')
  if (user.role !== 'admin' && job.client_id !== user.id) throw forbidden('Only the job owner can view its proposals.')
  return hydrate(db.prepare(`SELECT * FROM proposals WHERE job_id = ? AND status <> 'withdrawn' ORDER BY created_at DESC, id DESC`).all(jobId))
}

export function submitProposal(user, { jobId, amount, deliveryDays, coverLetter }) {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId)
  if (!job) throw notFound('Job not found.')
  if (job.status !== 'open') throw conflict('This job is no longer accepting proposals.')
  if (db.prepare(`SELECT 1 FROM proposals WHERE job_id = ? AND freelancer_id = ? AND status <> 'withdrawn'`).get(jobId, user.id))
    throw conflict('You have already submitted a proposal for this job.')
  const now = nowIso()
  const info = db.prepare(`INSERT INTO proposals (job_id, freelancer_id, cover_letter, proposed_amount, delivery_days, status, created_at, updated_at) VALUES (?,?,?,?,?, 'pending', ?, ?)`)
    .run(jobId, user.id, coverLetter.trim(), Number(amount), Number(deliveryDays), now, now)
  return hydrate([db.prepare('SELECT * FROM proposals WHERE id = ?').get(info.lastInsertRowid)])[0]
}

function loadPending(id) {
  const p = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id)
  if (!p) throw notFound('Proposal not found.')
  return p
}

export function withdraw(user, id) {
  const p = loadPending(id)
  if (p.freelancer_id !== user.id) throw forbidden('You can only withdraw your own proposals.')
  if (p.status !== 'pending') throw conflict('Only pending proposals can be withdrawn.')
  db.prepare(`UPDATE proposals SET status = 'withdrawn', updated_at = ? WHERE id = ?`).run(nowIso(), id)
  return hydrate([loadPending(id)])[0]
}

function assertJobOwner(user, proposal) {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(proposal.job_id)
  if (!job || job.client_id !== user.id) throw forbidden('Only the client who posted this job can do that.')
  return job
}

export function reject(user, id) {
  const p = loadPending(id)
  assertJobOwner(user, p)
  if (p.status !== 'pending') throw conflict('Only pending proposals can be rejected.')
  db.prepare(`UPDATE proposals SET status = 'rejected', updated_at = ? WHERE id = ?`).run(nowIso(), id)
  return hydrate([loadPending(id)])[0]
}

// Deadline is a calendar date in IST (today in India + delivery days).
const addDays = (days) => istDatePlusDays(days)

// Atomic: accept proposal, reject rivals, create project, create deposit (paid) + final (pending) payments, move job to in_progress.
const acceptTx = db.transaction((user, id) => {
  const p = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id)
  if (!p) throw notFound('Proposal not found.')
  const job = assertJobOwner(user, p)
  if (p.status !== 'pending') throw conflict('This proposal can no longer be accepted.')
  if (job.status !== 'open') throw conflict('This job is no longer open.')
  if (db.prepare('SELECT 1 FROM projects WHERE job_id = ?').get(job.id)) throw conflict('A project already exists for this job.')

  const now = nowIso()
  db.prepare(`UPDATE proposals SET status = 'accepted', updated_at = ? WHERE id = ?`).run(now, p.id)
  db.prepare(`UPDATE proposals SET status = 'rejected', updated_at = ? WHERE job_id = ? AND id <> ? AND status = 'pending'`).run(now, job.id, p.id)
  db.prepare(`UPDATE jobs SET status = 'in_progress', updated_at = ? WHERE id = ?`).run(now, job.id)

  const deadline = addDays(p.delivery_days)
  const proj = db.prepare(`INSERT INTO projects (job_id, client_id, freelancer_id, proposal_id, title, budget, deadline, status, progress, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?, 'not_started', 0, ?, ?)`).run(job.id, job.client_id, p.freelancer_id, p.id, job.title, p.proposed_amount, deadline, now, now)

  const half = Math.round(p.proposed_amount / 2)
  const pay = db.prepare(`INSERT INTO payments (project_id, client_id, freelancer_id, amount, payment_type, payment_status, payment_date, created_at) VALUES (?,?,?,?,?,?,?,?)`)
  pay.run(proj.lastInsertRowid, job.client_id, p.freelancer_id, half, 'deposit', 'paid', now, now)
  pay.run(proj.lastInsertRowid, job.client_id, p.freelancer_id, p.proposed_amount - half, 'final', 'pending', deadline, now)
  return proj.lastInsertRowid
})

export function accept(user, id) {
  const projectId = acceptTx.immediate(user, id)
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId)
  return projectOut(row, usersByIds([row.client_id, row.freelancer_id]), db.prepare('SELECT * FROM jobs WHERE id = ?').get(row.job_id))
}
