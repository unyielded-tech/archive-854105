import express from 'express'
import { adminAuthMiddleware, requireRole } from '../middleware/admin-auth.js'
import { getFirebaseDb } from '../lib/firebase-admin.js'
import { recomputeRating } from './store-reviews.js'

const router = express.Router()

// GET /api/admin/reviews
router.get('/', adminAuthMiddleware, async (_req, res) => {
  try {
    const db = getFirebaseDb()
    const snap = await db.collection('reviews').orderBy('createdAt', 'desc').limit(200).get()
    const names = {}
    const reviews = []
    for (const d of snap.docs) {
      const r = { id: d.id, ...d.data() }
      if (!(r.productId in names)) {
        const p = await db.collection('products').doc(r.productId).get()
        names[r.productId] = p.exists ? p.data().name : 'Deleted product'
      }
      reviews.push({ ...r, productName: names[r.productId] })
    }
    res.json({ reviews })
  } catch (e) {
    console.error('Admin reviews error:', e)
    res.status(500).json({ error: 'Failed to load reviews' })
  }
})

// PUT /api/admin/reviews/:id  { hidden }
router.put('/:id', requireRole(['admin', 'owner', 'editor']), async (req, res) => {
  try {
    const ref = getFirebaseDb().collection('reviews').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Review not found' })
    await ref.update({ hidden: req.body?.hidden === true, updatedAt: new Date().toISOString() })
    await recomputeRating(snap.data().productId)
    res.json({ message: 'Review updated' })
  } catch (e) {
    console.error('Update review error:', e)
    res.status(500).json({ error: 'Failed to update review' })
  }
})

// DELETE /api/admin/reviews/:id
router.delete('/:id', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const ref = getFirebaseDb().collection('reviews').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Review not found' })
    const productId = snap.data().productId
    await ref.delete()
    await recomputeRating(productId)
    res.json({ message: 'Review deleted' })
  } catch (e) {
    console.error('Delete review error:', e)
    res.status(500).json({ error: 'Failed to delete review' })
  }
})

export default router
