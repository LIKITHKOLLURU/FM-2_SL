import * as svc from '../services/paymentService.js'
import { ok, wrap } from '../utils/apiResponse.js'

export const list = wrap((req, res) => { const { payments, totals } = svc.listPayments(req.user); ok(res, payments, 200, { totals }) })
export const pay = wrap((req, res) => ok(res, svc.pay(req.user, Number(req.params.id))))
export const refund = wrap((req, res) => ok(res, svc.refund(req.user, Number(req.params.id))))
