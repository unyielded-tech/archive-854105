import express from 'express'
import { adminAuthMiddleware, requireRole } from '../middleware/admin-auth.js'
import { getFirebaseDb } from '../lib/firebase-admin.js'

const router = express.Router()

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
const dateOrNull = (v, endOfDay) => {
  if (!v) return null
  const d = new Date(`${String(v).slice(0, 10)}T${endOfDay ? '23:59:59' : '00:00:00'}`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function clean(b, partial) {
  const out = {}
  const err = (m) => ({ error: m })

  if (!partial || 'code' in b) {
    const code = String(b.code || '').trim().toUpperCase()
    if (!/^[A-Z0-9]{3,20}$/.test(code)) return err('Code must be 3–20 letters or numbers')
    out.code = code
  }
  if (!partial || 'type' in b) {
    if (!['percentage', 'fixed'].includes(b.type)) return err('Choose percentage or flat discount')
    out.type = b.type
  }
  if (!partial || 'value' in b) {
    const v = num(b.value)
    if (!(v > 0)) return err('Enter a discount value')
    if ((b.type || 'percentage') === 'percentage' && v > 100) return err('A percentage cannot be more than 100')
    out.value = v
  }
  if (!partial || 'minOrderAmount' in b) out.minOrderAmount = Math.max(0, num(b.minOrderAmount) || 0)
  if (!partial || 'maxDiscount' in b) out.maxDiscount = Math.max(0, num(b.maxDiscount) || 0) || null
  if (!partial || 'usageLimit' in b) out.usageLimit = Math.max(0, Math.floor(num(b.usageLimit) || 0)) || null
  if (!partial || 'startDate' in b) out.startDate = dateOrNull(b.startDate, false)
  if (!partial || 'endDate' in b) out.endDate = dateOrNull(b.endDate, true)
  if (!partial || 'active' in b) out.active = b.active !== false
  return { data: out }
}

// GET /api/admin/coupons  ->  { coupons }
router.get('/', adminAuthMiddleware, async (_req, res) => {
  try {
    const snap = await getFirebaseDb().collection('coupons').get()
    const coupons = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    coupons.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    res.json({ coupons })
  } catch (e) {
    console.error('Coupons error:', e)
    res.status(500).json({ error: 'Failed to load coupons' })
  }
})

router.post('/', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { data, error } = clean(req.body || {}, false)
    if (error) return res.status(400).json({ error })
    const db = getFirebaseDb()
    const dup = await db.collection('coupons').where('code', '==', data.code).limit(1).get()
    if (!dup.empty) return res.status(409).json({ error: 'A coupon with this code already exists' })
    const now = new Date().toISOString()
    const ref = await db.collection('coupons').add({ ...data, usedCount: 0, createdAt: now, updatedAt: now })
    res.status(201).json({ id: ref.id })
  } catch (e) {
    console.error('Create coupon error:', e)
    res.status(500).json({ error: 'Failed to create coupon' })
  }
})

router.put('/:id', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { data, error } = clean({ ...req.body, type: req.body?.type }, true)
    if (error) return res.status(400).json({ error })
    await getFirebaseDb().collection('coupons').doc(req.params.id).update({ ...data, updatedAt: new Date().toISOString() })
    res.json({ message: 'Coupon updated' })
  } catch (e) {
    console.error('Update coupon error:', e)
    res.status(500).json({ error: 'Failed to update coupon' })
  }
})

router.delete('/:id', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    await getFirebaseDb().collection('coupons').doc(req.params.id).delete()
    res.json({ message: 'Coupon deleted' })
  } catch (e) {
    console.error('Delete coupon error:', e)
    res.status(500).json({ error: 'Failed to delete coupon' })
  }
})

export default router
