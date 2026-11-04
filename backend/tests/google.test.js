// Google sign-in tests. The real google-auth-library verification path runs (signature, audience, issuer,
// expiry); only the certificate *lookup* is pointed at a locally generated RSA key instead of Google's servers.
// This does NOT prove a real Google login works; that needs real credentials and a browser (see QA_REPORT.md).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import jwt from 'jsonwebtoken'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fh-google-'))
const CLIENT_ID = 'test-client-id.apps.googleusercontent.com'
process.env.DB_PATH = path.join(dir, 'g.sqlite')
process.env.GOOGLE_CLIENT_ID = CLIENT_ID
process.env.JWT_SECRET = 'test-secret'

const good = generateKeyPairSync('rsa', { modulusLength: 2048 })
const evil = generateKeyPairSync('rsa', { modulusLength: 2048 })
const pem = (k) => k.publicKey.export({ type: 'spki', format: 'pem' })

let auth, db, googleSvc, seed
before(async () => {
  db = (await import('../config/database.js')).default
  seed = await import('../database/seed.js')
  seed.seedIfEmpty()
  googleSvc = await import('../services/googleAuthService.js')
  auth = await import('../services/authService.js')
  googleSvc.googleClient.getFederatedSignonCertsAsync = async () => ({ certs: { k1: pem(good) }, format: 'PEM' })
})
after(() => { db.close(); fs.rmSync(dir, { recursive: true, force: true }) })

const token = (claims = {}, { key = good, kid = 'k1' } = {}) => jwt.sign({
  iss: 'https://accounts.google.com', aud: CLIENT_ID, sub: 'g-sub-1', email: 'new.client@gmail.com', email_verified: true, name: 'New Client', ...claims,
}, key.privateKey, { algorithm: 'RS256', keyid: kid, ...(claims.exp ? { noTimestamp: false } : { expiresIn: '1h' }) })

const expectStatus = async (promise, status) => {
  await assert.rejects(promise, (e) => { assert.equal(e.status, status, e.message); return true })
}

test('new Google client registration creates a client account and returns user + JWT', async () => {
  const r = await auth.googleAuth({ credential: token(), role: 'client' })
  assert.equal(r.user.role, 'client')
  assert.equal(r.user.email, 'new.client@gmail.com')
  assert.equal(r.user.authProvider, 'google')
  assert.equal(r.user.hasPassword, false)
  assert.ok(r.token)
  assert.equal(JSON.stringify(r).includes('password_hash'), false)
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get('new.client@gmail.com')
  assert.equal(row.google_sub, 'g-sub-1')
  assert.equal(row.password_hash, null)
})

test('returning Google user signs in to the same account (no duplicate, role param ignored)', async () => {
  const before = db.prepare('SELECT COUNT(*) n FROM users').get().n
  const a = await auth.googleAuth({ credential: token() })
  const b = await auth.googleAuth({ credential: token(), role: 'freelancer' })
  assert.equal(a.user.id, b.user.id)
  assert.equal(b.user.role, 'client')
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n, before)
})

test('new Google freelancer registration', async () => {
  const r = await auth.googleAuth({ credential: token({ sub: 'g-sub-2', email: 'free.lancer@gmail.com', name: 'Free Lancer' }), role: 'freelancer' })
  assert.equal(r.user.role, 'freelancer')
  assert.equal(r.user.hourlyRate, 30)
})

test('unknown Google account without a role asks for one (ROLE_REQUIRED) and creates nothing', async () => {
  const n = db.prepare('SELECT COUNT(*) n FROM users').get().n
  await assert.rejects(auth.googleAuth({ credential: token({ sub: 'g-sub-3', email: 'who@gmail.com' }) }), (e) => { assert.equal(e.status, 422); assert.equal(e.code, 'ROLE_REQUIRED'); return true })
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n, n)
})

test('invalid roles are rejected, including admin', async () => {
  await expectStatus(auth.googleAuth({ credential: token({ sub: 'g-sub-4', email: 'a@gmail.com' }), role: 'admin' }), 400)
  await expectStatus(auth.googleAuth({ credential: token({ sub: 'g-sub-4', email: 'a@gmail.com' }), role: 'superuser' }), 400)
  assert.equal(db.prepare('SELECT 1 FROM users WHERE email = ?').get('a@gmail.com'), undefined)
})

test('tokens that fail verification are rejected (signature, audience, issuer, expiry, garbage)', async () => {
  await expectStatus(auth.googleAuth({ credential: token({}, { key: evil }), role: 'client' }), 401) // wrong signing key
  await expectStatus(auth.googleAuth({ credential: token({ aud: 'someone-else.apps.googleusercontent.com' }), role: 'client' }), 401)
  await expectStatus(auth.googleAuth({ credential: token({ iss: 'https://evil.example.com' }), role: 'client' }), 401)
  const past = Math.floor(Date.now() / 1000) - 7200
  await expectStatus(auth.googleAuth({ credential: token({ iat: past - 3600, exp: past }), role: 'client' }), 401)
  await expectStatus(auth.googleAuth({ credential: 'not-a-jwt', role: 'client' }), 401)
})

test('unverified Google email is rejected', async () => {
  await expectStatus(auth.googleAuth({ credential: token({ sub: 'g-sub-5', email: 'unverified@gmail.com', email_verified: false }), role: 'client' }), 403)
  assert.equal(db.prepare('SELECT 1 FROM users WHERE email = ?').get('unverified@gmail.com'), undefined)
})

test('an existing password account is never auto-linked by matching email', async () => {
  await expectStatus(auth.googleAuth({ credential: token({ sub: 'g-sub-6', email: 'sarah@northwind.com' }), role: 'client' }), 409)
  const sarah = db.prepare('SELECT * FROM users WHERE email = ?').get('sarah@northwind.com')
  assert.equal(sarah.google_sub, null)
  assert.ok(sarah.password_hash)
  // ...and her password login still works.
  assert.ok(auth.login({ email: 'sarah@northwind.com', password: 'Password123' }).token)
})

test('Google-only accounts cannot use password login or password change; email/password login unaffected', async () => {
  assert.throws(() => auth.login({ email: 'new.client@gmail.com', password: 'anything1' }), (e) => e.status === 401 && /Google/.test(e.message))
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get('new.client@gmail.com')
  assert.throws(() => auth.changePassword(u, { current: 'x', next: 'NewPass123' }), (e) => e.status === 400)
  assert.equal(auth.login({ email: 'priya@dev.com', password: 'Password123' }).user.role, 'freelancer')
})

test('suspended Google users are blocked', async () => {
  db.prepare(`UPDATE users SET status = 'suspended' WHERE google_sub = 'g-sub-2'`).run()
  await expectStatus(auth.googleAuth({ credential: token({ sub: 'g-sub-2', email: 'free.lancer@gmail.com' }) }), 403)
})

test('a Google subject can only exist once (unique index)', () => {
  assert.throws(() => db.prepare(`INSERT INTO users (name,email,google_sub,role,created_at,updated_at) VALUES ('x','dupe@x.com','g-sub-1','client','t','t')`).run(), /UNIQUE/)
})

test('server without GOOGLE_CLIENT_ID reports 503 instead of accepting tokens', async () => {
  const saved = process.env.GOOGLE_CLIENT_ID
  process.env.GOOGLE_CLIENT_ID = ''
  await expectStatus(auth.googleAuth({ credential: token(), role: 'client' }), 503)
  process.env.GOOGLE_CLIENT_ID = saved
})
