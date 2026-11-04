import { Router } from 'express'
import { body } from 'express-validator'
import * as c from '../controllers/authController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/errorMiddleware.js'

const router = Router()
const strongPassword = (field) => body(field).isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  .matches(/[a-zA-Z]/).withMessage('Password needs a letter.').matches(/\d/).withMessage('Password needs a number.')

router.post('/register', [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Enter your full name.'),
  body('email').isEmail().withMessage('Enter a valid email address.'),
  strongPassword('password'),
  body('role').isIn(['client', 'freelancer']).withMessage('Role must be client or freelancer.'),
], validate, c.register)

router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('password').isString().notEmpty().withMessage('Password is required.'),
], validate, c.login)

// role is only used when a brand-new account is created; admin is never accepted.
router.post('/google', [
  body('credential').isString().trim().notEmpty().isLength({ max: 4096 }).withMessage('Google credential is required.'),
  body('role').optional().isIn(['client', 'freelancer']).withMessage('Role must be client or freelancer.'),
], validate, c.google)

router.get('/me', authenticate, c.me)

router.put('/me', authenticate, [
  body('name').optional().isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters.'),
  body('title').optional().isString().isLength({ max: 120 }),
  body('company').optional().isString().isLength({ max: 120 }),
  body('location').optional().isString().isLength({ max: 120 }),
  body('bio').optional().isString().isLength({ max: 2000 }),
  body('skills').optional().isArray({ max: 30 }).withMessage('Skills must be a list.'),
  body('hourlyRate').optional({ nullable: true, values: 'falsy' }).isFloat({ min: 0 }).withMessage('Rate cannot be negative.'),
], validate, c.updateMe)

router.put('/password', authenticate, [
  body('current').isString().notEmpty().withMessage('Enter your current password.'),
  strongPassword('next'),
], validate, c.changePassword)

export default router
