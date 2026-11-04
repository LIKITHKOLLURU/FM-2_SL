import { Router } from 'express'
import { body, param } from 'express-validator'
import * as c from '../controllers/projectController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { validate } from '../middleware/errorMiddleware.js'
import { STATUSES } from '../services/projectService.js'

const router = Router()
router.use(authenticate)
const idParam = param('id').isInt({ min: 1 }).withMessage('Invalid id.')

router.get('/', c.list)
router.get('/:id', idParam, validate, c.get)
router.put('/:id/status', requireRole('freelancer', 'admin'), idParam, [
  body('status').isIn(STATUSES).withMessage('Invalid project status.'),
  body('progress').optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100.'),
], validate, c.updateStatus)

export default router
