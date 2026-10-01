import express from 'express'
import { adminAuthMiddleware, requireRole } from '../middleware/admin-auth.js'
import { getFirebaseDb, admin } from '../lib/firebase-admin.js'

const router = express.Router()

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
    snapshot.forEach(doc => {
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
    const { name, shortDescription, description, price, salePrice, sku, category, collection, colors, sizes, images, published } = req.body

    if (!name || !price || !sku) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const db = getFirebaseDb()
    const productRef = await db.collection('products').add({
      name,
      shortDescription: shortDescription || '',
      description: description || '',
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      sku,
      category: category || null,
      collection: collection || null,
      colors: colors || [],
      sizes: sizes || [],
      images: images || [],
      published: published || false,
      stock: 0,
      featured: false,
      new: false,
      sale: false,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    res.status(201).json({ id: productRef.id, message: 'Product created' })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// PUT /api/admin/products/:id
router.put('/:id', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const db = getFirebaseDb()
    const { name, shortDescription, description, price, salePrice, sku, category, published, ...rest } = req.body

    await db.collection('products').doc(req.params.id).update({
      name,
      shortDescription,
      description,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      sku,
      category,
      published,
      updatedAt: new Date().toISOString(),
      ...rest
    })

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
