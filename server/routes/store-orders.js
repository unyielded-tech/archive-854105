import express from 'express'
import crypto from 'node:crypto'
import { getFirebaseDb, initializeFirebaseAdmin, admin } from '../lib/firebase-admin.js'
import { sendMail, orderPlacedMail, ownerAlertMail, siteUrlFrom } from '../lib/mailer.js'

// Public order endpoints: place an order (guest or signed-in), look one up, list my orders.
const router = express.Router()
const db = () => getFirebaseDb()

const FREE_SHIPPING_ABOVE = 2000
const SHIPPING = { standard: 100, express: 300 }

const str = (v, max = 200) => String(v ?? '').trim().slice(0, max)
const last10 = (v) => String(v || '').replace(/\D/g, '').slice(-10)

// --- tiny per-IP limiter (best effort on serverless) ---
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000)
  list.push(now)
  hits.set(ip, list)
  return list.length > 12
}


// ---- optional online payments (Razorpay). Off unless both keys are set in Vercel. ----
export const razorpayOn = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)

async function createRazorpayOrder(total, receipt) {
  const key = process.env.RAZORPAY_KEY_ID
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${key}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64'),
    },
    body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR', receipt, notes: { orderId: receipt } }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.id) throw new Error(data?.error?.description || `Razorpay error ${res.status}`)
  return { keyId: key, orderId: data.id, amount: data.amount }
}

const sigOk = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

async function userFromToken(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer /i, '')
  if (!token) return null
  try {
    const { data, error } = await initializeFirebaseAdmin().auth.getUser(token)
    return error || !data?.user ? null : data.user
  } catch {
    return null
  }
}

async function newOrderId() {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  for (let i = 0; i < 5; i++) {
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X')
    const id = `ARC-${ymd}-${rand}`
    const snap = await db().collection('orders').where('orderId', '==', id).limit(1).get()
    if (snap.empty) return id
  }
  return `ARC-${ymd}-${Date.now().toString(36).toUpperCase().slice(-5)}`
}

function couponDiscount(c, subtotal) {
  let off = c.type === 'fixed' ? Number(c.value) || 0 : (subtotal * (Number(c.value) || 0)) / 100
  if (c.type !== 'fixed' && c.maxDiscount) off = Math.min(off, Number(c.maxDiscount))
  return Math.max(0, Math.min(Math.round(off), subtotal))
}

async function findCoupon(code, subtotal) {
  if (!code) return null
  const snap = await db().collection('coupons').where('code', '==', String(code).toUpperCase()).where('active', '==', true).limit(1).get()
  if (snap.empty) return null
  const c = { id: snap.docs[0].id, ...snap.docs[0].data() }
  const now = Date.now()
  if (c.startDate && new Date(c.startDate).getTime() > now) return null
  if (c.endDate && new Date(c.endDate).getTime() < now) return null
  if (c.minOrderAmount && subtotal < c.minOrderAmount) return null
  if (c.usageLimit && (c.usedCount || 0) >= c.usageLimit) return null
  return c
}

// Only what the customer needs to see.
const publicOrder = (o) => ({
  orderId: o.orderId,
  status: o.status,
  paymentMethod: o.paymentMethod,
  paymentStatus: o.paymentStatus,
  shippingMethod: o.shippingMethod,
  trackingNumber: o.trackingNumber || '',
  items: o.items || [],
  subtotal: o.subtotal,
  shipping: o.shipping,
  discount: o.discount || 0,
  total: o.total,
  address: o.address,
  customer: o.customer,
  timeline: (o.timeline || []).map((t) => ({ status: t.status, timestamp: t.timestamp })),
  cancelReason: o.cancelReason || '',
  createdAt: o.createdAt,
})

