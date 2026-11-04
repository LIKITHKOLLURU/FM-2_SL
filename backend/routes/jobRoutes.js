import { Router } from 'express'
import { body, param } from 'express-validator'
import * as c from '../controllers/jobController.js'
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { validate } from '../middleware/errorMiddleware.js'

const router = Router()
const idParam = param('id').isInt({ min: 1 }).withMessage('Invalid id.')
const fields = (required) => {
  const opt = (chain) => (required ? chain : chain.optional())
  return [
    opt(body('title').isString().trim().isLength({ min: 10, max: 150 })).withMessage('Title must be 10-150 characters.'),
    opt(body('description').isString().trim().isLength({ min: 50, max: 8000 })).withMessage('Description must be at least 50 characters.'),
    opt(body('category').isString().trim().notEmpty()).withMessage('Select a category.'),
    opt(body('budgetMin').isFloat({ min: 10 })).withMessage('Minimum budget must be at least 10.'),
    opt(body('budgetMax').isFloat({ min: 10 })).withMessage('Maximum budget must be at least 10.'),
    opt(body('duration').isString().trim().notEmpty()).withMessage('Enter an expected duration.'),
    body('experience').optional().isIn(['Entry', 'Intermediate', 'Expert']).withMessage('Invalid experience level.'),
    opt(body('skills').isArray({ min: 1, max: 30 })).withMessage('Add at least one skill.'),
    body('status').optional().isIn(['open', 'closed']).withMessage('Status can only be set to open or closed.'),
  ]
}

router.get('/', optionalAuth, c.list)
router.get('/stats', c.stats)
router.get('/:id', optionalAuth, idParam, validate, c.get)
router.post('/', authenticate, requireRole('client'), fields(true), validate, c.create)
router.put('/:id', authenticate, requireRole('client', 'admin'), idParam, fields(false), validate, c.update)
router.delete('/:id', authenticate, requireRole('client', 'admin'), idParam, validate, c.remove)

export default router
