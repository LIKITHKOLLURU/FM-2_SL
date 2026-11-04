import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 5055
const BASE = `http://localhost:${PORT}/api`
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fh-test-'))
const DB_PATH = path.join(dir, 'test.sqlite')
const serverFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'server.js')
let child

async function start() {
  child = spawn(process.execPath, [serverFile], { env: { ...process.env, PORT, DB_PATH, NODE_ENV: 'test', GOOGLE_CLIENT_ID: '', JWT_SECRET: 'test-secret', FRONTEND_URL: 'http://localhost:5173' }, stdio: 'ignore' })
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${BASE}/health`)).ok) return } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('server did not start')
}
const stop = () => new Promise((r) => { child.once('exit', r); child.kill() })

async function api(method, url, { token, body } = {}) {
  const res = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const json = await res.json()
  return { ...json, status: res.status }
}
const login = async (email, password = 'Password123') => { const r = await api('POST', '/auth/login', { body: { email, password } }); assert.equal(r.status, 200, `login ${email}`); return r.data }

before(start)
after(async () => { await stop(); fs.rmSync(dir, { recursive: true, force: true }) })

const state = {}

test('health reports database connection', async () => {
  const r = await api('GET', '/health')
  assert.equal(r.status, 200)
  assert.equal(r.database, 'connected')
})

test('1-3 admin, client and freelancer can log in; password never returned', async () => {
  state.admin = await login('admin@freelancehub.com', 'Admin123')
  state.client = await login('sarah@northwind.com')
  state.priya = await login('priya@dev.com')
  state.marcus = await login('marcus@design.com')
  state.elena = await login('elena@words.com')
  assert.equal(state.admin.user.role, 'admin')
  for (const k of ['admin', 'client', 'priya']) {
    assert.ok(state[k].token)
    assert.equal(JSON.stringify(state[k]).includes('password_hash') || 'password' in state[k].user, false)
  }
  const bad = await api('POST', '/auth/login', { body: { email: 'priya@dev.com', password: 'wrong' } })
  assert.equal(bad.status, 401)
  const me = await api('GET', '/auth/me', { token: state.priya.token })
  assert.equal(me.data.email, 'priya@dev.com')
})

test('registration validates input and rejects duplicate emails', async () => {
  assert.equal((await api('POST', '/auth/register', { body: { name: 'A', email: 'x', password: '1', role: 'admin' } })).status, 400)
  const ok = await api('POST', '/auth/register', { body: { name: 'New Person', email: 'new@person.com', password: 'Secret123', role: 'freelancer' } })
  assert.equal(ok.status, 201)
  assert.equal(ok.data.user.role, 'freelancer')
  assert.equal((await api('POST', '/auth/register', { body: { name: 'New Person', email: 'NEW@person.com', password: 'Secret123', role: 'client' } })).status, 409)
})

test('unauthenticated and wrong-role access is rejected', async () => {
  assert.equal((await api('GET', '/projects')).status, 401)
  assert.equal((await api('GET', '/admin/users', { token: state.client.token })).status, 403)
  assert.equal((await api('POST', '/jobs', { token: state.priya.token, body: {} })).status, 403)
  assert.equal((await api('GET', '/jobs', { token: 'garbage' })).status, 401)
})

test('4 client creates a job (validation enforced)', async () => {
  assert.equal((await api('POST', '/jobs', { token: state.client.token, body: { title: 'short' } })).status, 400)
  const r = await api('POST', '/jobs', { token: state.client.token, body: { title: 'Build a landing page for my bakery', description: 'x'.repeat(60), category: 'Web Development', budgetMin: 500, budgetMax: 1000, duration: '2 weeks', experience: 'Entry', skills: ['HTML', 'CSS'] } })
  assert.equal(r.status, 201)
  assert.equal(r.data.status, 'open')
  assert.equal(r.data.clientId, state.client.user.id)
  state.job = r.data
})

test('5 freelancer browses, searches and filters jobs; public sees only open jobs', async () => {
  const list = await api('GET', '/jobs', { token: state.priya.token })
  assert.ok(list.data.some((j) => j.id === state.job.id))
  assert.ok(list.data[0].client.name)
  const found = await api('GET', '/jobs?q=bakery&category=Web%20Development')
  assert.equal(found.data.length, 1)
  assert.equal((await api('GET', '/jobs?q=zzzzzz')).data.length, 0)
  assert.ok((await api('GET', '/jobs?maxBudget=600')).data.every((j) => j.budgetMin <= 600))
  const pub = await api('GET', '/jobs')
  assert.ok(pub.data.every((j) => j.status === 'open'))
})

test('6-7 freelancer submits a proposal; duplicate is rejected', async () => {
  const body = { jobId: state.job.id, amount: 800, deliveryDays: 14, coverLetter: 'y'.repeat(60) }
  const r = await api('POST', '/proposals', { token: state.priya.token, body })
  assert.equal(r.status, 201)
  state.priyaProposal = r.data
  assert.equal((await api('POST', '/proposals', { token: state.priya.token, body })).status, 409)
  assert.equal((await api('POST', '/proposals', { token: state.client.token, body })).status, 403)
  const m = await api('POST', '/proposals', { token: state.marcus.token, body: { ...body, amount: 900 } })
  const e = await api('POST', '/proposals', { token: state.elena.token, body: { ...body, amount: 700 } })
  state.marcusProposal = m.data
  state.elenaProposal = e.data
})

test('8 client views proposals; other clients cannot', async () => {
  const forJob = await api('GET', `/proposals/job/${state.job.id}`, { token: state.client.token })
  assert.equal(forJob.data.length, 3)
  assert.ok(forJob.data[0].freelancer.name)
  const david = await login('david@brightpath.io')
  assert.equal((await api('GET', `/proposals/job/${state.job.id}`, { token: david.token })).status, 403)
  assert.equal((await api('PUT', `/proposals/${state.priyaProposal.id}/accept`, { token: david.token })).status, 403)
  const all = await api('GET', '/proposals', { token: state.client.token })
  assert.ok(all.data.some((p) => p.id === state.priyaProposal.id))
})

test('9-13 accepting a proposal is atomic: rivals rejected, project + 2 payments created', async () => {
  const r = await api('PUT', `/proposals/${state.priyaProposal.id}/accept`, { token: state.client.token })
  assert.equal(r.status, 200)
  state.project = r.data
  assert.equal(r.data.status, 'not_started')
  assert.equal(r.data.budget, 800)
  assert.equal(r.data.freelancerId, state.priya.user.id)

  const props = (await api('GET', `/proposals/job/${state.job.id}`, { token: state.client.token })).data
  const byId = Object.fromEntries(props.map((p) => [p.id, p.status]))
  assert.equal(byId[state.priyaProposal.id], 'accepted')
  assert.equal(byId[state.marcusProposal.id], 'rejected')
  assert.equal(byId[state.elenaProposal.id], 'rejected')

  const pays = (await api('GET', '/payments', { token: state.client.token })).data.filter((p) => p.projectId === state.project.id)
  assert.equal(pays.length, 2)
  assert.equal(pays.reduce((s, p) => s + p.amount, 0), 800)
  assert.equal(pays.find((p) => p.paymentType === 'deposit').status, 'paid')
  assert.equal(pays.find((p) => p.paymentType === 'final').status, 'pending')
  state.finalPayment = pays.find((p) => p.paymentType === 'final')

  const job = await api('GET', `/jobs/${state.job.id}`, { token: state.client.token })
  assert.equal(job.data.status, 'in_progress')

  // Second accept (race / double click) must fail without creating a second project.
  assert.equal((await api('PUT', `/proposals/${state.marcusProposal.id}/accept`, { token: state.client.token })).status, 409)
  assert.equal((await api('PUT', `/proposals/${state.priyaProposal.id}/accept`, { token: state.client.token })).status, 409)
  const projects = (await api('GET', '/projects', { token: state.client.token })).data.filter((p) => p.jobId === state.job.id)
  assert.equal(projects.length, 1)
})

test('14 freelancer updates project status; others cannot; transitions validated', async () => {
  const id = state.project.id
  assert.equal((await api('PUT', `/projects/${id}/status`, { token: state.client.token, body: { status: 'in_progress' } })).status, 403)
  assert.equal((await api('PUT', `/projects/${id}/status`, { token: state.marcus.token, body: { status: 'in_progress' } })).status, 403)
  assert.equal((await api('PUT', `/projects/${id}/status`, { token: state.priya.token, body: { status: 'completed' } })).status, 409, 'cannot skip to completed')
  assert.equal((await api('PUT', `/projects/${id}/status`, { token: state.priya.token, body: { status: 'bogus' } })).status, 400)
  const r = await api('PUT', `/projects/${id}/status`, { token: state.priya.token, body: { status: 'in_progress', progress: 40 } })
  assert.equal(r.data.progress, 40)
  const done = await api('PUT', `/projects/${id}/status`, { token: state.priya.token, body: { status: 'completed' } })
  assert.equal(done.data.progress, 100)
  assert.equal((await api('GET', `/jobs/${state.job.id}`, { token: state.client.token })).data.status, 'completed')
  assert.equal((await api('PUT', `/projects/${id}/status`, { token: state.priya.token, body: { status: 'in_progress' } })).status, 409, 'completed is locked for freelancer')
})

test('15 only the paying client can pay; double payment prevented', async () => {
  const id = state.finalPayment.id
  assert.equal((await api('PUT', `/payments/${id}/pay`, { token: state.priya.token })).status, 403)
  const david = await login('david@brightpath.io')
  assert.equal((await api('PUT', `/payments/${id}/pay`, { token: david.token })).status, 403)
  const r = await api('PUT', `/payments/${id}/pay`, { token: state.client.token })
  assert.equal(r.data.status, 'paid')
  assert.ok(Math.abs(Date.parse(r.data.date) - Date.now()) < 60000, 'payment timestamp is the actual UTC time')
  assert.equal((await api('PUT', `/payments/${id}/pay`, { token: state.client.token })).status, 409)
  assert.equal((await api('PUT', `/payments/${id}/refund`, { token: state.client.token })).status, 403)
  const mine = await api('GET', '/payments', { token: state.priya.token })
  assert.ok(mine.data.every((p) => p.freelancerId === state.priya.user.id))
  assert.ok(mine.meta.totals.paid >= 800)
})

test('16 admin dashboard reflects the new activity', async () => {
  const d = (await api('GET', '/admin/dashboard', { token: state.admin.token })).data
  assert.equal(d.users.total, 7)
  assert.equal(d.jobs.total, 11)
  assert.equal(d.projects.total, 4)
  assert.equal(d.projects.byStatus.completed, 2)
  assert.equal(d.proposals.byStatus.accepted, 4)
  assert.equal(d.payments.pending, 2100 + 550 + 0)
  assert.equal(d.payments.paid, 2100 + 550 + 225 * 2 + 800)
})

test('18 a job with a project cannot be deleted; unrelated job can', async () => {
  const del = await api('DELETE', `/jobs/${state.job.id}`, { token: state.client.token })
  assert.equal(del.status, 409)
  const david = await login('david@brightpath.io')
  assert.equal((await api('DELETE', '/jobs/1', { token: david.token })).status, 403, 'not the owner')
  const tmp = await api('POST', '/jobs', { token: state.client.token, body: { title: 'Temporary job to delete soon', description: 'x'.repeat(60), category: 'Design', budgetMin: 100, budgetMax: 200, duration: '1 week', skills: ['a'] } })
  const upd = await api('PUT', `/jobs/${tmp.data.id}`, { token: state.client.token, body: { status: 'closed' } })
  assert.equal(upd.data.status, 'closed')
  assert.equal((await api('DELETE', `/jobs/${tmp.data.id}`, { token: state.client.token })).status, 200)
  assert.equal((await api('GET', `/jobs/${tmp.data.id}`, { token: state.client.token })).status, 404)
})

test('admin user management: suspend blocks login, self-protection, delete integrity', async () => {
  const users = (await api('GET', '/admin/users?role=freelancer', { token: state.admin.token })).data
  assert.ok(users.length >= 3 && users.every((u) => u.role === 'freelancer'))
  const newcomer = users.find((u) => u.email === 'new@person.com')
  assert.equal((await api('PUT', `/admin/users/${state.admin.user.id}/status`, { token: state.admin.token, body: { status: 'suspended' } })).status, 403)
  assert.equal((await api('DELETE', `/admin/users/${state.admin.user.id}`, { token: state.admin.token })).status, 403)
  assert.equal((await api('DELETE', `/admin/users/${state.priya.user.id}`, { token: state.admin.token })).status, 409, 'has projects')
  await api('PUT', `/admin/users/${newcomer.id}/status`, { token: state.admin.token, body: { status: 'suspended' } })
  const blocked = await api('POST', '/auth/login', { body: { email: 'new@person.com', password: 'Secret123' } })
  assert.equal(blocked.status, 403)
  assert.equal((await api('DELETE', `/admin/users/${newcomer.id}`, { token: state.admin.token })).status, 200)
})

test('timestamps are live UTC ISO; deadlines are IST calendar dates', async () => {
  const jobs = (await api('GET', '/jobs', { token: state.client.token })).data
  const mine = jobs.find((j) => j.id === state.job.id)
  assert.ok(Math.abs(Date.parse(mine.createdAt) - Date.now()) < 5 * 60000, 'job createdAt is now')
  assert.match(mine.createdAt, /Z$/)
  const props = (await api('GET', `/proposals/job/${state.job.id}`, { token: state.client.token })).data
  assert.ok(Math.abs(Date.parse(props[0].createdAt) - Date.now()) < 5 * 60000, 'proposal createdAt is now')
  const proj = (await api('GET', `/projects/${state.project.id}`, { token: state.client.token })).data
  assert.ok(Math.abs(Date.parse(proj.startedAt) - Date.now()) < 5 * 60000, 'project startedAt is now')
  assert.match(proj.dueDate, /^\d{4}-\d{2}-\d{2}$/)
  const istToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  const d = new Date(istToday + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 14)
  assert.equal(proj.dueDate, d.toISOString().slice(0, 10), 'due date = IST today + 14 delivery days')
})

test('POST /auth/google validates input before touching Google', async () => {
  assert.equal((await api('POST', '/auth/google', { body: {} })).status, 400)
  assert.equal((await api('POST', '/auth/google', { body: { credential: 'abc', role: 'admin' } })).status, 400)
  assert.equal((await api('POST', '/auth/google', { body: { credential: 'abc', role: 'client' } })).status, 503, 'not configured -> 503')
})

test('profile update and password change', async () => {
  const r = await api('PUT', '/auth/me', { token: state.elena.token, body: { title: 'Senior Writer', skills: ['SEO', 'Editing'], role: 'admin', status: 'suspended' } })
  assert.equal(r.data.title, 'Senior Writer')
  assert.equal(r.data.role, 'freelancer', 'role cannot be self-edited')
  assert.equal(r.data.status, 'active')
  assert.equal((await api('PUT', '/auth/password', { token: state.elena.token, body: { current: 'nope', next: 'NewPass123' } })).status, 400)
  assert.equal((await api('PUT', '/auth/password', { token: state.elena.token, body: { current: 'Password123', next: 'NewPass123' } })).status, 200)
  await login('elena@words.com', 'NewPass123')
})

test('data persists across a backend restart and seed does not overwrite', async () => {
  await stop()
  await start()
  const t = await login('sarah@northwind.com')
  const projects = await api('GET', '/projects', { token: t.token })
  assert.ok(projects.data.some((p) => p.id === state.project.id && p.status === 'completed'))
  const jobs = await api('GET', '/jobs', { token: t.token })
  assert.ok(jobs.data.some((j) => j.id === state.job.id))
  await login('elena@words.com', 'NewPass123') // changed password survived
})

test('admin reset restores the demo data (dev only)', async () => {
  const admin = await login('admin@freelancehub.com', 'Admin123')
  assert.equal((await api('POST', '/admin/reset', { token: admin.token })).status, 200)
  const d = (await api('GET', '/admin/dashboard', { token: admin.token })).data
  assert.equal(d.users.total, 6)
  assert.equal(d.jobs.total, 10)
  assert.equal(d.projects.total, 3)
  assert.equal((await api('GET', '/auth/me', { token: admin.token })).status, 200, 'admin session still valid')
})
