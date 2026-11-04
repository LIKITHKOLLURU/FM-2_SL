import { forbidden } from '../utils/apiResponse.js'

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(forbidden(`Only ${roles.join(' or ')} accounts can do that.`))