// POST /api/store/orders
router.post('/', async (req, res) => {
  try {
    if (limited(req.ip)) return res.status(429).json({ error: 'Too many orders. Please wait a few minutes.' })

    const b = req.body || {}
    const name = str(b.customer?.name, 80)
    const phone = last10(b.customer?.phone)
    const email = str(b.customer?.email, 120).toLowerCase()
    const a = b.address || {}
    const street = str(a.street, 200)
    const landmark = str(a.landmark, 120)
    const city = str(a.city, 80)
    const state = str(a.state, 80)
    const pincode = String(a.pincode || '').replace(/\D/g, '')

    if (name.length < 2) return res.status(400).json({ error: 'Enter your full name' })
    if (phone.length !== 10) return res.status(400).json({ error: 'Enter a valid 10-digit phone number' })
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email or leave it empty' })
    if (street.length < 5) return res.status(400).json({ error: 'Enter your full street address' })
    if (city.length < 2 || state.length < 2) return res.status(400).json({ error: 'Enter your city and state' })
    if (pincode.length !== 6) return res.status(400).json({ error: 'Enter a valid 6-digit pincode' })

    const rawItems = Array.isArray(b.items) ? b.items.slice(0, 30) : []
    if (!rawItems.length) return res.status(400).json({ error: 'Your bag is empty' })

    // Load each product once; prices and stock always come from the database, never the browser.
    const wanted = {}
    for (const it of rawItems) {
      const qty = Math.floor(Number(it.quantity))
      if (!it.productId || !Number.isFinite(qty) || qty < 1 || qty > 20) return res.status(400).json({ error: 'Invalid item in your bag' })
      wanted[it.productId] = (wanted[it.productId] || 0) + qty
    }
    const products = {}
    for (const id of Object.keys(wanted)) {
      const d = await db().collection('products').doc(id).get()
      if (!d.exists || d.data().published === false) return res.status(409).json({ error: 'An item in your bag is no longer available. Please remove it and try again.' })
      products[id] = { id, ...d.data() }
    }
    for (const [id, qty] of Object.entries(wanted)) {
      const p = products[id]
      if (typeof p.stock === 'number' && qty > p.stock) {
        return res.status(409).json({ error: p.stock <= 0 ? `"${p.name}" is sold out` : `Only ${p.stock} of "${p.name}" left` })
      }
    }

    const items = rawItems.map((it) => {
      const p = products[it.productId]
      const size = str(it.size, 20)
      if (Array.isArray(p.sizes) && p.sizes.length && !p.sizes.includes(size)) {
        const e = new Error(`Choose a size for "${p.name}"`)
        e.status = 400
        throw e
      }
      const price = p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price
      const quantity = Math.floor(Number(it.quantity))
      return {
        id: `${p.id}-${size}-${str(it.color, 30)}`,
        productId: p.id,
        name: p.name,
        slug: p.slug || '',
        image: p.images?.[0]?.url || p.images?.[0] || '',
        size,
        color: str(it.color, 30),
        quantity,
        price,
        total: price * quantity,
      }
    })

    const subtotal = items.reduce((s, i) => s + i.total, 0)
    const method = b.shippingMethod === 'express' ? 'express' : 'standard'
    const shipping = method === 'express' ? SHIPPING.express : subtotal > FREE_SHIPPING_ABOVE ? 0 : SHIPPING.standard

    let discount = 0
    let couponCode = ''
    const coupon = await findCoupon(b.couponCode, subtotal)
    if (coupon) {
      discount = couponDiscount(coupon, subtotal)
      couponCode = coupon.code
    }
    const total = subtotal - discount + shipping

    const user = await userFromToken(req)
    const orderId = await newOrderId()
    const now = new Date().toISOString()

    const online = b.paymentMethod === 'online' && razorpayOn()
    let razorpay = null
    if (online) {
      try { razorpay = await createRazorpayOrder(total, orderId) } catch (e) {
        console.error('razorpay order failed:', e.message)
        return res.status(502).json({ error: 'Online payment is unavailable right now. Please choose cash on delivery.' })
      }
    }

    const order = {
      orderId,
      customerId: user?.id || '',
      customerEmail: (user?.email || email || '').toLowerCase(),
      customer: { name, phone, email },
      items,
      address: { fullName: name, phoneNumber: phone, email, street, landmark, city, state, pincode, country: 'India' },
      subtotal,
      shipping,
      shippingMethod: method,
      discount,
      couponCode,
      total,
      paymentMethod: online ? 'razorpay' : 'cod',
      paymentStatus: 'pending',
      razorpayOrderId: razorpay?.orderId || '',
      status: 'pending',
      notes: str(b.notes, 300),
      timeline: [{ status: 'pending', timestamp: now, note: online ? 'Order placed, waiting for online payment' : 'Order placed' }],
      createdAt: now,
      updatedAt: now,
    }

    const ref = await db().collection('orders').add(order)

    // Reduce stock and count the coupon use. Failures here must not lose the order.
    for (const [id, qty] of Object.entries(wanted)) {
      if (typeof products[id].stock === 'number') {
        try { await db().collection('products').doc(id).update({ stock: admin.firestore.FieldValue.increment(-qty) }) } catch (e) { console.error('stock update failed', id, e.message) }
      }
    }
    if (coupon) {
      try { await db().collection('coupons').doc(coupon.id).update({ usedCount: admin.firestore.FieldValue.increment(1) }) } catch { /* ignore */ }
    }

    // Emails are optional; a failure here never loses the order.
    const site = siteUrlFrom(req)
    const mails = []
    if (order.customer.email && !online) { const m = orderPlacedMail(order, site); mails.push(sendMail({ to: order.customer.email, ...m })) }
    if (process.env.ORDER_NOTIFY_EMAIL) { const m = ownerAlertMail(order, site); mails.push(sendMail({ to: process.env.ORDER_NOTIFY_EMAIL, ...m })) }
    await Promise.allSettled(mails)

    res.status(201).json({ id: ref.id, orderId, total, status: 'pending', razorpay })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    console.error('Create order error:', error)
    res.status(500).json({ error: 'Could not place your order. Please try again.' })
  }
})

