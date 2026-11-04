import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import db, { isDbHealthy, DB_PATH } from './config/database.js'
import { seedIfEmpty } from './database/seed.js'
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js'
import authRoutes from './routes/authRoutes.js'
import jobRoutes from './routes/jobRoutes.js'
import proposalRoutes from './routes/proposalRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()

const PORT = Number(process.env.PORT) || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const app = express()
app.disable('x-powered-by')
app.use(cors({ origin: FRONTEND_URL, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => {
  const healthy = isDbHealthy()
  res.status(healthy ? 200 : 503).json({ success: healthy, status: healthy ? 'ok' : 'degraded', database: healthy ? 'connected' : 'unavailable', uptime: Math.round(process.uptime()) })
})
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/proposals', proposalRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/admin', adminRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

const seeded = seedIfEmpty()
const server = app.listen(PORT, () => {
  console.log(`FreelanceHub API listening on http://localhost:${PORT}`)
  console.log(`Database: ${DB_PATH}${seeded ? ' (seeded with demo data)' : ''}`)
})

const shutdown = () => server.close(() => { db.close(); process.exit(0) })
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

export default app
