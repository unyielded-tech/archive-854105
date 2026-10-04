import express from 'express'
import { adminAuthMiddleware } from '../middleware/admin-auth.js'
import { getFirebaseDb } from '../lib/firebase-admin.js'

const router = express.Router()
router.use(adminAuthMiddleware)

// Signed-up accounts plus guests who placed an order, with order count and total spent.
router.get('/', async (_req, res) => {
  try {
    const db = getFirebaseDb()
    const people = new Map()

    const users = await db.collection('users').get()
    users.forEach((d) => {
      const u = d.data()
      const key = String(u.email || '').toLowerCase() || d.id
      people.set(key, { id: d.id, displayName: u.displayName || '', email: u.email || '', phoneNumber: u.phoneNumber || '', createdAt: u.createdAt, orders: 0, spent: 0 })
    })

    const orders = await db.collection('orders').get()
    orders.forEach((d) => {
      const o = d.data()
      const email = String(o.customerEmail || o.customer?.email || '').toLowerCase()
      const phone = o.customer?.phone || ''
      const key = email || phone
      if (!key) return
      const p = people.get(key) || {
        id: key, displayName: o.customer?.name || '', email, phoneNumber: phone, createdAt: o.createdAt, orders: 0, spent: 0,
      }
      if (!p.displayName) p.displayName = o.customer?.name || ''
      if (!p.phoneNumber) p.phoneNumber = phone
      if (String(o.createdAt) < String(p.createdAt || '9')) p.createdAt = o.createdAt
      p.orders += 1
      if (o.status !== 'cancelled') p.spent += o.total || 0
      people.set(key, p)
    })

    const customers = [...people.values()].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 300)
    res.json({ customers })
  } catch (error) {
    console.error('Customers error:', error)
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
