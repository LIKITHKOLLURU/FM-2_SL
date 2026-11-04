import { test } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { migrateUsersForGoogle } from '../database/migrate.js'

// The users table exactly as it was before the Google enhancement, plus tables that reference it.
const LEGACY = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('client','freelancer','admin')),
  title TEXT NOT NULL DEFAULT '', company TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '',
  skills TEXT NOT NULL DEFAULT '[]', hourly_rate REAL, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL);
CREATE TABLE payments (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, amount REAL NOT NULL);
`

function legacyDb() {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(LEGACY)
  const u = db.prepare(`INSERT INTO users (name,email,password_hash,role,created_at,updated_at) VALUES (?,?,?,?, '2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`)
  u.run('Admin', 'admin@x.com', 'hash-a', 'admin')
  u.run('Client', 'client@x.com', 'hash-c', 'client')
  u.run('Free', 'free@x.com', 'hash-f', 'freelancer')
  db.prepare('INSERT INTO jobs (client_id,title) VALUES (2,?)').run('Job A')
  db.prepare('INSERT INTO payments (client_id,amount) VALUES (2,100)').run()
  return db
}

test('migration preserves every user, id and password hash, and keeps foreign keys working', () => {
  const db = legacyDb()
  const before = db.prepare('SELECT * FROM users ORDER BY id').all()
  const r = migrateUsersForGoogle(db)
  assert.equal(r.rebuilt, true)

  const after = db.prepare('SELECT * FROM users ORDER BY id').all()
  assert.equal(after.length, 3)
  after.forEach((row, i) => { for (const k of Object.keys(before[i])) assert.equal(row[k], before[i][k], `${k} preserved`) })
  assert.equal(db.pragma('foreign_keys', { simple: true }), 1, 'foreign_keys restored')
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
  assert.equal(db.prepare('SELECT COUNT(*) n FROM jobs').get().n, 1)
  assert.equal(db.prepare('SELECT COUNT(*) n FROM payments').get().n, 1)

  // FK enforcement is still live against the rebuilt table.
  assert.throws(() => db.prepare('INSERT INTO jobs (client_id,title) VALUES (999,?)').run('orphan'), /FOREIGN KEY/)
  assert.throws(() => db.prepare('DELETE FROM users WHERE id = 2').run(), /FOREIGN KEY/, 'RESTRICT from payments still applies')
  db.prepare('DELETE FROM payments').run()
  db.prepare('DELETE FROM users WHERE id = 2').run()
  assert.equal(db.prepare('SELECT COUNT(*) n FROM jobs').get().n, 0, 'ON DELETE CASCADE still applies')
})

test('migrated table allows Google-only users and enforces unique google_sub and email', () => {
  const db = legacyDb()
  migrateUsersForGoogle(db)
  const ins = db.prepare(`INSERT INTO users (name,email,password_hash,google_sub,role,created_at,updated_at) VALUES (?,?,NULL,?,?,'t','t')`)
  ins.run('G1', 'g1@x.com', 'sub-1', 'client')
  ins.run('G2', 'g2@x.com', null, 'client') // password-less, no google id
  ins.run('G3', 'g3@x.com', null, 'client') // multiple NULL google_sub allowed
  assert.throws(() => ins.run('G4', 'g4@x.com', 'sub-1', 'client'), /UNIQUE/)
  assert.throws(() => ins.run('G5', 'G1@X.com', 'sub-5', 'client'), /UNIQUE/, 'email unique, case-insensitive')
  const next = db.prepare('INSERT INTO users (name,email,password_hash,role,created_at,updated_at) VALUES (?,?,?,?,?,?)').run('H', 'h@x.com', 'h', 'client', 't', 't')
  assert.equal(next.lastInsertRowid, 7, 'autoincrement continues after existing ids')
})

test('migration is idempotent and a no-op on an up-to-date schema', () => {
  const db = legacyDb()
  assert.equal(migrateUsersForGoogle(db).rebuilt, true)
  assert.equal(migrateUsersForGoogle(db).rebuilt, false)
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n, 3)
})
