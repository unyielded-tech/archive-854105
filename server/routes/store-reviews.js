import express from 'express'
import { getFirebaseDb, initializeFirebaseAdmin } from '../lib/firebase-admin.js'

// Product reviews. Anyone can read; only customers who received the product can write one.
const router = express.Router()
const db = () => getFirebaseDb()
const str = (v, max) => String(v ?? '').trim().slice(0, max)

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

// Keeps rating + reviewCount on the product in step with its visible reviews.
export async function recomputeRating(productId) {
  const snap = await db().collection('reviews').where('productId', '==', productId).get()
  const visible = snap.docs.map((d) => d.data()).filter((r) => r.hidden !== true)
  const count = visible.length
  const rating = count ? Math.round((visible.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0
  try { await db().collection('products').doc(productId).update({ rating, reviewCount: count }) } catch { /* product may be gone */ }
  return { rating, count }
}

const shortName = (n) => {
  const parts = String(n || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'Customer'
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0]
}

// GET /api/store/reviews/:productId
router.get('/:productId', async (req, res) => {
  try {
    const snap = await db().collection('reviews').where('productId', '==', req.params.productId).get()
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.hidden !== true)
    rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    const breakdown = [0, 0, 0, 0, 0]
    rows.forEach((r) => { breakdown[r.rating - 1]++ })
    const count = rows.length
    const average = count ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0
    res.json({
      summary: { average, count, breakdown },
      reviews: rows.slice(0, 50).map((r) => ({ id: r.id, name: r.name, rating: r.rating, title: r.title, body: r.body, createdAt: r.createdAt, verified: true })),
    })
  } catch (e) {
    console.error('Get reviews error:', e)
    res.status(500).json({ error: 'Could not load reviews' })
  }
})

// POST /api/store/reviews  { productId, rating, title, body }
router.post('/', async (req, res) => {
  try {
    const user = await userFromToken(req)
    if (!user) return res.status(401).json({ error: 'Please sign in to write a review' })

    const productId = str(req.body?.productId, 80)
    const rating = Math.round(Number(req.body?.rating))
    const title = str(req.body?.title, 80)
    const body = str(req.body?.body, 1000)
    if (!productId) return res.status(400).json({ error: 'Missing product' })
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Choose a rating from 1 to 5 stars' })
    if (body.length < 5) return res.status(400).json({ error: 'Please write a few words about the product' })

    const p = await db().collection('products').doc(productId).get()
    if (!p.exists) return res.status(404).json({ error: 'Product not found' })

    // Verified buyers only: a delivered order of theirs must contain this product.
    const byId = await db().collection('orders').where('customerId', '==', user.id).get()
    const byEmail = user.email ? await db().collection('orders').where('customerEmail', '==', user.email.toLowerCase()).get() : { docs: [] }
    const bought = [...byId.docs, ...byEmail.docs].some((d) => {
      const o = d.data()
      return o.status === 'delivered' && (o.items || []).some((i) => i.productId === productId)
    })
    if (!bought) return res.status(403).json({ error: 'Only customers who have received this product can review it' })

    const profile = await db().collection('users').doc(user.id).get()
    const name = shortName(profile.exists ? profile.data().displayName : user.user_metadata?.displayName || user.email?.split('@')[0])

    const now = new Date().toISOString()
    const ref = db().collection('reviews').doc(`${productId}_${user.id}`)
    const existing = await ref.get()
    await ref.set({
      productId, userId: user.id, name, rating, title, body, hidden: false,
      createdAt: existing.exists ? existing.data().createdAt : now, updatedAt: now,
    })
    const stats = await recomputeRating(productId)
    res.status(201).json({ message: 'Thanks for your review!', ...stats })
  } catch (e) {
    console.error('Post review error:', e)
    res.status(500).json({ error: 'Could not save your review' })
  }
})

export default router
