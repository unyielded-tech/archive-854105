import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MainLayout } from '@/layouts/MainLayout'
import { getProducts, getCategories, getCollections } from '@/services/firestore'
import type { Product, Category, Collection } from '@/types'
import { Filter, X } from 'lucide-react'

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedCollection, setSelectedCollection] = useState(searchParams.get('collection') || '')
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [prods, cats, colls] = await Promise.all([
          getProducts({ published: true, limit: 100 }),
          getCategories(),
          getCollections(),
        ])
        setProducts(prods)
        setCategories(cats)
        setCollections(colls)
      } catch (error) {
        console.error('Failed to load shop data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false
    if (selectedCollection && p.collection !== selectedCollection) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (p.price > priceRange[1] || p.price < priceRange[0]) return false
    return true
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.salePrice || a.price
    const priceB = b.salePrice || b.price
    switch (sortBy) {
      case 'price-low': return priceA - priceB
      case 'price-high': return priceB - priceA
      case 'popular': return b.viewCount - a.viewCount
      default: return b.createdAt.getTime() - a.createdAt.getTime()
    }
  })

  const allSizes = Array.from(new Set(products.flatMap((p) => p.sizes)))
  const allColors = Array.from(new Set(products.flatMap((p) => p.colors.map((c) => c.name))))

  const handleFilterChange = () => {
    const params = new URLSearchParams()
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedCollection) params.set('collection', selectedCollection)
    if (search) params.set('search', search)
    if (sortBy !== 'newest') params.set('sort', sortBy)
    setSearchParams(params)
  }

  useEffect(() => {
    handleFilterChange()
  }, [selectedCategory, selectedCollection, search, sortBy])

  return (
    <MainLayout>
      <div className="bg-off-white border-b border-soft-grey py-8 md:py-12">
        <div className="container">
          <h1 className="text-h1 md:text-display-sm font-display mb-2">Shop</h1>
          <p className="text-body-lg text-medium-grey">{sortedProducts.length} products</p>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters */}
          <div className={`lg:col-span-1 ${mobileFiltersOpen ? 'fixed inset-0 z-40 bg-white overflow-y-auto' : 'hidden lg:block'}`}>
            {mobileFiltersOpen && (
              <div className="sticky top-0 bg-white border-b border-soft-grey p-4 flex justify-between">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)}><X size={20} /></button>
              </div>
            )}
            <div className="p-4 md:p-0 space-y-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="category" value="" checked={selectedCategory === ''} onChange={(e) => setSelectedCategory(e.target.value)} className="w-4 h-4" />
                    All
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="category" value={cat.id} checked={selectedCategory === cat.id} onChange={(e) => setSelectedCategory(e.target.value)} className="w-4 h-4" />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Collection</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="collection" value="" checked={selectedCollection === ''} onChange={(e) => setSelectedCollection(e.target.value)} className="w-4 h-4" />
                    All
                  </label>
                  {collections.map((coll) => (
                    <label key={coll.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="collection" value={coll.id} checked={selectedCollection === coll.id} onChange={(e) => setSelectedCollection(e.target.value)} className="w-4 h-4" />
                      {coll.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Price</h3>
                <div className="space-y-4">
                  <input type="range" min="0" max="100000" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full" />
                  <div className="flex justify-between text-sm">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-soft-grey">
              <button onClick={() => setMobileFiltersOpen(true)} className="lg:hidden flex items-center gap-2 text-sm uppercase tracking-wider font-semibold">
                <Filter size={16} />
                Filters
              </button>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm border border-medium-grey rounded-md px-3 py-2">
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {loading && <div className="text-center py-12"><p className="text-body-lg text-medium-grey">Loading...</p></div>}
            {!loading && sortedProducts.length === 0 && <div className="text-center py-12"><p className="text-body-lg text-medium-grey">No products found</p></div>}

            {!loading && sortedProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {sortedProducts.map((product, idx) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <ShopProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function ShopProductCard({ product }: { product: Product }) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]
  return (
    <a href={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden bg-off-white aspect-square mb-4">
        {primaryImage && <img src={primaryImage.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
        {product.sale && <div className="absolute top-4 right-4 bg-error text-white px-3 py-1 text-xs uppercase tracking-wider font-semibold">Sale</div>}
        {product.newArrival && <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs uppercase tracking-wider font-semibold">New</div>}
      </div>
      <h3 className="text-body-md font-semibold group-hover:opacity-75">{product.name}</h3>
      <p className="text-body-sm text-medium-grey mt-1 line-clamp-2">{product.shortDescription}</p>
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
    </a>
  )
}
