import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import { sessionMiddleware } from './lib/session.js'
import cors from 'cors'

import { initializeFirebaseAdmin } from './lib/firebase-admin.js'
import { adminAuthRoutes } from './routes/admin-auth.js'
import adminProductsRoutes from './routes/admin-products.js'
import adminOrdersRoutes from './routes/admin-orders.js'
import adminDashboardRoutes from './routes/admin-dashboard.js'
import adminCustomersRoutes from './routes/admin-customers.js'
import adminInventoryRoutes from './routes/admin-inventory.js'
import adminCouponsRoutes from './routes/admin-coupons.js'
import adminJournalRoutes from './routes/admin-journal.js'
import adminLookbooksRoutes from './routes/admin-lookbooks.js'
import adminCmsRoutes from './routes/admin-cms.js'
import adminAuditRoutes from './routes/admin-audit.js'

const app = express()
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: process.env.VERCEL ? true : CLIENT_URL, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

app.use(sessionMiddleware)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'archive-admin' }))

app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin/products', adminProductsRoutes)
app.use('/api/admin/orders', adminOrdersRoutes)
app.use('/api/admin/dashboard', adminDashboardRoutes)
app.use('/api/admin/customers', adminCustomersRoutes)
app.use('/api/admin/inventory', adminInventoryRoutes)
app.use('/api/admin/coupons', adminCouponsRoutes)
app.use('/api/admin/journal', adminJournalRoutes)
app.use('/api/admin/lookbooks', adminLookbooksRoutes)
app.use('/api/admin/cms', adminCmsRoutes)
app.use('/api/admin/audit', adminAuditRoutes)

app.use((err, _req, res, _next) => {
  console.error('Server error:', err)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }))

export default app
