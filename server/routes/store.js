import express from 'express'
import { getFirebaseDb, initializeFirebaseAdmin } from '../lib/firebase-admin.js'

// Public, read-only storefront endpoints (only published content is exposed).
export const storeRoutes = express.Router()
const db = () => getFirebaseDb()
const list = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))
const wrap = (fn) => async (req, res) => {
  try { res.json(await fn(req)) } catch (e) { console.error('store error:', e.message); res.status(500).json({ message: 'Store data unavailable' }) }
}
const bySlug = (col, onlyPublished) => wrap(async (req) => {
  const snap = await db().collection(col).where('slug', '==', req.params.slug).limit(1).get()
  if (snap.empty) return null
  const item = { id: snap.docs[0].id, ...snap.docs[0].data() }
  return onlyPublished && item.published === false ? null : item
})

storeRoutes.get('/products', wrap(async (req) => {
  const { category, collection, featured, sale, limit } = req.query
  let q = db().collection('products').where('published', '==', true)
  if (category) q = q.where('category', '==', category)
  if (collection) q = q.where('collection', '==', collection)
  if (featured !== undefined) q = q.where('featured', '==', featured === 'true')
  if (sale !== undefined) q = q.where('sale', '==', sale === 'true')
  q = q.orderBy('createdAt', 'desc')
  if (limit) q = q.limit(parseInt(limit))
  return list(await q.get())
}))
storeRoutes.get('/products/by-slug/:slug', bySlug('products', true))
storeRoutes.get('/products/:id', wrap(async (req) => {
  const d = await db().collection('products').doc(req.params.id).get()
  return d.exists && d.data().published !== false ? { id: d.id, ...d.data() } : null
}))

storeRoutes.get('/categories', wrap(async () =>
  list(await db().collection('categories').where('published', '==', true).orderBy('order', 'asc').get())))
storeRoutes.get('/categories/:slug', bySlug('categories', true))
storeRoutes.get('/collections', wrap(async () =>
  list(await db().collection('collections').where('published', '==', true).orderBy('order', 'asc').get())))
storeRoutes.get('/collections/:slug', bySlug('collections', true))
storeRoutes.get('/lookbooks', wrap(async () =>
  list(await db().collection('lookbooks').where('published', '==', true).orderBy('createdAt', 'desc').get())))
storeRoutes.get('/lookbooks/:slug', bySlug('lookbooks', true))
storeRoutes.get('/articles', wrap(async (req) => {
  let q = db().collection('articles').where('published', '==', true).orderBy('publishedAt', 'desc')
  if (req.query.limit) q = q.limit(parseInt(req.query.limit))
  return list(await q.get())
}))
storeRoutes.get('/articles/:slug', bySlug('articles', true))
storeRoutes.get('/pages/:slug', bySlug('pages', true))
storeRoutes.get('/settings', wrap(async () => {
  const d = await db().collection('settings').doc('store').get()
  return d.exists ? { id: d.id, ...d.data() } : null
}))

storeRoutes.post('/coupons/apply', wrap(async (req) => {
  const code = String(req.body?.code || '').toUpperCase()
  const total = Number(req.body?.orderTotal) || 0
  const snap = await db().collection('coupons').where('code', '==', code).where('active', '==', true).limit(1).get()
  if (snap.empty) return null
  const c = { id: snap.docs[0].id, ...snap.docs[0].data() }
  const now = Date.now()
  if (c.startDate && new Date(c.startDate).getTime() > now) return null
  if (c.endDate && new Date(c.endDate).getTime() < now) return null
  if (c.minOrderAmount && total < c.minOrderAmount) return null
  if (c.usageLimit && (c.usedCount || 0) >= c.usageLimit) return null
  return c
}))

// Called by the storefront after a customer signs up / logs in (verifies their Supabase token).
storeRoutes.post('/customers/sync', async (req, res) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer /i, '')
    if (!token) return res.status(401).json({ success: false })
    const { data, error } = await initializeFirebaseAdmin().auth.getUser(token)
    if (error || !data?.user) return res.status(401).json({ success: false })
    const u = data.user
    await db().collection('users').doc(u.id).set({
      email: u.email,
      displayName: u.user_metadata?.displayName || '',
      role: 'customer',
      updatedAt: new Date(),
    }, { merge: true })
    const ref = await db().collection('users').doc(u.id).get()
    if (!ref.data().createdAt) await db().collection('users').doc(u.id).update({ createdAt: new Date() })
    res.json({ success: true })
  } catch (e) {
    console.error('sync error:', e.message)
    res.status(500).json({ success: false })
  }
})
