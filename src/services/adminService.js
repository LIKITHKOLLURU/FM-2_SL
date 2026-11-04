// Backend: /api/admin
import { httpClient, API_ENDPOINTS } from './api/httpClient.js'

const base = API_ENDPOINTS.admin

export const adminService = {
  async dashboard() {
    return (await httpClient.get(`${base}/dashboard`)).data
  },

  async listUsers(params) {
    return (await httpClient.get(`${base}/users`, { params })).data
  },

  async setUserStatus(id, status) {
    return (await httpClient.put(`${base}/users/${id}/status`, { status })).data
  },

  async deleteUser(id) {
    await httpClient.delete(`${base}/users/${id}`)
  },

  async resetDemoData() {
    await httpClient.post(`${base}/reset`)
  },
}