// GET /api/store/orders/track?orderId=ARC-...&phone=9876543210
router.get('/track', async (req, res) => {
  try {
    if (limited(`t${req.ip}`)) return res.status(429).json({ error: 'Too many tries. Please wait a few minutes.' })
    const orderId = str(req.query.orderId, 40).toUpperCase()
    const phone = last10(req.query.phone)
    if (!orderId || phone.length !== 10) return res.status(400).json({ error: 'Enter your order number and phone number' })

    const snap = await db().collection('orders').where('orderId', '==', orderId).limit(1).get()
    const o = snap.empty ? null : snap.docs[0].data()
    if (!o || last10(o.customer?.phone) !== phone) return res.status(404).json({ error: 'No order found with these details' })
    res.json(publicOrder(o))
  } catch (error) {
    console.error('Track order error:', error)
    res.status(500).json({ error: 'Could not load the order' })
  }
})

// GET /api/store/orders/mine  (signed-in customer)
router.get('/mine', async (req, res) => {
  try {
    const user = await userFromToken(req)
    if (!user) return res.status(401).json({ error: 'Please sign in' })
    const rows = await ordersOf(user)
    res.json({ orders: rows.slice(0, 100).map((r) => publicOrder(r.data)) })
  } catch (error) {
    console.error('My orders error:', error)
    res.status(500).json({ error: 'Could not load your orders' })
  }
})


// Who may act on an order: its signed-in owner, or someone who knows the phone number on it.
async function canAccess(req, o) {
  const user = await userFromToken(req)
  if (user && (o.customerId === user.id || (user.email && o.customerEmail === user.email.toLowerCase()))) return true
  const p = last10(req.body?.phone)
  return p.length === 10 && last10(o.customer?.phone) === p
}

