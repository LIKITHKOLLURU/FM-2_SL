// Backward-compatible, idempotent migrations. Runs on every start; does nothing when already up to date.
import fs from 'node:fs'

const USERS_COLUMNS = ['id', 'name', 'email', 'password_hash', 'role', 'title', 'company', 'location', 'bio', 'skills', 'hourly_rate', 'status', 'created_at', 'updated_at']

const USERS_NEW_SQL = `
CREATE TABLE users_new (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  google_sub    TEXT,
  role          TEXT NOT NULL CHECK (role IN ('client','freelancer','admin')),
  title         TEXT NOT NULL DEFAULT '',
  company       TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '',
  skills        TEXT NOT NULL DEFAULT '[]',
  hourly_rate   REAL,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
)`

/**
 * v2: users.password_hash becomes nullable (Google-only accounts) and users.google_sub is added.
 * SQLite cannot drop NOT NULL in place, so the table is rebuilt using the documented procedure
 * (foreign keys off, copy, drop, rename, foreign_key_check). All rows and ids are preserved,
 * so every foreign key into users(id) stays valid.
 */
export function migrateUsersForGoogle(db, { dbPath } = {}) {
  const cols = db.prepare(`PRAGMA table_info(users)`).all()
  const hash = cols.find((c) => c.name === 'password_hash')
  const needsRebuild = !cols.some((c) => c.name === 'google_sub') || (hash && hash.notnull === 1)
  let rebuilt = false

  if (needsRebuild) {
    // Safety copy of the database file before touching the table.
    if (dbPath && dbPath !== ':memory:' && fs.existsSync(dbPath)) {
      db.pragma('wal_checkpoint(TRUNCATE)')
      fs.copyFileSync(dbPath, `${dbPath}.pre-google-migration.bak`)
    }
    const hadFk = db.pragma('foreign_keys', { simple: true })
    db.pragma('foreign_keys = OFF') // must be set outside a transaction
    try {
      db.transaction(() => {
        const before = db.prepare('SELECT COUNT(*) n FROM users').get().n
        db.exec(USERS_NEW_SQL)
        const list = USERS_COLUMNS.join(', ')
        db.exec(`INSERT INTO users_new (${list}) SELECT ${list} FROM users`)
        const after = db.prepare('SELECT COUNT(*) n FROM users_new').get().n
        if (before !== after) throw new Error(`Migration aborted: copied ${after} of ${before} users.`)
        db.exec('DROP TABLE users')
        db.exec('ALTER TABLE users_new RENAME TO users')
        const violations = db.prepare('PRAGMA foreign_key_check').all()
        if (violations.length) throw new Error(`Migration aborted: ${violations.length} foreign key violations.`)
      }).immediate()
      rebuilt = true
    } finally {
      db.pragma(`foreign_keys = ${hadFk ? 'ON' : 'OFF'}`)
    }
  }

  // A Google identity may belong to only one account; NULLs (password users) are unrestricted.
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS uq_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL`)
  return { rebuilt }
}

export function runMigrations(db, opts) {
  return { users: migrateUsersForGoogle(db, opts) }
}
