import { Router } from 'express'
import { body, param } from 'express-validator'
import * as c from '../controllers/adminController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { validate } from '../middleware/errorMiddleware.js'

const router = Router()
router.use(authenticate, requireRole('admin'))
const idParam = param('id').isInt({ min: 1 }).withMessage('Invalid id.')

router.get('/dashboard', c.dashboard)
router.get('/users', c.users)
router.put('/users/:id/status', idParam, body('status').isIn(['active', 'suspended']).withMessage('Status must be active or suspended.'), validate, c.setStatus)
router.delete('/users/:id', idParam, validate, c.removeUser)
router.post('/reset', c.reset)

export default router
