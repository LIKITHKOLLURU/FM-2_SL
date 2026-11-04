// Backend: /api/payments
import { httpClient, API_ENDPOINTS } from './api/httpClient.js'

const base = API_ENDPOINTS.payments

export const paymentService = {
  // Returns the payment list; server-side totals are available as `totals` on the raw response meta.
  async list() {
    return (await httpClient.get(base)).data
  },

  async markPaid(id) {
    return (await httpClient.put(`${base}/${id}/pay`)).data
  },

  async refund(id) {
    return (await httpClient.put(`${base}/${id}/refund`)).data
  },
}
