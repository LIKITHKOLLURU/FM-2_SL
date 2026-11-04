import bcrypt from 'bcryptjs'
import db from '../config/database.js'
import { generateToken } from '../utils/generateToken.js'
import { HttpError, badRequest, conflict, forbidden, unauthorized } from '../utils/apiResponse.js'
import { verifyGoogleCredential } from './googleAuthService.js'
import { nowIso, userPrivate } from '../utils/mappers.js'

export function register({ name, email, password, role }) {
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email.trim())) throw conflict('An account with this email already exists.')
  const now = nowIso()
  const info = db.prepare(`INSERT INTO users (name, email, password_hash, role, hourly_rate, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`)
    .run(name.trim(), email.trim(), bcrypt.hashSync(password, 10), role, role === 'freelancer' ? 30 : null, now, now)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)
  return { user: userPrivate(user), token: generateToken(user) }
}

// Google sign-in/sign-up. Identity comes only from the verified token; role is honoured for new accounts only.
export async function googleAuth({ credential, role }, verify = verifyGoogleCredential) {
  if (role !== undefined && !['client', 'freelancer'].includes(role)) throw badRequest('Role must be client or freelancer.')
  const g = await verify(credential)

  let user = db.prepare('SELECT * FROM users WHERE google_sub = ?').get(g.sub)
  if (!user) {
    // Never auto-link by email: a password account with this email must be signed into with its password.
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(g.email))
      throw conflict('An account with this email already exists. Please sign in with your email and password.')
    if (!role) throw new HttpError(422, 'No FreelanceHub account found for this Google account. Choose your account type on the Register page, then continue with Google.', undefined, 'ROLE_REQUIRED')
    const now = nowIso()
    const info = db.prepare(`INSERT INTO users (name, email, password_hash, google_sub, role, hourly_rate, created_at, updated_at) VALUES (?,?,NULL,?,?,?,?,?)`)
      .run(g.name.trim().slice(0, 80), g.email, g.sub, role, role === 'freelancer' ? 30 : null, now, now)
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)
  }
  if (user.status !== 'active') throw forbidden('This account has been suspended. Contact support.')
  return { user: userPrivate(user), token: generateToken(user) }
}

export function login({ email, password }) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim())
  if (user && !user.password_hash) throw unauthorized('This account uses Google sign-in. Please continue with Google.')
  // Same message for unknown email and wrong password to avoid account enumeration.
  if (!user || !bcrypt.compareSync(password, user.password_hash)) throw unauthorized('Invalid email or password.')
  if (user.status !== 'active') throw forbidden('This account has been suspended. Contact support.')
  return { user: userPrivate(user), token: generateToken(user) }
}

export const me = (user) => userPrivate(user)

export function updateProfile(user, body) {
  const fields = { name: body.name?.trim(), title: body.title, company: body.company, location: body.location, bio: body.bio }
  const sets = [], vals = []
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v) }
  if (body.skills !== undefined) { sets.push('skills = ?'); vals.push(JSON.stringify(body.skills.map(String))) }
  if (body.hourlyRate !== undefined) { sets.push('hourly_rate = ?'); vals.push(body.hourlyRate === null || body.hourlyRate === '' ? null : Number(body.hourlyRate)) }
  if (sets.length) db.prepare(`UPDATE users SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...vals, nowIso(), user.id)
  return userPrivate(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id))
}

export function changePassword(user, { current, next }) {
  if (!user.password_hash) throw badRequest('Your account uses Google sign-in and has no password.')
  if (!bcrypt.compareSync(current, user.password_hash)) throw badRequest('Current password is incorrect.')
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), nowIso(), user.id)
}
