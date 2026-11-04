import { Router } from 'express'
import { body, param } from 'express-validator'
import * as c from '../controllers/proposalController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { validate } from '../middleware/errorMiddleware.js'

const router = Router()
router.use(authenticate)
const idParam = param('id').isInt({ min: 1 }).withMessage('Invalid id.')

router.get('/', c.list)
router.get('/my', requireRole('freelancer'), c.mine)
router.get('/job/:jobId', requireRole('client', 'admin'), param('jobId').isInt({ min: 1 }), validate, c.forJob)
router.post('/', requireRole('freelancer'), [
  body('jobId').isInt({ min: 1 }).withMessage('A valid job is required.'),
  body('amount').isFloat({ gt: 0 }).withMessage('Enter your proposed budget.'),
  body('deliveryDays').isInt({ min: 1, max: 365 }).withMessage('Delivery time must be 1-365 days.'),
  body('coverLetter').isString().trim().isLength({ min: 50, max: 5000 }).withMessage('Cover letter must be at least 50 characters.'),
], validate, c.submit)
router.put('/:id/accept', requireRole('client'), idParam, validate, c.accept)
router.put('/:id/reject', requireRole('client'), idParam, validate, c.reject)
router.put('/:id/withdraw', requireRole('freelancer'), idParam, validate, c.withdraw)

export default router
