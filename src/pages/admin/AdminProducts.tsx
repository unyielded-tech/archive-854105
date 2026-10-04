import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { AdminShell } from '@/components/admin/AdminShell'
import { getAdminProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '@/services/api'

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const MAX_IMAGES = 8

// Shrinks a phone photo (usually 3-8 MB) to a web-sized JPEG before upload.
async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('This photo type is not supported. Use JPG, PNG or WebP.'))
      i.src = url
    })
    let scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight))
    let quality = 0.82
    for (let attempt = 0; attempt < 4; attempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not read this photo')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const out = canvas.toDataURL('image/jpeg', quality)
      if (out.length < 1_500_000) return out
      scale *= 0.8
      quality = Math.max(0.6, quality - 0.1)
    }
    throw new Error('This photo is too large')
  } finally {
    URL.revokeObjectURL(url)
  }
}

interface FormState {
  name: string
  price: string
  salePrice: string
  stock: string
  category: string
  images: string[]
  sizes: string[]
  description: string
  published: boolean
  featured: boolean
}

const emptyForm: FormState = {
  name: '',
  price: '',
  salePrice: '',
  stock: '',
  category: '',
  images: [],
  sizes: [],
  description: '',
  published: false,
  featured: false,
}

const imageUrl = (i: any): string => (typeof i === 'string' ? i : i?.url || '')
const money = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const toNumber = (s: string) => Number(s.replace(/,/g, '').trim())

function toForm(p: any): FormState {
  const imgs = (Array.isArray(p.images) ? p.images : []).map(imageUrl).filter(Boolean)
  return {
    name: p.name || '',
    price: p.price != null ? String(p.price) : '',
    salePrice: p.salePrice != null ? String(p.salePrice) : '',
    stock: p.stock != null ? String(p.stock) : '',
    category: p.category || '',
    images: imgs,
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    description: p.description || '',
    published: p.published === true,
    featured: p.featured === true,
  }
}

