import express from 'express'
import { adminAuthMiddleware, requireRole } from '../middleware/admin-auth.js'
import { getFirebaseDb } from '../lib/firebase-admin.js'

const router = express.Router()

// ---------- helpers ----------
const num = (v) => Number(String(v ?? '').replace(/,/g, '').trim())
const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== ''

function slugify(text) {
  return (
    String(text || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'product'
  )
}

async function uniqueSlug(db, base, excludeId) {
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    const snap = await db.collection('products').where('slug', '==', candidate).limit(1).get()
    if (snap.empty || snap.docs[0].id === excludeId) return candidate
  }
  return `${base}-${Date.now()}`
}

// Accepts ["https://..."] or [{url: "..."}] and returns the object shape the storefront expects.
function normalizeImages(list, name) {
  if (!Array.isArray(list)) return []
  return list
    .map((i) => (typeof i === 'string' ? i : i && i.url))
    .map((u) => String(u || '').trim())
    .filter(Boolean)
    .map((url, idx) => ({ id: `img_${idx + 1}`, url, alt: name || '', isPrimary: idx === 0, order: idx }))
}

const cleanList = (list) =>
  Array.isArray(list) ? list.map((s) => String(s).trim()).filter(Boolean) : []

const snippet = (text) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, 140)

// GET /api/admin/products
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, search = '', limit = 20 } = req.query
    const db = getFirebaseDb()
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = db.collection('products')

    if (search) {
      query = query.where('name', '>=', search).where('name', '<=', search + '\uf8ff')
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit) + 1)
      .offset(offset)
      .get()

    const products = []
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() })
    })

    const hasMore = products.length > parseInt(limit)
    if (hasMore) products.pop()

    res.json({
      products,
      hasMore,
      page: parseInt(page)
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET /api/admin/products/:id
router.get('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getFirebaseDb()
    const doc = await db.collection('products').doc(req.params.id).get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json({ id: doc.id, ...doc.data() })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

// POST /api/admin/products
router.post('/', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const b = req.body || {}
    const name = String(b.name || '').trim()
    const price = num(b.price)

    if (!name || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Name and a valid price are required' })
    }

    const salePrice = hasValue(b.salePrice) ? num(b.salePrice) : null
    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price)) {
      return res.status(400).json({ error: 'Sale price must be lower than the price' })
    }

    const stock = hasValue(b.stock) ? Math.floor(num(b.stock)) : 0
    if (!Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({ error: 'Stock must be 0 or more' })
    }

    const db = getFirebaseDb()
    const slug = await uniqueSlug(db, slugify(name))
    const now = new Date().toISOString()
    const description = String(b.description || '')

    const productRef = await db.collection('products').add({
      name,
      slug,
      shortDescription: b.shortDescription ? String(b.shortDescription) : snippet(description),
      description,
      price,
      salePrice,
      sku: hasValue(b.sku) ? String(b.sku).trim() : `ARC-${Date.now().toString(36).toUpperCase()}`,
      category: hasValue(b.category) ? String(b.category).trim() : null,
      collection: b.collection || null,
      tags: cleanList(b.tags),
      colors: Array.isArray(b.colors) ? b.colors : [],
      sizes: cleanList(b.sizes),
      images: normalizeImages(b.images, name),
      inventory: [],
      published: b.published === true,
      stock,
      lowStockThreshold: 5,
      featured: b.featured === true,
      newArrival: false,
      new: false,
      sale: salePrice !== null,
      rating: 0,
      reviewCount: 0,
      viewCount: 0,
      createdAt: now,
      updatedAt: now
    })

    res.status(201).json({ id: productRef.id, slug, message: 'Product created' })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// PUT /api/admin/products/:id
router.put('/:id', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const db = getFirebaseDb()
    const ref = db.collection('products').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Product not found' })

    const cur = snap.data()
    const b = req.body || {}
    const u = { updatedAt: new Date().toISOString() }

    if ('name' in b) {
      const name = String(b.name || '').trim()
      if (!name) return res.status(400).json({ error: 'Name is required' })
      u.name = name
    }
    const finalName = u.name || cur.name

    if ('price' in b) {
      const price = num(b.price)
      if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Enter a valid price' })
      u.price = price
    }
    const finalPrice = u.price ?? cur.price

    if ('salePrice' in b) {
      if (hasValue(b.salePrice)) {
        const sp = num(b.salePrice)
        if (!Number.isFinite(sp) || sp <= 0) return res.status(400).json({ error: 'Enter a valid sale price' })
        u.salePrice = sp
      } else {
        u.salePrice = null
      }
    }
    const finalSale = 'salePrice' in u ? u.salePrice : cur.salePrice ?? null
    if (finalSale !== null && finalSale >= finalPrice) {
      return res.status(400).json({ error: 'Sale price must be lower than the price' })
    }
    if ('price' in b || 'salePrice' in b) u.sale = finalSale !== null

    if ('stock' in b) {
      const stock = hasValue(b.stock) ? Math.floor(num(b.stock)) : 0
      if (!Number.isFinite(stock) || stock < 0) return res.status(400).json({ error: 'Stock must be 0 or more' })
      u.stock = stock
    }

    if ('description' in b) {
      u.description = String(b.description || '')
      if (!cur.shortDescription) u.shortDescription = snippet(u.description)
    }
    if ('shortDescription' in b) u.shortDescription = String(b.shortDescription || '')
    if ('sku' in b && hasValue(b.sku)) u.sku = String(b.sku).trim()
    if ('category' in b) u.category = hasValue(b.category) ? String(b.category).trim() : null
    if ('collection' in b) u.collection = b.collection || null
    if ('sizes' in b) u.sizes = cleanList(b.sizes)
    if ('tags' in b) u.tags = cleanList(b.tags)
    if ('colors' in b && Array.isArray(b.colors)) u.colors = b.colors
    if ('images' in b) u.images = normalizeImages(b.images, finalName)
    if ('published' in b) u.published = b.published === true
    if ('featured' in b) u.featured = b.featured === true
    if ('newArrival' in b) u.newArrival = b.newArrival === true

    // Older products may have no slug; give them one so the storefront link works.
    if (!cur.slug) u.slug = await uniqueSlug(db, slugify(finalName), req.params.id)

    await ref.update(u)

    res.json({ message: 'Product updated' })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// DELETE /api/admin/products/:id
router.delete('/:id', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const db = getFirebaseDb()
    await db.collection('products').doc(req.params.id).delete()
    res.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

export default router
