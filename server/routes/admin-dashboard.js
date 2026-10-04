import express from 'express'
import { adminAuthMiddleware } from '../middleware/admin-auth.js'
import { getFirebaseDb } from '../lib/firebase-admin.js'

const router = express.Router()

// GET /api/admin/dashboard/stats
router.get('/stats', adminAuthMiddleware, async (_req, res) => {
  try {
    const db = getFirebaseDb()

    const ordersSnap = await db.collection('orders').get()
    const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const live = orders.filter((o) => o.status !== 'cancelled')

    // Money counts once it is actually paid (cash on delivery turns "completed" on delivery).
    const totalRevenue = live.filter((o) => o.paymentStatus === 'completed').reduce((s, o) => s + (o.total || 0), 0)
    const pendingOrders = orders.filter((o) => o.status === 'pending').length

    // Customers = signed-up accounts plus guests who ordered (matched by email, else phone).
    const keys = new Set()
    const usersSnap = await db.collection('users').get()
    usersSnap.forEach((d) => { const e = String(d.data().email || '').toLowerCase(); if (e) keys.add(e) })
    for (const o of orders) {
      const k = String(o.customerEmail || o.customer?.email || '').toLowerCase() || o.customer?.phone
      if (k) keys.add(k)
    }

    const productsSnap = await db.collection('products').where('published', '==', true).orderBy('stock').limit(10).get()
    const lowStockProducts = []
    productsSnap.forEach((doc) => {
      const p = { id: doc.id, ...doc.data() }
      if (p.stock <= 5) lowStockProducts.push(p)
    })

    const recentOrders = [...orders]
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        orderId: o.orderId,
        total: o.total,
        status: o.status,
        customerName: o.customer?.name || '',
        createdAt: o.createdAt,
      }))

    res.json({
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      totalCustomers: keys.size,
      totalProducts: (await db.collection('products').where('published', '==', true).count().get()).data().count,
      recentOrders,
      lowStockProducts: lowStockProducts.slice(0, 5),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

export default router
