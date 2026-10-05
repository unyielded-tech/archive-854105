import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Truck, Wallet, MessageCircle, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { MainLayout } from '@/layouts/MainLayout'
import { ProductCard } from '@/components/ProductCard'
import { SizeGuide } from '@/components/SizeGuide'
import { Reviews, RatingPill } from '@/components/Reviews'
import { useSeo } from '@/lib/seo'
import { trackEvent } from '@/lib/analytics'
import { media } from '@/config/media'
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
  const [zoom, setZoom] = useState(false)
  const [pin, setPin] = useState(() => { try { return localStorage.getItem('archive-pincode') || '' } catch { return '' } })
  const [eta, setEta] = useState('')
  const [recent, setRecent] = useState<Product[]>([])

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
        try {
          const key = 'archive-recent'
          const old: Product[] = JSON.parse(localStorage.getItem(key) || '[]')
          setRecent(old.filter((x) => x.id !== p.id).slice(0, 8))
          const lite = { id: p.id, slug: p.slug, name: p.name, price: p.price, salePrice: p.salePrice, category: p.category, images: p.images?.slice(0, 1), stock: p.stock, newArrival: p.newArrival, rating: p.rating, reviewCount: p.reviewCount }
          localStorage.setItem(key, JSON.stringify([lite, ...old.filter((x) => x.id !== p.id)].slice(0, 10)))
        } catch { /* storage may be blocked */ }
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

  const seoPrice = product ? (product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? product.salePrice : product.price) : 0
  useSeo({
    title: product?.name,
    description: product ? (product.description || product.shortDescription || `${product.name} from ARCHIVE 854105`) : undefined,
    image: images[0],
    jsonLd: product ? {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: images,
      description: product.description || product.name,
      sku: (product as any).sku || product.id,
      brand: { '@type': 'Brand', name: 'ARCHIVE 854105' },
      ...(product.reviewCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount } } : {}),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: seoPrice,
        availability: typeof product.stock === 'number' && product.stock <= 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: window.location.href,
      },
    } : undefined,
  })

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
    trackEvent('add_to_cart', { value: price * qty, items: [{ item_id: product.id, item_name: product.name, quantity: qty, price }] })
    toast.success('Added to bag')
    return true
  }
  const buyNow = () => { if (addToBag()) navigate('/cart') }

  const checkPin = () => {
    const code = pin.replace(/\D/g, '')
    if (code.length !== 6) { setEta('Enter a valid 6-digit pincode'); return }
    try { localStorage.setItem('archive-pincode', code) } catch { /* ignore */ }
    const day = (n: number) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    setEta(`Standard delivery by ${day(5)} – ${day(7)} · Express by ${day(2)} – ${day(3)} · Cash on delivery available`)
  }

  const shareUrl = `${window.location.origin}/share/${product.slug}`
  const share = async () => {
    const text = `${product.name} — ${inr(price)} | ARCHIVE 854105`
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text, url: shareUrl }); return } catch { /* cancelled: fall through to WhatsApp */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`, '_blank')
  }
  const notifyUrl = `https://wa.me/${media.whatsapp}?text=${encodeURIComponent(`Hello ARCHIVE 854105, please tell me when "${product.name}" is back in stock.`)}`

  return (
    <MainLayout hideFab>
      <div className="st-wrap">
        <div className="st-sub" style={{ paddingTop: 12, fontSize: '.72rem' }}>
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
          {product.category ? <> / <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link></> : null}
        </div>

        <div className="pp">
          <div>
            <div className="pp-main" style={{ cursor: images[idx] ? 'zoom-in' : undefined }} onClick={() => images[idx] && setZoom(true)}>
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
            {product.reviewCount ? <a href="#reviews"><RatingPill value={product.rating} count={product.reviewCount} /></a> : null}

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <label className="st-label">Select size</label>
                  <SizeGuide />
                </div>
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

            {soldOut && <a className="st-btn ghost block" style={{ marginTop: 10, minHeight: 40 }} href={notifyUrl} target="_blank" rel="noreferrer">Notify me when it&apos;s back</a>}
            <button className="st-btn ghost block" style={{ marginTop: 10, minHeight: 40 }} onClick={share}><Share2 size={15} /> Share</button>

            <label className="st-label">Check delivery</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="st-input" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setEta('') }} placeholder="Enter pincode" />
              <button className="st-btn ghost" style={{ padding: '0 18px' }} onClick={checkPin}>Check</button>
            </div>
            {eta && <p className="st-sub" style={{ margin: '8px 0 0', fontSize: '.8rem', color: eta.startsWith('Enter') ? '#b3261e' : '#1a7f37' }}>{eta}</p>}

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

        <Reviews productId={product.id} />

        {recent.length > 0 && (
          <section className="st-sec">
            <div className="st-sec-head"><h2 className="st-title">Recently viewed</h2></div>
            <div className="hscroll">
              {recent.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="st-sec" style={{ paddingBottom: 28 }}>
            <div className="st-sec-head"><h2 className="st-title">You may also like</h2></div>
            <div className="hscroll">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
      {zoom && images[idx] && (
        <div className="lightbox" onClick={() => setZoom(false)}>
          <img src={images[idx]} alt={product.name} onClick={(e) => e.stopPropagation()} />
          <button className="lb-btn" style={{ top: 12, right: 12 }} onClick={() => setZoom(false)} aria-label="Close"><X size={20} /></button>
          {images.length > 1 && (
            <>
              <button className="lb-btn" style={{ left: 8, top: '50%' }} onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + images.length) % images.length) }} aria-label="Previous"><ChevronLeft size={22} /></button>
              <button className="lb-btn" style={{ right: 8, top: '50%' }} onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % images.length) }} aria-label="Next"><ChevronRight size={22} /></button>
            </>
          )}
        </div>
      )}
    </MainLayout>
  )
}
