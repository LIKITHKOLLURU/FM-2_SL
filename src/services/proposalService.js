// Backend: /api/proposals
import { httpClient, API_ENDPOINTS } from './api/httpClient.js'

const base = API_ENDPOINTS.proposals

export const proposalService = {
  async list() {
    return (await httpClient.get(base)).data
  },

  async submit(_freelancerId, { jobId, amount, deliveryDays, coverLetter }) {
    return (await httpClient.post(base, { jobId, amount: Number(amount), deliveryDays: Number(deliveryDays), coverLetter })).data
  },

  async withdraw(id) {
    return (await httpClient.put(`${base}/${id}/withdraw`)).data
  },

  async reject(id) {
    return (await httpClient.put(`${base}/${id}/reject`)).data
  },

  // The server runs this in one SQLite transaction and returns the created project.
  async accept(id) {
    return (await httpClient.put(`${base}/${id}/accept`)).data
  },
}
