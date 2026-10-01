import express from 'express'
import { adminAuthMiddleware } from '../middleware/admin-auth.js'
import { getFirebaseDb } from '../lib/firebase-admin.js'

const router = express.Router()
router.use(adminAuthMiddleware)

router.get('/', async (_req, res) => {
  try {
    const snap = await getFirebaseDb().collection('products').orderBy('createdAt', 'desc').limit(200).get()
    const items = snap.docs.map(d => ({ id: d.id, name: d.data().name, stock: d.data().stock ?? 0, variants: d.data().variants ?? [] }))
    res.json({ inventory: items })
  } catch { res.status(500).json({ success: false, message: 'Failed to load inventory' }) }
})

router.put('/', async (req, res) => {
  try {
    const { productId, quantity } = req.body || {}
    if (!productId || !Number.isFinite(Number(quantity)) || Number(quantity) < 0) return res.status(400).json({ success: false, message: 'Invalid inventory update' })
    await getFirebaseDb().collection('products').doc(productId).update({ stock: Number(quantity), updatedAt: new Date() })
    res.json({ success: true })
  } catch { res.status(500).json({ success: false, message: 'Failed to update inventory' }) }
})

export default router
