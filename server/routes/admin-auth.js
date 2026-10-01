import express from 'express'
import bcrypt from 'bcryptjs'
import { getFirebaseDb } from '../lib/firebase-admin.js'
import { issueSession, clearSession } from '../lib/session.js'
import { adminAuthMiddleware, checkRateLimit, resetRateLimit } from '../middleware/admin-auth.js'

export const adminAuthRoutes = express.Router()

adminAuthRoutes.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    const rate = checkRateLimit(email)
    if (rate.limited) {
      return res.status(429).json({ success: false, message: `Too many attempts. Try again in ${rate.retryAfter}s` })
    }

    const db = getFirebaseDb()
    const snapshot = await db.collection('admins').where('email', '==', email).limit(1).get()
    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const docSnap = snapshot.docs[0]
    const data = docSnap.data()
    const valid = await bcrypt.compare(password, data.passwordHash || '')

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    if (data.active === false) {
      return res.status(403).json({ success: false, message: 'Account is disabled' })
    }

    resetRateLimit(email)
    const adminUser = {
      id: docSnap.id,
      email: data.email,
      displayName: data.displayName || '',
      role: data.role,
    }
    issueSession(res, adminUser)

    await docSnap.ref.update({ lastLoginAt: new Date(), lastLoginIp: req.ip }).catch(() => {})

    return res.json({ success: true, message: 'Logged in successfully', user: adminUser })
  } catch (error) {
    console.error('Admin login error:', error)
    return res.status(503).json({ success: false, message: 'Admin service is unavailable. Check Firebase Admin configuration.' })
  }
})

adminAuthRoutes.post('/logout', (_req, res) => {
  clearSession(res)
  res.json({ success: true })
})

adminAuthRoutes.get('/me', adminAuthMiddleware, (req, res) => {
  res.json({ authenticated: true, user: req.admin })
})

adminAuthRoutes.get('/session', (req, res) => {
  res.json(req.session?.admin
    ? { authenticated: true, user: req.session.admin }
    : { authenticated: false })
})

adminAuthRoutes.post('/register', adminAuthMiddleware, async (req, res) => {
  try {
    if (req.admin.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can create admin accounts' })
    }

    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const displayName = String(req.body?.displayName || '').trim()
    const role = String(req.body?.role || '').trim().toLowerCase()

    if (!email || password.length < 10 || !displayName) {
      return res.status(400).json({ success: false, message: 'Email, display name and a password of at least 10 characters are required' })
    }
    if (!['admin','editor','inventory','orders'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }

    const db = getFirebaseDb()
    const existing = await db.collection('admins').where('email', '==', email).limit(1).get()
    if (!existing.empty) return res.status(409).json({ success: false, message: 'Admin already exists' })

    const passwordHash = await bcrypt.hash(password, 12)
    const ref = db.collection('admins').doc(email.replace(/[^a-z0-9._-]/gi, '_'))
    await ref.set({ email, displayName, role, passwordHash, active: true, createdAt: new Date(), createdBy: req.admin.id })

    res.status(201).json({ success: true, message: 'Admin account created' })
  } catch (error) {
    console.error('Admin registration error:', error)
    res.status(503).json({ success: false, message: 'Unable to create admin account' })
  }
})
