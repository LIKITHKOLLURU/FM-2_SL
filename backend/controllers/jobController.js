import * as svc from '../services/jobService.js'
import { ok, wrap } from '../utils/apiResponse.js'

export const list = wrap((req, res) => ok(res, svc.listJobs(req.user, req.query)))
export const stats = wrap((req, res) => ok(res, svc.publicStats()))
export const get = wrap((req, res) => ok(res, svc.getJob(req.user, Number(req.params.id))))
export const create = wrap((req, res) => ok(res, svc.createJob(req.user, req.body), 201))
export const update = wrap((req, res) => ok(res, svc.updateJob(req.user, Number(req.params.id), req.body)))
export const remove = wrap((req, res) => { svc.deleteJob(req.user, Number(req.params.id)); ok(res, { deleted: true }) })
