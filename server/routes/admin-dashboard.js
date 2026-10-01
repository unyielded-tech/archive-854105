import express from 'express'
import { adminAuthMiddleware, requireRole } from '../middleware/admin-auth.js'
import { getFirebaseDb, admin } from '../lib/firebase-admin.js'

const router = express.Router()

// GET /api/admin/dashboard/stats
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getFirebaseDb()

    // Total revenue
    const ordersSnapshot = await db.collection('orders')
      .where('paymentStatus', '==', 'completed')
      .get()
    
    let totalRevenue = 0
    const allOrders = []
    
    ordersSnapshot.forEach(doc => {
      const order = { id: doc.id, ...doc.data() }
      totalRevenue += order.total || 0
      allOrders.push(order)
    })

    // Low stock products
    const productsSnapshot = await db.collection('products')
      .where('published', '==', true)
      .orderBy('stock')
      .limit(10)
      .get()

    const lowStockProducts = []
    productsSnapshot.forEach(doc => {
      const product = { id: doc.id, ...doc.data() }
      if (product.stock <= 5) {
        lowStockProducts.push(product)
      }
    })

    // Recent orders (last 5)
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        orderId: order.orderId,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      }))

    res.json({
      totalRevenue,
      totalOrders: allOrders.length,
      totalCustomers: new Set(allOrders.map(o => o.customerId)).size,
      totalProducts: (await db.collection('products').where('published', '==', true).count().get()).data().count,
      recentOrders,
      lowStockProducts: lowStockProducts.slice(0, 5)
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

export default router
