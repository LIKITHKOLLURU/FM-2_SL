import * as svc from '../services/proposalService.js'
import { ok, wrap } from '../utils/apiResponse.js'

const id = (req) => Number(req.params.id)
export const list = wrap((req, res) => ok(res, svc.listProposals(req.user)))
export const mine = wrap((req, res) => ok(res, svc.myProposals(req.user)))
export const forJob = wrap((req, res) => ok(res, svc.proposalsForJob(req.user, Number(req.params.jobId))))
export const submit = wrap((req, res) => ok(res, svc.submitProposal(req.user, { ...req.body, jobId: Number(req.body.jobId) }), 201))
export const accept = wrap((req, res) => ok(res, svc.accept(req.user, id(req))))
export const reject = wrap((req, res) => ok(res, svc.reject(req.user, id(req))))
export const withdraw = wrap((req, res) => ok(res, svc.withdraw(req.user, id(req))))
