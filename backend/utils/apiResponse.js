export class HttpError extends Error {
  constructor(status, message, errors, code) {
    super(message)
    this.status = status
    this.errors = errors
    this.code = code // optional machine-readable code, e.g. ROLE_REQUIRED
  }
}
export const badRequest = (m, e) => new HttpError(400, m, e)
export const unauthorized = (m = 'Authentication required.') => new HttpError(401, m)
export const forbidden = (m = 'You do not have permission to do that.') => new HttpError(403, m)
export const notFound = (m = 'Resource not found.') => new HttpError(404, m)
export const conflict = (m) => new HttpError(409, m)

export const ok = (res, data, status = 200, meta) => res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) })

// Wraps a controller so thrown errors reach the error middleware.
export const wrap = (fn) => (req, res, next) => {
  try {
    const out = fn(req, res, next)
    if (out && typeof out.catch === 'function') out.catch(next)
  } catch (err) { next(err) }
}
