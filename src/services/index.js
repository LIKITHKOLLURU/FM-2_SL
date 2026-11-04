// Single import surface for the UI.
import { authService } from './authService.js'
import { jobService } from './jobService.js'
import { proposalService } from './proposalService.js'
import { projectService } from './projectService.js'
import { paymentService } from './paymentService.js'
import { adminService } from './adminService.js'

export { authService, jobService, proposalService, projectService, paymentService, adminService }
export { PROJECT_STATUSES } from './projectService.js'

// The API returns related people embedded in jobs, proposals and projects; the UI looks users up by id.
function collectUsers(me, adminUsers, ...lists) {
  const map = new Map()
  const add = (u) => u && map.set(u.id, { ...map.get(u.id), ...u })
  lists.flat().forEach((e) => { add(e.client); add(e.freelancer) })
  adminUsers.forEach(add)
  add(me)
  return [...map.values()]
}

// Loads everything the signed-in user is allowed to see (guests only get public jobs + stats).
export async function loadAll() {
  const [jobs, stats, me] = await Promise.all([jobService.list(), jobService.stats(), authService.getSessionUser()])
  if (!me) return { users: collectUsers(null, [], jobs), jobs, proposals: [], projects: [], payments: [], stats, me: null }

  const [proposals, projects, payments, adminUsers] = await Promise.all([
    proposalService.list(), projectService.list(), paymentService.list(),
    me.role === 'admin' ? adminService.listUsers() : [],
  ])
  return { users: collectUsers(me, adminUsers, jobs, proposals, projects), jobs, proposals, projects, payments, stats, me }
}
