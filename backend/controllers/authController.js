import * as svc from '../services/authService.js'
import { ok, wrap } from '../utils/apiResponse.js'

export const register = wrap((req, res) => ok(res, svc.register(req.body), 201))
export const google = wrap(async (req, res) => ok(res, await svc.googleAuth(req.body)))
export const login = wrap((req, res) => ok(res, svc.login(req.body)))
export const me = wrap((req, res) => ok(res, svc.me(req.user)))
export const updateMe = wrap((req, res) => ok(res, svc.updateProfile(req.user, req.body)))
export const changePassword = wrap((req, res) => { svc.changePassword(req.user, req.body); ok(res, { changed: true }) })
