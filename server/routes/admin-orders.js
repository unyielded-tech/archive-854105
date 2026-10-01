import express from 'express'
import { adminAuthMiddleware, requireRole } from '../middleware/admin-auth.js'
import { getFirebaseDb, admin } from '../lib/firebase-admin.js'

const router = express.Router()

// GET /api/admin/orders
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, status, paymentStatus, limit = 20 } = req.query
    const db = getFirebaseDb()
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = db.collection('orders')

    if (status) {
      query = query.where('status', '==', status)
    }

    if (paymentStatus) {
      query = query.where('paymentStatus', '==', paymentStatus)
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit) + 1)
      .offset(offset)
      .get()

    const orders = []
    for (const doc of snapshot.docs) {
      const orderData = doc.data()
      const customerDoc = await db.collection('users').doc(orderData.customerId).get()
      orders.push({
        id: doc.id,
        ...orderData,
        customer: customerDoc.exists ? customerDoc.data() : null
      })
    }

    const hasMore = orders.length > parseInt(limit)
    if (hasMore) orders.pop()

    res.json({
      orders,
      hasMore,
      page: parseInt(page)
    })
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

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const orderData = orderDoc.data()
    const customerDoc = await db.collection('users').doc(orderData.customerId).get()

    res.json({
      id: orderDoc.id,
      ...orderData,
      customer: customerDoc.exists ? customerDoc.data() : null
    })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// PUT /api/admin/orders/:id
router.put('/:id', requireRole(['admin', 'orders', 'owner']), async (req, res) => {
  try {
    const db = getFirebaseDb()
    const { status, paymentStatus, shippingMethod, trackingNumber, notes } = req.body

    const updateData = {
      updatedAt: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (shippingMethod) updateData.shippingMethod = shippingMethod
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (notes !== undefined) updateData.notes = notes

    // Add timeline entry
    const timelineEntry = {
      status: status || 'updated',
      timestamp: new Date().toISOString(),
      note: notes || ''
    }

    await db.collection('orders').doc(req.params.id).update({
      ...updateData,
      timeline: admin.firestore.FieldValue.arrayUnion(timelineEntry)
    })

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
    const { reason } = req.body

    await db.collection('orders').doc(req.params.id).update({
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      timeline: admin.firestore.FieldValue.arrayUnion({
        status: 'cancelled',
        timestamp: new Date().toISOString(),
        note: reason || ''
      })
    })

    res.json({ message: 'Order cancelled' })
  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

export default router