function sortSizes(list: string[]) {
  const rank = (s: string) => {
    const i = SIZE_PRESETS.indexOf(s)
    return i === -1 ? 99 : i
  }
  return [...list].sort((a, b) => rank(a) - rank(b))
}

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<any | 'new' | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAdminProducts({ limit: 200 })
      setProducts(data.products || [])
    } catch (e: any) {
      toast.error(e?.message || 'Could not load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      [p.name, p.category, p.sku].some((v) => String(v || '').toLowerCase().includes(q))
    )
  }, [products, search])

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  )

  const togglePublished = async (p: any) => {
    const next = !p.published
    try {
      await updateProduct(p.id, { published: next })
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, published: next } : x)))
      toast.success(next ? 'Product is live in the shop' : 'Product hidden from the shop')
    } catch (e: any) {
      toast.error(e?.message || 'Could not update product')
    }
  }

  const remove = async (p: any) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    try {
      await deleteProduct(p.id)
      setProducts((list) => list.filter((x) => x.id !== p.id))
      toast.success('Product deleted')
    } catch (e: any) {
      toast.error(e?.message || 'Could not delete product')
    }
  }

  return (
    <AdminShell title="Products" subtitle={loading ? undefined : `${products.length} in total`}>
      <button className="adm-btn block" onClick={() => setEditing('new')}>
        Add product
      </button>

      <input
        className="adm-in"
        style={{ margin: '14px 0 18px' }}
        type="search"
        placeholder="Search name, category or SKU"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="adm-empty">{products.length === 0 ? 'No products yet. Tap “Add product”.' : 'Nothing matches your search.'}</div>
      ) : (
        <div>
          {shown.map((p) => {
            const img = imageUrl((p.images || [])[0])
            const onSale = p.salePrice != null && p.salePrice < p.price
            return (
              <div className="adm-row" key={p.id}>
                {img ? <img className="adm-thumb" src={img} alt="" loading="lazy" /> : <div className="adm-thumb" />}
                <div className="adm-grow">
                  <p className="adm-name">{p.name}</p>
                  <p className="adm-meta">
                    {onSale ? (
                      <>
                        <span className="adm-strike">{money(p.price)}</span>
                        {money(p.salePrice)}
                      </>
                    ) : (
                      money(p.price)
                    )}
                    {' · '}
                    {p.stock ?? 0} in stock
                    {p.category ? ` · ${p.category}` : ''}
                  </p>
                  <p style={{ margin: '6px 0 0' }}>
                    <span className={`adm-tag ${p.published ? '' : 'dim'}`}>{p.published ? 'Live' : 'Draft'}</span>
                  </p>
                  <div className="adm-actions">
                    <button className="adm-text" onClick={() => togglePublished(p)}>{p.published ? 'Hide' : 'Publish'}</button>
                    <button className="adm-text" onClick={() => setEditing(p)}>Edit</button>
                    <button className="adm-text danger" onClick={() => remove(p)}>Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </AdminShell>
  )
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: any | null
  categories: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [f, setF] = useState<FormState>(product ? toForm(product) : emptyForm)
  const [saving, setSaving] = useState(false)
  const [customSize, setCustomSize] = useState('')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setF((s) => ({ ...s, [key]: value }))

  const toggleSize = (size: string) =>
    set('sizes', sortSizes(f.sizes.includes(size) ? f.sizes.filter((x) => x !== size) : [...f.sizes, size]))

  const addCustomSize = () => {
    const s = customSize.trim().toUpperCase()
    if (!s) return
    if (!f.sizes.includes(s)) set('sizes', sortSizes([...f.sizes, s]))
    setCustomSize('')
  }

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)

  const removeImage = (i: number) => setF((s) => ({ ...s, images: s.images.filter((_, idx) => idx !== i) }))
  const makeMain = (i: number) =>
    setF((s) => ({ ...s, images: [s.images[i], ...s.images.filter((_, idx) => idx !== i)] }))

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const room = MAX_IMAGES - f.images.length
    if (room <= 0) { toast.error(`You can add up to ${MAX_IMAGES} photos`); return }
    if (files.length > room) toast(`Only ${room} more photo${room === 1 ? '' : 's'} can be added`)

    for (const file of files.slice(0, room)) {
      setUploading((n) => n + 1)
      try {
        const { url } = await uploadProductImage(await compressImage(file))
        setF((s) => ({ ...s, images: [...s.images, url] }))
      } catch (err: any) {
        toast.error(err?.message || 'Could not upload a photo')
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  const save = async () => {
    const name = f.name.trim()
    const price = toNumber(f.price)
    if (!name) { toast.error('Enter a product name'); return }
    if (!f.price.trim() || !Number.isFinite(price) || price <= 0) { toast.error('Enter a valid price'); return }

    let salePrice: number | null = null
    if (f.salePrice.trim()) {
      salePrice = toNumber(f.salePrice)
      if (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price) {
        toast.error('Sale price must be lower than the price')
        return
      }
    }

    const stock = f.stock.trim() ? Math.floor(toNumber(f.stock)) : 0
    if (!Number.isFinite(stock) || stock < 0) { toast.error('Stock must be 0 or more'); return }

    if (uploading > 0) { toast.error('Wait for the photos to finish uploading'); return }
    const images = f.images

    const payload = {
      name,
      price,
      salePrice,
      stock,
      category: f.category.trim() || null,
      images,
      sizes: f.sizes,
      description: f.description.trim(),
      published: f.published,
      featured: f.featured,
    }

    setSaving(true)
    try {
      if (product) await updateProduct(product.id, payload)
      else await createProduct(payload)
      toast.success(product ? 'Product saved' : 'Product added')
      onSaved()
    } catch (e: any) {
      toast.error(e?.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="adm-sheet" role="dialog" aria-modal="true">
      <div className="adm-sheet-top">
        <h2>{product ? 'Edit product' : 'New product'}</h2>
        <button className="adm-text" onClick={onClose}>Close</button>
      </div>

      <div className="adm-sheet-body">
        <label className="adm-label">Name</label>
        <input className="adm-in" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Oversized tee" />

        <div className="adm-two">
          <div>
            <label className="adm-label">Price (₹)</label>
            <input className="adm-in" inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="1499" />
          </div>
          <div>
            <label className="adm-label">Sale price (₹)</label>
            <input className="adm-in" inputMode="decimal" value={f.salePrice} onChange={(e) => set('salePrice', e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="adm-two">
          <div>
            <label className="adm-label">Stock</label>
            <input className="adm-in" inputMode="numeric" value={f.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="adm-label">Category</label>
            <input className="adm-in" list="adm-cats" value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="T-shirts" />
            <datalist id="adm-cats">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <label className="adm-label">Photos (the first one is the main photo)</label>
        <div className="adm-gallery">
          {f.images.map((url, i) => (
            <div className="adm-tile" key={url + i}>
              <img src={url} alt="" />
              {i === 0 ? (
                <span className="adm-tile-main">Main</span>
              ) : (
                <button type="button" className="adm-tile-main btn" onClick={() => makeMain(i)}>Make main</button>
              )}
              <button type="button" className="adm-tile-x" onClick={() => removeImage(i)} aria-label="Remove photo">✕</button>
            </div>
          ))}
          {uploading > 0 && <div className="adm-tile adm-tile-busy">Uploading…</div>}
          {f.images.length + uploading < MAX_IMAGES && (
            <button type="button" className="adm-tile adm-tile-add" onClick={() => fileRef.current?.click()}>
              + Add photos
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />

        <label className="adm-label">Sizes</label>
        <div className="adm-chips">
          {sortSizes(Array.from(new Set([...SIZE_PRESETS, ...f.sizes]))).map((s) => (
            <button
              key={s}
              type="button"
              className={`adm-chip ${f.sizes.includes(s) ? 'on' : ''}`}
              onClick={() => toggleSize(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="adm-imgrow" style={{ marginTop: 10 }}>
          <input
            className="adm-in"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomSize()
              }
            }}
            placeholder="Other size, e.g. 32 or Free"
          />
          <button className="adm-btn ghost" type="button" onClick={addCustomSize}>Add</button>
        </div>

        <label className="adm-label">Description</label>
        <textarea className="adm-in" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Fabric, fit, care…" />

        <label className="adm-label">Visibility</label>
        <button
          type="button"
          role="switch"
          aria-checked={f.published}
          className="adm-switch"
          onClick={() => set('published', !f.published)}
        >
          <span>{f.published ? 'Published — visible in the shop' : 'Draft — hidden from the shop'}</span>
          <i />
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={f.featured}
          className="adm-switch"
          style={{ marginTop: 10 }}
          onClick={() => set('featured', !f.featured)}
        >
          <span>{f.featured ? 'Shown in Featured on the homepage' : 'Not shown on the homepage'}</span>
          <i />
        </button>
      </div>

      <div className="adm-sheet-foot">
        <div>
          <button className="adm-btn block" onClick={save} disabled={saving || uploading > 0}>
            {saving ? 'Saving…' : uploading > 0 ? 'Uploading photos…' : product ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  )
}
