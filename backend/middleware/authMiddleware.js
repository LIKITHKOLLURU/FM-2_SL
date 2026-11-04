import db from '../config/database.js'
import { verifyToken } from '../utils/generateToken.js'
import { unauthorized, forbidden } from '../utils/apiResponse.js'

function resolveUser(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  let payload
  try { payload = verifyToken(header.slice(7)) } catch { throw unauthorized('Session expired or invalid. Please sign in again.') }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
  if (!user) throw unauthorized('Account no longer exists.')
  if (user.status !== 'active') throw forbidden('This account has been suspended. Contact support.')
  return user
}

// Requires a valid token. Identity always comes from the JWT, never from request data.
export const authenticate = (req, res, next) => {
  try {
    const user = resolveUser(req)
    if (!user) throw unauthorized()
    req.user = user
    next()
  } catch (err) { next(err) }
}

// Attaches req.user when a valid token is present; anonymous otherwise.
export const optionalAuth = (req, res, next) => {
  try { req.user = resolveUser(req) || null; next() } catch (err) { next(err) }
}
