import express from 'express'
import { adminAuthMiddleware, requireRole } from '../middleware/admin-auth.js'
import { getFirebaseDb } from '../lib/firebase-admin.js'

const router = express.Router()
const DOC = 'homeBanner'
const empty = { type: '', url: '', line1: '', line2: '' }
const text = (v) => String(v || '').trim().slice(0, 60)

// GET /api/admin/banner
router.get('/', adminAuthMiddleware, async (_req, res) => {
  try {
    const d = await getFirebaseDb().collection('settings').doc(DOC).get()
    res.json({ ...empty, ...(d.exists ? d.data() : {}) })
  } catch (error) {
    console.error('Get banner error:', error)
    res.status(500).json({ error: 'Could not load the banner' })
  }
})

// PUT /api/admin/banner  { type: 'image' | 'video' | '', url, line1, line2 }
router.put('/', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const b = req.body || {}
    let type = b.type === 'image' || b.type === 'video' ? b.type : ''
    let url = String(b.url || '').trim()
    if (!type || !/^https:\/\//i.test(url)) {
      type = ''
      url = ''
    }

    await getFirebaseDb().collection('settings').doc(DOC).set({
      type,
      url,
      line1: text(b.line1),
      line2: text(b.line2),
      updatedAt: new Date().toISOString()
    })
    res.json({ message: 'Banner saved' })
  } catch (error) {
    console.error('Save banner error:', error)
    res.status(500).json({ error: 'Could not save the banner' })
  }
})

export default router
