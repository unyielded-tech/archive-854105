import express from 'express'
import { adminAuthMiddleware } from '../middleware/admin-auth.js'
import { getFirebaseDb, admin } from '../lib/firebase-admin.js'

const router = express.Router()
router.use(adminAuthMiddleware)

router.get('/', async (_req, res) => {
  try {
    const db = getFirebaseDb()
    const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(100).get()
    res.json({ customers: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load customers' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const db = getFirebaseDb()
    const doc = await db.collection('users').doc(req.params.id).get()
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Customer not found' })
    res.json({ customer: { id: doc.id, ...doc.data() } })
  } catch { res.status(500).json({ success: false, message: 'Failed to load customer' }) }
})

export default router
