import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Truck, Wallet, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { MainLayout } from '@/layouts/MainLayout'
import { ProductCard } from '@/components/ProductCard'
import { getProductBySlug, getProducts } from '@/services/firestore'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { inr, FREE_SHIPPING_ABOVE } from '@/lib/format'
import type { Product } from '@/types'
import '@/styles/store.css'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const wishIds = useWishlistStore((s) => s.ids)
  const toggleWish = useWishlistStore((s) => s.toggle)

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [idx, setIdx] = useState(0)
  const liked = product ? wishIds.includes(product.id) : false

  useEffect(() => {
    let alive = true
    setLoading(true)
    setIdx(0); setQty(1); setSize('')
    const load = async () => {
      if (!slug) return
      try {
        const p = await getProductBySlug(slug)
        if (!p) { navigate('/404', { replace: true }); return }
        if (!alive) return
        setProduct(p)
        setColor(p.colors?.[0]?.name || '')
        window.scrollTo({ top: 0 })
        getProducts({ published: true, category: p.category || undefined, limit: 12 })
          .then((list) => alive && setRelated(list.filter((x) => x.id !== p.id).slice(0, 10)))
          .catch(() => {})
      } catch (e) {
        console.error('Failed to load product:', e)
        navigate('/404', { replace: true })
      } finally {
        alive && setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [slug, navigate])

  const images = useMemo(() => (product?.images || []).map((i: any) => (typeof i === 'string' ? i : i.url)).filter(Boolean), [product])

  if (loading || !product) {
    return <MainLayout hideFab><div className="st-empty" style={{ minHeight: '50vh' }}>Loading…</div></MainLayout>
  }

  const onSale = !!product.salePrice && product.salePrice > 0 && product.salePrice < product.price
  const price = onSale ? (product.salePrice as number) : product.price
  const off = onSale ? Math.round((1 - (product.salePrice as number) / product.price) * 100) : 0
  const stock = typeof product.stock === 'number' ? product.stock : null
  const soldOut = stock !== null && stock <= 0
  const maxQty = stock !== null ? Math.max(1, Math.min(10, stock)) : 10
  const sizes = product.sizes || []
  const colors = product.colors || []

  const validate = () => {
    if (sizes.length > 0 && !size) { toast.error('Please select a size'); return false }
    if (colors.length > 0 && !color) { toast.error('Please select a color'); return false }
    return true
  }
  const addToBag = () => {
    if (!validate()) return false
    addItem(product, size, color, qty)
    toast.success('Added to bag')
    return true
  }
  const buyNow = () => { if (addToBag()) navigate('/cart') }

  return (
    <MainLayout hideFab>
      <div className="st-wrap">
        <div className="st-sub" style={{ paddingTop: 12, fontSize: '.72rem' }}>
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
          {product.category ? <> / <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link></> : null}
        </div>

        <div className="pp">
          <div>
            <div className="pp-main">
              {images[idx] ? <img src={images[idx]} alt={product.name} /> : null}
            </div>
            {images.length > 1 && (
              <div className="pp-thumbs">
                {images.map((u, i) => (
                  <button key={u + i} className={`pp-thumb ${i === idx ? 'on' : ''}`} onClick={() => setIdx(i)} aria-label={`Photo ${i + 1}`}>
                    <img src={u} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.category && <div className="pcard-cat">{product.category}</div>}
            <h1 className="pp-name">{product.name}</h1>

            <div className="pp-price">
              <span className="pp-now">{inr(price)}</span>
              {onSale && <span className="pp-was">{inr(product.price)}</span>}
              {onSale && <span className="pp-off">{off}% off</span>}
            </div>
            <p className="st-sub" style={{ fontSize: '.72rem' }}>Inclusive of all taxes</p>
            <p style={{ margin: '8px 0 0', fontSize: '.85rem', color: soldOut ? '#b3261e' : stock !== null && stock <= 5 ? '#b3261e' : '#1a7f37' }}>
              {soldOut ? 'Out of stock' : stock !== null && stock <= 5 ? `Only ${stock} left` : 'In stock'}
            </p>

            {colors.length > 0 && (
              <>
                <label className="st-label">Color</label>
                <div className="pp-sizes">
                  {colors.map((c) => (
                    <button key={c.name} className={`pp-size ${color === c.name ? 'on' : ''}`} onClick={() => setColor(c.name)}>{c.name}</button>
                  ))}
                </div>
              </>
            )}

            {sizes.length > 0 && (
              <>
                <label className="st-label">Select size</label>
                <div className="pp-sizes">
                  {sizes.map((s) => (
                    <button key={s} className={`pp-size ${size === s ? 'on' : ''}`} onClick={() => setSize(s)}>{s}</button>
                  ))}
                </div>
              </>
            )}

            <label className="st-label">Quantity</label>
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Less">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(maxQty, qty + 1))} aria-label="More">+</button>
            </div>

            <div className="pp-bar">
              <button className="st-btn ghost" disabled={soldOut} onClick={addToBag}>Add to bag</button>
              <button className="st-btn" disabled={soldOut} onClick={buyNow}>{soldOut ? 'Sold out' : 'Buy now'}</button>
            </div>

            <button className="st-btn ghost block" style={{ marginTop: 10, minHeight: 40 }} onClick={() => { toggleWish(product.id); toast(liked ? 'Removed from wishlist' : 'Saved to wishlist') }}>
              <Heart size={15} fill={liked ? '#111' : 'none'} /> {liked ? 'Saved to wishlist' : 'Add to wishlist'}
            </button>

            <div className="pp-info">
              <div><Truck size={18} /> Free delivery on orders above {inr(FREE_SHIPPING_ABOVE)}</div>
              <div><Wallet size={18} /> Cash on delivery available</div>
              <div><MessageCircle size={18} /> Questions? <a href="https://wa.me/917033077553" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>Chat on WhatsApp</a></div>
            </div>

            {(product.description || product.fabric || product.fit || product.careInstructions) && (
              <div style={{ marginTop: 18 }}>
                <label className="st-label" style={{ marginTop: 0 }}>Details</label>
                {product.description && <p style={{ fontSize: '.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{product.description}</p>}
                {product.fabric && <p style={{ fontSize: '.85rem', margin: '0 0 4px' }}><b style={{ fontWeight: 500 }}>Fabric:</b> {product.fabric}</p>}
                {product.fit && <p style={{ fontSize: '.85rem', margin: '0 0 4px' }}><b style={{ fontWeight: 500 }}>Fit:</b> {product.fit}</p>}
                {product.careInstructions && <p style={{ fontSize: '.85rem', margin: 0 }}><b style={{ fontWeight: 500 }}>Care:</b> {product.careInstructions}</p>}
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="st-sec" style={{ paddingBottom: 28 }}>
            <div className="st-sec-head"><h2 className="st-title">You may also like</h2></div>
            <div className="hscroll">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  )
}
