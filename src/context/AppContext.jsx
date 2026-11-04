import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService, jobService, proposalService, projectService, paymentService, adminService, loadAll } from '../services/index.js'
import { UNAUTHORIZED_EVENT } from '../services/api/httpClient.js'
import { useToast } from './ToastContext.jsx'

const AppContext = createContext(null)
const EMPTY = { users: [], jobs: [], proposals: [], projects: [], payments: [] }

export function AppProvider({ children }) {
  const toast = useToast()
  const [data, setData] = useState(EMPTY)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [booting, setBooting] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Pulls fresh data from the API for the signed-in user (or the public view for guests).
  const refresh = useCallback(async () => {
    const { me, stats: publicStats, ...all } = await loadAll()
    setData(all)
    setStats(publicStats)
    setUser(me)
    setLoadError(null)
    return all
  }, [])

  const boot = useCallback(() => {
    setBooting(true)
    return refresh().catch((err) => setLoadError(err.message)).finally(() => setBooting(false))
  }, [refresh])

  useEffect(() => { boot() }, [boot])

  // An expired/invalid token anywhere signs the user out; route guards then redirect to /login.
  useEffect(() => {
    const onUnauthorized = () => { setUser(null); setData(EMPTY); toast.error('Your session has expired. Please sign in again.') }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [toast])

  // Runs a service call, refreshes shared state, shows feedback. Returns the
  // result, or null when the call failed (error toast already shown).
  const act = useCallback(async (fn, successMessage) => {
    try {
      const result = await fn()
      await refresh()
      if (successMessage) toast.success(successMessage)
      return result ?? true
    } catch (err) {
      toast.error(err.message || 'Something went wrong.')
      return null
    }
  }, [refresh, toast])

  const actions = useMemo(() => ({
    login: async (creds) => {
      try {
        const u = await authService.login(creds)
        await refresh()
        return u
      } catch (err) { toast.error(err.message); return null }
    },
    register: async (form) => {
      try {
        const u = await authService.register(form)
        await refresh()
        return u
      } catch (err) { toast.error(err.message); return null }
    },
    // Returns the user, 'ROLE_REQUIRED' (unknown Google account signing in without choosing a role) or null on failure.
    googleAuth: async (payload) => {
      try {
        const u = await authService.google(payload)
        await refresh()
        return u
      } catch (err) {
        toast.error(err.message)
        return err.code === 'ROLE_REQUIRED' ? 'ROLE_REQUIRED' : null
      }
    },
    logout: async () => { await authService.logout(); await refresh().catch(() => { setUser(null); setData(EMPTY) }); toast.info('You have been signed out.') },

    updateProfile: (id, patch) => act(() => authService.updateProfile(id, patch), 'Profile updated.'),
    changePassword: (id, pw) => act(() => authService.changePassword(id, pw), 'Password changed.'),

    createJob: (clientId, job) => act(() => jobService.create(clientId, job), 'Job posted successfully.'),
    updateJob: (id, job) => act(() => jobService.update(id, job), 'Job updated.'),
    setJobStatus: (id, status) => act(() => jobService.setStatus(id, status), `Job marked as ${status}.`),
    deleteJob: (id) => act(() => jobService.remove(id), 'Job deleted.'),

    submitProposal: (fid, p) => act(() => proposalService.submit(fid, p), 'Proposal submitted.'),
    withdrawProposal: (id) => act(() => proposalService.withdraw(id), 'Proposal withdrawn.'),
    rejectProposal: (id) => act(() => proposalService.reject(id), 'Proposal rejected.'),
    acceptProposal: (id) => act(() => proposalService.accept(id), 'Proposal accepted. A project has been created.'),

    updateProject: (id, patch) => act(() => projectService.updateStatus(id, patch), 'Project updated.'),

    payPayment: (id) => act(() => paymentService.markPaid(id), 'Payment completed.'),
    refundPayment: (id) => act(() => paymentService.refund(id), 'Payment refunded.'),

    setUserStatus: (id, status) => act(() => adminService.setUserStatus(id, status), `User ${status === 'active' ? 'reactivated' : 'suspended'}.`),
    deleteUser: (id) => act(() => adminService.deleteUser(id), 'User deleted.'),
    resetDemo: () => act(() => adminService.resetDemoData(), 'Demo data has been reset.'),
  }), [act, refresh, toast])

  const lookup = useMemo(() => ({
    userById: (id) => data.users.find((u) => u.id === id),
    jobById: (id) => data.jobs.find((j) => j.id === id),
    projectById: (id) => data.projects.find((p) => p.id === id),
  }), [data])

  const value = useMemo(() => ({ ...data, user, stats, booting, loadError, reload: boot, actions, ...lookup }), [data, user, stats, booting, loadError, boot, actions, lookup])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
