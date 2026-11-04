import { OAuth2Client } from 'google-auth-library'
import { HttpError, unauthorized } from '../utils/apiResponse.js'

// Exported so tests can point certificate lookup at a locally generated key.
export const googleClient = new OAuth2Client()

export const isGoogleConfigured = () => !!process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.startsWith('your_')

/**
 * Verifies a Google ID token and returns its trusted claims.
 * google-auth-library checks: RS256 signature against Google's certs, audience === our client id,
 * issuer (accounts.google.com), and expiry. We additionally require a verified email and a subject.
 */
export async function verifyGoogleCredential(credential) {
  if (!isGoogleConfigured()) throw new HttpError(503, 'Google sign-in is not configured on the server.')
  let payload
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID })
    payload = ticket.getPayload()
  } catch {
    throw unauthorized('Invalid or expired Google credential.')
  }
  if (!payload?.sub || !payload.email) throw unauthorized('Google credential is missing required claims.')
  if (payload.email_verified !== true) throw new HttpError(403, 'Your Google email address is not verified.')
  return { sub: payload.sub, email: payload.email.toLowerCase(), name: payload.name || payload.email.split('@')[0] }
}
