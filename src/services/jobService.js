// Backend: /api/jobs
import { httpClient, API_ENDPOINTS } from './api/httpClient.js'

const base = API_ENDPOINTS.jobs

export const jobService = {
  async list(params) {
    return (await httpClient.get(base, { params })).data
  },

  async stats() {
    return (await httpClient.get(`${base}/stats`)).data
  },

  // clientId is derived from the JWT on the server.
  async create(_clientId, data) {
    return (await httpClient.post(base, data)).data
  },

  async update(id, data) {
    return (await httpClient.put(`${base}/${id}`, data)).data
  },

  async setStatus(id, status) {
    return this.update(id, { status })
  },

  async remove(id) {
    await httpClient.delete(`${base}/${id}`)
  },
}
