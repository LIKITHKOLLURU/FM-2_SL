// Axios client for the Express + SQLite backend (Phase 2).
import axios from 'axios'

export const API_ENDPOINTS = {
  auth: '/api/auth',
  jobs: '/api/jobs',
  proposals: '/api/proposals',
  projects: '/api/projects',
  payments: '/api/payments',
  admin: '/api/admin',
}

const TOKEN_KEY = 'freelancehub_token'
export const UNAUTHORIZED_EVENT = 'freelancehub:unauthorized'

// Only the JWT is kept in the browser; all business data comes from the API.
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ } }

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

httpClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Resolves to the response body ({ success, data, meta }); rejects with a readable Error.
httpClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 && getToken()) {
      setToken(null)
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    const message = err.response?.data?.message || (err.response ? err.message : 'Cannot reach the server. Make sure the backend is running.')
    const error = new Error(message)
    error.status = err.response?.status
    error.code = err.response?.data?.code
    return Promise.reject(error)
  },
)
