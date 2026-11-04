import jwt from 'jsonwebtoken'

const secret = () => {
  const s = process.env.JWT_SECRET
  if (!s || s === 'replace_with_a_secure_random_secret') {
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be set in production.')
  }
  return s || 'dev-only-insecure-secret'
}

export const generateToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '1d' })

export const verifyToken = (token) => jwt.verify(token, secret())
