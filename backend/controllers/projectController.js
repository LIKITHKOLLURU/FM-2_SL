import * as svc from '../services/projectService.js'
import { ok, wrap } from '../utils/apiResponse.js'

export const list = wrap((req, res) => ok(res, svc.listProjects(req.user)))
export const get = wrap((req, res) => ok(res, svc.getProject(req.user, Number(req.params.id))))
export const updateStatus = wrap((req, res) => ok(res, svc.updateStatus(req.user, Number(req.params.id), req.body)))
