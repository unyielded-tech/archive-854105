import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Marquee } from '@/components/fx'
import { StoreMap } from '@/components/StoreMap'
import { media } from '@/config/media'
import { MainLayout } from '@/layouts/MainLayout'
import { getProducts, getCollections } from '@/services/firestore'
import type { Product, Collection } from '@/types'

export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [products, cols] = await Promise.all([
          getProducts({ featured: true, published: true, limit: 8 }),
          getCollections(),
        ])
        setFeaturedProducts(products)
        setCollections(cols.slice(0, 3))
      } catch (error) {
        console.error('Failed to load homepage content:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [])

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 800], [0, 160])
  const first = collections[0]?.heroImage || featuredProducts[0]?.images?.[0]?.url

  return (
    <MainLayout>
      <section className={`relative h-[85svh] md:h-[92vh] overflow-hidden bg-[#EDE8E0] ${first ? 'text-[#F7F4EF]' : 'text-[#111]'}`}>
        {media.heroVideo
          ? <video src={media.heroVideo} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          : first && <motion.img style={{ y: heroY }} src={first} alt="" className="absolute inset-0 w-full h-full object-cover kenburns" />}
        {first && <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />}
        <div className="absolute bottom-0 inset-x-0 px-5 md:px-16 pb-12">
          <h1 className="serif text-5xl sm:text-6xl md:text-8xl leading-[1.05]">
            <span className="reveal-line"><span>The New</span></span>
            <span className="reveal-line"><span style={{ animationDelay: '.2s' }}><em>Collection</em></span></span>
          </h1>
          <div className="fade-in mt-8 flex gap-6 items-center">
            <Link to="/shop" className={`btn border ${first ? 'bg-[#F7F4EF] text-black border-[#F7F4EF]' : 'btn-primary'}`}>Discover</Link>
            <Link to="/collections" className="underline-grow text-xs tracking-[0.25em] uppercase">Lookbook</Link>
          </div>
        </div>
      </section>

      <div className="py-6 border-b border-black/10 serif text-2xl text-[#6f6a62]">
        <Marquee items={['Katihar, Bihar', 'Premium Streetwear', 'Limited Pieces', 'New Market']} />
      </div>

      {collections.length > 0 && (
        <section className="px-5 md:px-16 py-24 md:py-36">
          <h2 className="serif text-4xl md:text-6xl text-center mb-16">Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {collections.map((c, idx) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.15, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
                <Link to={`/collections/${c.slug}`} className="group block">
                  {c.heroImage && (<div className="overflow-hidden aspect-[3/4] mb-6"><img src={c.heroImage} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1800ms]" /></div>)}
                  <h3 className="serif text-2xl text-center">{c.name}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="px-5 md:px-16 pb-24 md:pb-36">
          <h2 className="serif text-4xl md:text-6xl text-center mb-16">Featured</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
            {featuredProducts.map((p, idx) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (idx % 4) * 0.1, duration: 1 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="px-5 md:px-16 py-24 border-t border-black/10 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="serif text-4xl md:text-6xl mb-6">Visit the Store</h2>
          <p className="text-lg mb-2">{media.address}</p>
          <p className="mb-8 text-[#6f6a62]">{media.phone}</p>
          <div className="flex gap-4 flex-wrap">
            <a href={`https://wa.me/${media.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-primary inline-block">WhatsApp</a>
            <a href={`tel:+${media.whatsapp}`} className="btn btn-line inline-block">Call</a>
          </div>
        </div>
        <StoreMap />
      </section>
    </MainLayout>
  )
}

function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]

  return (
    <Link to={`/product/${product.slug}`} className="group">
      <div className="relative overflow-hidden bg-[#EDE8E0] aspect-[3/4] mb-4">
        {primaryImage && (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {product.sale && (
          <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em]">
            Sale
          </div>
        )}
      </div>
      <h3 className="text-body-md font-semibold group-hover:opacity-75">{product.name}</h3>
      <p className="text-body-sm text-medium-grey mt-2">{product.shortDescription}</p>
      <div className="flex items-center gap-2 mt-4">
        {product.salePrice ? (
          <>
            <span className="text-body-md font-semibold">₹{product.salePrice}</span>
            <span className="text-body-sm text-medium-grey line-through">₹{product.price}</span>
          </>
        ) : (
          <span className="text-body-md font-semibold">₹{product.price}</span>
        )}
      </div>
    </Link>
  )
}
