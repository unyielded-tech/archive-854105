import express from 'express'
import { randomUUID } from 'node:crypto'
import { requireRole } from '../middleware/admin-auth.js'
import { initializeFirebaseAdmin } from '../lib/firebase-admin.js'

const router = express.Router()
const IMAGE_BUCKET = 'product-images'
const MEDIA_BUCKET = 'site-media'
const MAX_BYTES = 3 * 1024 * 1024
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const VIDEO_EXT = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }
const ready = new Set()

// Creates a public bucket the first time it is needed.
async function ensureBucket(sb, name) {
  if (ready.has(name)) return
  const { error } = await sb.storage.createBucket(name, { public: true })
  if (error) {
    const { data } = await sb.storage.getBucket(name)
    if (!data) throw error
  }
  ready.add(name)
}

// POST /api/admin/uploads  { dataUrl: "data:image/jpeg;base64,..." }  ->  { url }
router.post('/', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.dataUrl || ''))
    if (!m) return res.status(400).json({ error: 'Send a JPG, PNG or WebP image' })

    const buffer = Buffer.from(m[2], 'base64')
    if (!buffer.length || buffer.length > MAX_BYTES) {
      return res.status(413).json({ error: 'Image is too large (max 3 MB)' })
    }

    const sb = initializeFirebaseAdmin()
    await ensureBucket(sb, IMAGE_BUCKET)

    const path = `products/${Date.now()}-${randomUUID().slice(0, 8)}.${EXT[m[1]]}`
    const { error } = await sb.storage.from(IMAGE_BUCKET).upload(path, buffer, {
      contentType: m[1],
      cacheControl: '31536000',
      upsert: false
    })
    if (error) throw error

    const { data } = sb.storage.from(IMAGE_BUCKET).getPublicUrl(path)
    res.status(201).json({ url: data.publicUrl })
  } catch (error) {
    console.error('Upload image error:', error)
    res.status(500).json({ error: 'Could not upload the image' })
  }
})

// POST /api/admin/uploads/video-url  { contentType }  ->  { path, token, publicUrl }
// Videos are too big for a serverless request, so the browser uploads them straight to
// Supabase Storage using a one-time signed token created here.
router.post('/video-url', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const ext = VIDEO_EXT[String(req.body?.contentType || '')]
    if (!ext) return res.status(400).json({ error: 'Use an MP4, WebM or MOV video' })

    const sb = initializeFirebaseAdmin()
    await ensureBucket(sb, MEDIA_BUCKET)

    const path = `banner/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
    const { data, error } = await sb.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path)
    if (error) throw error

    const { data: pub } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path)
    res.json({ path, token: data.token, publicUrl: pub.publicUrl })
  } catch (error) {
    console.error('Video upload url error:', error)
    res.status(500).json({ error: 'Could not prepare the video upload' })
  }
})

export default router
