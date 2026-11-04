import { Router } from 'express'
import { param } from 'express-validator'
import * as c from '../controllers/paymentController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { validate } from '../middleware/errorMiddleware.js'

const router = Router()
router.use(authenticate)
const idParam = param('id').isInt({ min: 1 }).withMessage('Invalid id.')

router.get('/', c.list)
router.put('/:id/pay', requireRole('client', 'admin'), idParam, validate, c.pay)
router.put('/:id/refund', requireRole('admin'), idParam, validate, c.refund)

export default router
