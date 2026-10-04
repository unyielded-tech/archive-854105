import express from 'express'
import { adminAuthMiddleware, requireRole } from '../middleware/admin-auth.js'
import { getFirebaseDb, admin } from '../lib/firebase-admin.js'

const router = express.Router()

const STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded']
const PAYMENT = ['pending', 'completed', 'failed']
const isCancelled = (s) => s === 'cancelled' || s === 'returned'

// Put items from a cancelled / returned order back into stock.
async function restoreStock(db, order) {
  for (const it of order.items || []) {
    if (!it.productId) continue
    try {
      const ref = db.collection('products').doc(it.productId)
      const p = await ref.get()
      if (p.exists && typeof p.data().stock === 'number') {
        await ref.update({ stock: admin.firestore.FieldValue.increment(Number(it.quantity) || 0) })
      }
    } catch (e) {
      console.error('restore stock failed', it.productId, e.message)
    }
  }
}

async function withCustomer(db, id, data) {
  let profile = null
  if (data.customerId) {
    const u = await db.collection('users').doc(data.customerId).get()
    if (u.exists) profile = u.data()
  }
  // Orders carry their own contact details; fall back to the account profile.
  return { id, ...data, customer: { ...(profile || {}), ...(data.customer || {}) } }
}

// GET /api/admin/orders
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, status, paymentStatus, limit = 20 } = req.query
    const db = getFirebaseDb()
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = db.collection('orders')
    if (status) query = query.where('status', '==', status)
    if (paymentStatus) query = query.where('paymentStatus', '==', paymentStatus)

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit) + 1)
      .offset(offset)
      .get()

    const orders = []
    for (const doc of snapshot.docs) orders.push(await withCustomer(db, doc.id, doc.data()))

    const hasMore = orders.length > parseInt(limit)
    if (hasMore) orders.pop()

    res.json({ orders, hasMore, page: parseInt(page) })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// GET /api/admin/orders/:id
router.get('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getFirebaseDb()
    const orderDoc = await db.collection('orders').doc(req.params.id).get()
    if (!orderDoc.exists) return res.status(404).json({ error: 'Order not found' })
    res.json(await withCustomer(db, orderDoc.id, orderDoc.data()))
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// PUT /api/admin/orders/:id
router.put('/:id', requireRole(['admin', 'orders', 'owner']), async (req, res) => {
  try {
    const db = getFirebaseDb()
    const ref = db.collection('orders').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Order not found' })
    const cur = snap.data()

    const { status, paymentStatus, shippingMethod, trackingNumber, notes } = req.body || {}
    if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status' })
    if (paymentStatus && !PAYMENT.includes(paymentStatus)) return res.status(400).json({ error: 'Unknown payment status' })

    const now = new Date().toISOString()
    const u = { updatedAt: now }
    const events = []

    if (status && status !== cur.status) {
      u.status = status
      events.push({ status, timestamp: now, note: notes || '' })
      if (isCancelled(status) && !isCancelled(cur.status)) await restoreStock(db, cur)
      // Cash on delivery is paid when the parcel is handed over.
      if (status === 'delivered' && cur.paymentMethod === 'cod' && !paymentStatus) u.paymentStatus = 'completed'
    }
    if (paymentStatus && paymentStatus !== cur.paymentStatus) {
      u.paymentStatus = paymentStatus
      events.push({ status: `payment ${paymentStatus}`, timestamp: now, note: '' })
    }
    if (shippingMethod) u.shippingMethod = shippingMethod
    if (trackingNumber !== undefined) {
      u.trackingNumber = String(trackingNumber).trim().slice(0, 80)
      if (u.trackingNumber && u.trackingNumber !== cur.trackingNumber) {
        events.push({ status: 'tracking added', timestamp: now, note: u.trackingNumber })
      }
    }
    if (notes !== undefined) u.notes = String(notes).slice(0, 500)

    if (events.length) u.timeline = admin.firestore.FieldValue.arrayUnion(...events)
    await ref.update(u)

    res.json({ message: 'Order updated' })
  } catch (error) {
    console.error('Update order error:', error)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

// POST /api/admin/orders/:id/cancel
router.post('/:id/cancel', requireRole(['admin', 'orders', 'owner']), async (req, res) => {
  try {
    const db = getFirebaseDb()
    const ref = db.collection('orders').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Order not found' })
    const cur = snap.data()
    const now = new Date().toISOString()

    if (!isCancelled(cur.status)) await restoreStock(db, cur)
    await ref.update({
      status: 'cancelled',
      updatedAt: now,
      timeline: admin.firestore.FieldValue.arrayUnion({ status: 'cancelled', timestamp: now, note: req.body?.reason || '' }),
    })

    res.json({ message: 'Order cancelled' })
  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

export default router
