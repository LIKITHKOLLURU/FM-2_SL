import * as svc from '../services/adminService.js'
import { ok, wrap } from '../utils/apiResponse.js'

export const dashboard = wrap((req, res) => ok(res, svc.dashboard()))
export const users = wrap((req, res) => ok(res, svc.listUsers(req.query)))
export const setStatus = wrap((req, res) => ok(res, svc.setUserStatus(req.user, Number(req.params.id), req.body.status)))
export const removeUser = wrap((req, res) => { svc.deleteUser(req.user, Number(req.params.id)); ok(res, { deleted: true }) })
export const reset = wrap((req, res) => { svc.resetDemo(); ok(res, { reset: true }) })