// POST /api/store/orders/verify-payment  (called by the browser after Razorpay succeeds)
router.post('/verify-payment', async (req, res) => {
  try {
    if (!razorpayOn()) return res.status(400).json({ error: 'Online payments are not enabled' })
    const { orderId, razorpay_order_id: rpOrder, razorpay_payment_id: rpPay, razorpay_signature: rpSig } = req.body || {}
    const snap = await db().collection('orders').where('orderId', '==', str(orderId, 40).toUpperCase()).limit(1).get()
    if (snap.empty) return res.status(404).json({ error: 'Order not found' })
    const doc = snap.docs[0]
    const o = doc.data()
    if (!rpOrder || !rpPay || !rpSig || o.razorpayOrderId !== rpOrder) return res.status(400).json({ error: 'Payment details do not match this order' })

    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${rpOrder}|${rpPay}`).digest('hex')
    if (!sigOk(expected, rpSig)) return res.status(400).json({ error: 'Payment could not be verified' })

    if (o.paymentStatus !== 'completed') {
      const now = new Date().toISOString()
      await doc.ref.update({
        paymentStatus: 'completed',
        paymentId: String(rpPay),
        status: o.status === 'pending' ? 'confirmed' : o.status,
        updatedAt: now,
        timeline: admin.firestore.FieldValue.arrayUnion({ status: 'payment received', timestamp: now, note: `Razorpay ${rpPay}` }),
      })
      if (o.customer?.email) {
        const m = orderPlacedMail({ ...o, paymentStatus: 'completed' }, siteUrlFrom(req))
        await sendMail({ to: o.customer.email, ...m })
      }
    }
    const fresh = await doc.ref.get()
    res.json(publicOrder(fresh.data()))
  } catch (error) {
    console.error('Verify payment error:', error)
    res.status(500).json({ error: 'Could not verify the payment' })
  }
})

// POST /api/store/orders/retry-payment  { orderId, phone? }  — pay again for an unpaid online order
router.post('/retry-payment', async (req, res) => {
  try {
    if (!razorpayOn()) return res.status(400).json({ error: 'Online payments are not enabled' })
    if (limited(`r${req.ip}`)) return res.status(429).json({ error: 'Too many tries. Please wait a few minutes.' })
    const snap = await db().collection('orders').where('orderId', '==', str(req.body?.orderId, 40).toUpperCase()).limit(1).get()
    if (snap.empty) return res.status(404).json({ error: 'Order not found' })
    const doc = snap.docs[0]
    const o = doc.data()
    if (!(await canAccess(req, o))) return res.status(403).json({ error: 'We could not verify this order' })
    if (o.paymentMethod !== 'razorpay' || o.paymentStatus === 'completed' || o.status === 'cancelled') {
      return res.status(409).json({ error: 'This order does not need a payment' })
    }
    const razorpay = await createRazorpayOrder(o.total, o.orderId)
    await doc.ref.update({ razorpayOrderId: razorpay.orderId, updatedAt: new Date().toISOString() })
    res.json({ razorpay })
  } catch (error) {
    console.error('Retry payment error:', error)
    res.status(502).json({ error: 'Could not start the payment. Please try again.' })
  }
})

const CANCELLABLE = ['pending', 'confirmed', 'processing', 'packed']

async function ordersOf(user) {
  const byId = await db().collection('orders').where('customerId', '==', user.id).get()
  const byEmail = user.email
    ? await db().collection('orders').where('customerEmail', '==', user.email.toLowerCase()).get()
    : { docs: [] }
  const seen = new Set()
  const rows = []
  for (const d of [...byId.docs, ...byEmail.docs]) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    rows.push({ id: d.id, data: d.data() })
  }
  rows.sort((a, b) => String(b.data.createdAt).localeCompare(String(a.data.createdAt)))
  return rows
}

// GET /api/store/orders/mine/:orderId  (signed-in customer)
router.get('/mine/:orderId', async (req, res) => {
  try {
    const user = await userFromToken(req)
    if (!user) return res.status(401).json({ error: 'Please sign in' })
    const row = (await ordersOf(user)).find((r) => r.data.orderId === String(req.params.orderId).toUpperCase())
    if (!row) return res.status(404).json({ error: 'Order not found' })
    res.json(publicOrder(row.data))
  } catch (error) {
    console.error('My order error:', error)
    res.status(500).json({ error: 'Could not load the order' })
  }
})

// POST /api/store/orders/cancel  { orderId, phone?, reason? }
// Signed-in owners need no phone; guests prove ownership with the phone number on the order.
router.post('/cancel', async (req, res) => {
  try {
    if (limited(`c${req.ip}`)) return res.status(429).json({ error: 'Too many tries. Please wait a few minutes.' })
    const orderId = str(req.body?.orderId, 40).toUpperCase()
    const reason = str(req.body?.reason, 200)
    if (!orderId) return res.status(400).json({ error: 'Missing order number' })

    const snap = await db().collection('orders').where('orderId', '==', orderId).limit(1).get()
    if (snap.empty) return res.status(404).json({ error: 'Order not found' })
    const doc = snap.docs[0]
    const o = doc.data()

    if (!(await canAccess(req, o))) return res.status(403).json({ error: 'We could not verify this order' })

    if (!CANCELLABLE.includes(o.status)) {
      return res.status(409).json({ error: o.status === 'cancelled' ? 'This order is already cancelled' : 'This order has already been shipped and cannot be cancelled. Contact us for a return.' })
    }

    const now = new Date().toISOString()
    for (const it of o.items || []) {
      if (!it.productId) continue
      try {
        const ref = db().collection('products').doc(it.productId)
        const p = await ref.get()
        if (p.exists && typeof p.data().stock === 'number') {
          await ref.update({ stock: admin.firestore.FieldValue.increment(Number(it.quantity) || 0) })
        }
      } catch (e) { console.error('restore stock failed', it.productId, e.message) }
    }

    await doc.ref.update({
      status: 'cancelled',
      cancelReason: reason,
      cancelledBy: 'customer',
      updatedAt: now,
      timeline: admin.firestore.FieldValue.arrayUnion({ status: 'cancelled', timestamp: now, note: reason ? `Cancelled by customer: ${reason}` : 'Cancelled by customer' }),
    })

    const fresh = await doc.ref.get()
    if (process.env.ORDER_NOTIFY_EMAIL) {
      await sendMail({ to: process.env.ORDER_NOTIFY_EMAIL, subject: `Order ${o.orderId} cancelled by customer`, html: `<p>Order <b>${o.orderId}</b> was cancelled by ${String(o.customer?.name || 'the customer').replace(/[<>&]/g, '')}.${reason ? ' Reason: ' + reason.replace(/[<>&]/g, '') : ''}</p>` })
    }
    res.json(publicOrder(fresh.data()))
  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(500).json({ error: 'Could not cancel the order' })
  }
})

export default router
