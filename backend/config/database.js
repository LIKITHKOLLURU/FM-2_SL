import Database from 'better-sqlite3'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runMigrations } from '../database/migrate.js'

dotenv.config()

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(root, 'database', 'freelancehub.sqlite')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
// Existing databases may already have an older `users` table; CREATE IF NOT EXISTS leaves it untouched
// and the migration below upgrades it in place.
db.exec(fs.readFileSync(path.join(root, 'database', 'schema.sql'), 'utf8'))
runMigrations(db, { dbPath: DB_PATH })

export const isDbHealthy = () => {
  try { return db.prepare('SELECT 1 AS ok').get().ok === 1 } catch { return false }
}

export default db
