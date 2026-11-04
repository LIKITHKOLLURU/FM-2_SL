// Backend: /api/projects
import { httpClient, API_ENDPOINTS } from './api/httpClient.js'

export const PROJECT_STATUSES = ['not_started', 'in_progress', 'in_review', 'on_hold', 'completed']
const base = API_ENDPOINTS.projects

export const projectService = {
  async list() {
    return (await httpClient.get(base)).data
  },

  async updateStatus(id, { status, progress }) {
    return (await httpClient.put(`${base}/${id}/status`, { status, progress })).data
  },
}
