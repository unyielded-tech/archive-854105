import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Marquee, Magnetic, SplitText, Sticker, Tilt } from '@/components/fx'
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
  const heroY = useTransform(scrollY, [0, 700], [0, 220])
  const heroO = useTransform(scrollY, [0, 600], [1, 0])
  const words = ['NEW DROPS', 'KATIHAR BORN', 'PREMIUM STREETWEAR', 'LIMITED PIECES', 'ARCHIVE 854105']

  return (
    <MainLayout>
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden scan">
        {media.heroVideo && <video src={media.heroVideo} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40" />}
        <div className="blob w-[50vw] h-[50vw] bg-[var(--gold)] -top-20 -left-20" />
        <div className="blob w-[40vw] h-[40vw] bg-[var(--ember)] bottom-0 right-0" style={{ animationDelay: '-6s', opacity: 0.3 }} />
        <motion.div style={{ y: heroY, opacity: heroO }} className="relative z-10 px-5 md:px-12">
          <h1 className="font-street glitch leading-[.85] text-[18vw] md:text-[14vw]" data-t="ARCHIVE"><SplitText text="ARCHIVE" /></h1>
          <div className="flex items-center gap-4 md:gap-8 flex-wrap">
            <span className="font-street outline-text text-[14vw] md:text-[10vw] leading-none">854105</span>
            <Sticker size={130} />
          </div>
          <p className="mt-6 max-w-md text-[var(--dim)] text-lg">Premium luxury streetwear from Katihar, Bihar. Cut for the ones who move first.</p>
          <div className="mt-8 flex gap-4 flex-wrap">
            <Magnetic><Link to="/shop" className="btn btn-primary btn-lg inline-block">Explore Collection</Link></Magnetic>
            <Magnetic><Link to="/collections" className="btn btn-lg inline-block border border-[var(--bone)]/40">Lookbook</Link></Magnetic>
          </div>
        </motion.div>
        <div className="absolute bottom-0 inset-x-0 border-y border-[var(--bone)]/15 bg-black/60 backdrop-blur py-3 font-street text-xl md:text-3xl">
          <Marquee items={words} />
        </div>
      </section>

      {collections.length > 0 && (
        <section className="px-5 md:px-12 py-20 md:py-32">
          <h2 className="text-5xl md:text-8xl mb-12 shimmer">Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {collections.map((c, idx) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 60, rotate: 2 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.15, duration: 0.8 }}>
                <Tilt>
                  <Link to={`/collections/${c.slug}`} className="group block">
                    {c.heroImage && (<div className="relative overflow-hidden aspect-[4/5] mb-5"><img src={c.heroImage} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700" /></div>)}
                    <h3 className="text-3xl">{c.name}</h3>
                    <p className="text-[var(--dim)] mt-1">{c.description}</p>
                  </Link>
                </Tilt>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <div className="py-6 bg-[var(--gold)] text-black font-street text-3xl md:text-5xl -rotate-1 scale-105">
        <Marquee items={['FREE DELIVERY IN KATIHAR', 'COD AVAILABLE', 'LIMITED STOCK', 'ORDER ON WHATSAPP']} reverse />
      </div>

      {featuredProducts.length > 0 && (
        <section className="px-5 md:px-12 py-20 md:py-32">
          <h2 className="text-5xl md:text-8xl mb-12">Featured</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {featuredProducts.map((p, idx) => (
              <motion.div key={p.id} initial={{ opacity: 0, scale: 0.9, y: 40 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (idx % 4) * 0.1, duration: 0.6 }}>
                <Tilt><ProductCard product={p} /></Tilt>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden px-5 md:px-12 py-24 md:py-40 text-center border-t border-[var(--bone)]/15">
        <div className="blob w-[40vw] h-[40vw] bg-[var(--gold)] left-1/3 top-0" style={{ opacity: 0.25 }} />
        <h2 className="relative text-5xl md:text-9xl outline-text">VISIT THE STORE</h2>
        <p className="relative mt-6 text-xl">{media.address}</p>
        <div className="relative mt-8 flex justify-center gap-4 flex-wrap">
          <Magnetic><a href={`https://wa.me/${media.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg inline-block">WhatsApp {media.phone}</a></Magnetic>
          <Magnetic><a href={`tel:+${media.whatsapp}`} className="btn btn-lg inline-block border border-[var(--bone)]/40">Call now</a></Magnetic>
        </div>
      </section>
    </MainLayout>
  )
}

function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]

  return (
    <Link to={`/product/${product.slug}`} className="group">
      <div className="relative overflow-hidden bg-[var(--ink3)] aspect-square mb-4">
        {primaryImage && (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {product.sale && (
          <div className="absolute top-4 right-4 bg-[var(--ember)] text-white px-3 py-1 text-xs uppercase tracking-wider">
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
