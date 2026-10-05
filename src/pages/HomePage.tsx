import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Truck, Wallet, MessageCircle } from 'lucide-react'
import { Marquee } from '@/components/fx'
import { StoreMap } from '@/components/StoreMap'
import { ProductCard } from '@/components/ProductCard'
import { media } from '@/config/media'
import { MainLayout } from '@/layouts/MainLayout'
import { getProducts, getCollections, getHomeBanner, type HomeBannerData } from '@/services/firestore'
import { imageOf, FREE_SHIPPING_ABOVE, inr } from '@/lib/format'
import type { Product, Collection } from '@/types'
import '@/styles/store.css'
import { useSeo } from '@/lib/seo'

export function HomePage() {
  useSeo({ description: 'Premium luxury streetwear from Katihar, Bihar. New arrivals, deals and cash on delivery.' })
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<HomeBannerData | null>(null)

  useEffect(() => {
    Promise.all([getProducts({ published: true, limit: 200 }), getCollections()])
      .then(([prods, cols]) => { setProducts(prods); setCollections(cols.slice(0, 4)) })
      .catch((e) => console.error('Failed to load homepage content:', e))
      .finally(() => setLoading(false))
    getHomeBanner().then(setBanner).catch(() => {})
  }, [])

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 800], [0, 120])

  const featured = useMemo(() => products.filter((p) => p.featured), [products])
  const deals = useMemo(() => products.filter((p) => p.salePrice && p.salePrice > 0 && p.salePrice < p.price), [products])
  const latest = useMemo(() => products.slice(0, 10), [products])
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of products) if (p.category && !seen.has(p.category)) seen.set(p.category, imageOf(p))
    return Array.from(seen, ([name, img]) => ({ name, img }))
  }, [products])

  const bannerUrl = banner?.url && banner?.type ? banner.url : ''
  const heroFallback = collections[0]?.heroImage || (featured[0] ? imageOf(featured[0]) : '') || (products[0] ? imageOf(products[0]) : '')
  const hasMedia = !!(bannerUrl || heroFallback)
  const line1 = banner?.line1?.trim() || 'The New'
  const line2 = banner?.line2?.trim() || 'Collection'

  return (
    <MainLayout>
      {/* Hero */}
      <section className={`relative h-[56svh] md:h-[74vh] overflow-hidden bg-[#EDE8E0] ${hasMedia ? 'text-[#F7F4EF]' : 'text-[#111]'}`}>
        {bannerUrl && banner?.type === 'video' ? (
          <video src={bannerUrl} autoPlay loop muted playsInline preload="auto" className="absolute inset-0 w-full h-full object-cover" />
        ) : bannerUrl && banner?.type === 'image' ? (
          <motion.img style={{ y: heroY }} src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover kenburns" />
        ) : media.heroVideo ? (
          <video src={media.heroVideo} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          heroFallback && <motion.img style={{ y: heroY }} src={heroFallback} alt="" className="absolute inset-0 w-full h-full object-cover kenburns" />
        )}
        {hasMedia && <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />}
        <div className="absolute bottom-0 inset-x-0 px-5 md:px-16 pb-8 md:pb-12">
          <h1 className="serif text-4xl sm:text-5xl md:text-7xl leading-[1.05]">
            <span className="reveal-line"><span>{line1}</span></span>
            <span className="reveal-line"><span style={{ animationDelay: '.2s' }}><em>{line2}</em></span></span>
          </h1>
          <div className="fade-in mt-5 flex gap-5 items-center">
            <Link to="/shop" className={`st-btn ${hasMedia ? '' : ''}`} style={hasMedia ? { background: '#F7F4EF', color: '#111', borderColor: '#F7F4EF' } : undefined}>Shop now</Link>
            <Link to="/shop?sale=true" className="underline-grow text-xs tracking-[0.25em] uppercase">View deals</Link>
          </div>
        </div>
      </section>

      <div className="st-wrap">
        {/* Trust bar */}
        <div className="trust" style={{ marginTop: 12 }}>
          <div><Truck size={18} /><span><b>Free delivery</b>above {inr(FREE_SHIPPING_ABOVE)}</span></div>
          <div><Wallet size={18} /><span><b>Cash on delivery</b>pay when it arrives</span></div>
          <div><MessageCircle size={18} /><span><b>WhatsApp help</b>we reply fast</span></div>
        </div>

        {loading ? (
          <div className="st-empty">Loading…</div>
        ) : products.length === 0 ? (
          <div className="st-empty">New styles are on the way. Check back soon.</div>
        ) : (
          <>
            {categories.length > 0 && (
              <section className="st-sec">
                <div className="st-sec-head"><h2 className="st-title">Shop by category</h2></div>
                <div className="cats">
                  {categories.map((c) => (
                    <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="cat">
                      <div className="cat-img">{c.img ? <img src={c.img} alt="" loading="lazy" /> : c.name.charAt(0)}</div>
                      <span>{c.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {deals.length > 0 && (
              <section className="st-sec">
                <div className="st-sec-head">
                  <h2 className="st-title">Deals of the day</h2>
                  <Link to="/shop?sale=true" className="st-link">See all</Link>
                </div>
                <div className="hscroll">
                  {deals.slice(0, 12).map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            )}

            <section className="st-sec">
              <div className="st-sec-head">
                <h2 className="st-title">New arrivals</h2>
                <Link to="/shop?new=true" className="st-link">See all</Link>
              </div>
              <div className="hscroll">
                {latest.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>

            <div className="py-3 border-y border-black/10 serif text-xl text-[#6f6a62]" style={{ margin: '8px 0' }}>
              <Marquee items={['Katihar, Bihar', 'Premium Streetwear', 'Limited Pieces', 'New Market']} />
            </div>

            <section className="st-sec">
              <div className="st-sec-head">
                <h2 className="st-title">{featured.length > 0 ? 'Featured' : 'Latest products'}</h2>
                <Link to="/shop" className="st-link">Shop all</Link>
              </div>
              <div className="pgrid wide">
                {(featured.length > 0 ? featured : latest).slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <Link to="/shop" className="st-btn ghost">View all products</Link>
              </div>
            </section>

            {collections.length > 0 && (
              <section className="st-sec">
                <div className="st-sec-head">
                  <h2 className="st-title">Collections</h2>
                  <Link to="/collections" className="st-link">See all</Link>
                </div>
                <div className="pgrid">
                  {collections.map((c) => (
                    <Link key={c.id} to={`/collections/${c.slug}`} className="pcard">
                      <div className="pcard-img">{c.heroImage && <img src={c.heroImage} alt={c.name} loading="lazy" />}</div>
                      <div className="pcard-body"><div className="pcard-name" style={{ minHeight: 0, margin: 0 }}>{c.name}</div></div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section className="st-sec" style={{ paddingBottom: 28 }}>
          <div className="grid md:grid-cols-2 gap-8 items-center" style={{ display: 'grid', gap: 20 }}>
            <div>
              <h2 className="st-title" style={{ marginBottom: 8 }}>Visit the store</h2>
              <p style={{ margin: '0 0 4px' }}>{media.address}</p>
              <p style={{ margin: '0 0 14px', color: 'var(--stone)' }}>{media.phone}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`https://wa.me/${media.whatsapp}`} target="_blank" rel="noreferrer" className="st-btn">WhatsApp</a>
                <a href={`tel:+${media.whatsapp}`} className="st-btn ghost">Call</a>
              </div>
            </div>
            <StoreMap />
          </div>
        </section>
      </div>
    </MainLayout>
  )
}
