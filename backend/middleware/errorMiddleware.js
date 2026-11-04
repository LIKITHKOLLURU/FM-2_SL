import { validationResult } from 'express-validator'
import { HttpError } from '../utils/apiResponse.js'

// Place after validator chains: turns validation failures into a 400.
export const validate = (req, res, next) => {
  const result = validationResult(req)
  if (result.isEmpty()) return next()
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }))
  next(new HttpError(400, errors[0].message, errors))
}

export const notFoundHandler = (req, res, next) => next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`))

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ success: false, message: err.message, errors: err.errors, code: err.code })
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Malformed JSON body.' })
  if (err?.code?.startsWith?.('SQLITE_CONSTRAINT')) {
    const dup = /UNIQUE/.test(err.message)
    return res.status(409).json({ success: false, message: dup ? 'That record already exists.' : 'The request conflicts with existing data.' })
  }
  console.error(err)
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' })
}
