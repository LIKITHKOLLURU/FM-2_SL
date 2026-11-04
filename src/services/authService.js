// Backend: /api/auth
import { httpClient, API_ENDPOINTS, getToken, setToken } from './api/httpClient.js'

const base = API_ENDPOINTS.auth

export const authService = {
  // Restores the session from the stored JWT; null when signed out or the token is invalid.
  async getSessionUser() {
    if (!getToken()) return null
    try {
      return (await httpClient.get(`${base}/me`)).data
    } catch (err) {
      if (err.status) setToken(null) // rejected by the server (expired/suspended); keep token on network errors
      else throw err
      return null
    }
  },

  async login({ email, password }) {
    const { user, token } = (await httpClient.post(`${base}/login`, { email: email.trim(), password })).data
    setToken(token)
    return user
  },

  async register({ name, email, password, role }) {
    const { user, token } = (await httpClient.post(`${base}/register`, { name: name.trim(), email: email.trim(), password, role })).data
    setToken(token)
    return user
  },

  // `credential` is the Google ID token; the server verifies it. `role` is only used for brand-new accounts.
  async google({ credential, role }) {
    const { user, token } = (await httpClient.post(`${base}/google`, { credential, ...(role ? { role } : {}) })).data
    setToken(token)
    return user
  },

  async logout() {
    setToken(null)
  },

  // The user id is taken from the JWT on the server; the argument is kept for signature compatibility.
  async updateProfile(_id, patch) {
    const { name, title, company, location, bio, skills, hourlyRate } = patch
    return (await httpClient.put(`${base}/me`, { name, title, company, location, bio, skills, hourlyRate })).data
  },

  async changePassword(_id, { current, next }) {
    await httpClient.put(`${base}/password`, { current, next })
  },
}
