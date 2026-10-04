import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MainLayout } from '@/layouts/MainLayout'
import { getProductBySlug } from '@/services/firestore'
import { useCartStore } from '@/store/cartStore'
import type { Product } from '@/types'
import { Heart, ChevronRight, Truck, RotateCw } from 'lucide-react'
import toast from 'react-hot-toast'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return
      try {
        const prod = await getProductBySlug(slug)
        if (!prod) {
          navigate('/404')
          return
        }
        setProduct(prod)
        setSelectedColor(prod.colors[0]?.name || '')
        setSelectedSize(prod.sizes[0] || '')
      } catch (error) {
        console.error('Failed to load product:', error)
        navigate('/404')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [slug, navigate])

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-20 text-center">
          <p className="text-body-lg text-medium-grey">Loading product...</p>
        </div>
      </MainLayout>
    )
  }

  if (!product) {
    return <MainLayout><div className="container py-20 text-center"><h1 className="text-h1">Product not found</h1></div></MainLayout>
  }

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size')
      return
    }
    if (product.colors.length > 0 && !selectedColor) {
      toast.error('Please select a color')
      return
    }
    addItem(product, selectedSize, selectedColor, quantity)
    toast.success(`Added ${quantity} to cart`)
  }

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]

  return (
    <MainLayout>
      <div className="container py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative overflow-hidden bg-off-white aspect-square">
              {(product.images[primaryImageIdx]?.url || primaryImage?.url) && (
                <motion.img key={primaryImageIdx} src={product.images[primaryImageIdx]?.url || primaryImage?.url} alt={product.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full object-cover" />
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, idx) => (
                  <button key={img.id} onClick={() => setPrimaryImageIdx(idx)} className={`aspect-square overflow-hidden border-2 transition ${primaryImageIdx === idx ? 'border-black' : 'border-soft-grey'}`}>
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-h1 md:text-display-sm font-display mb-2">{product.name}</h1>
              <p className="text-body-lg text-medium-grey">{product.shortDescription}</p>
            </div>

            {/* Pricing */}
            <div className="py-6 border-y border-soft-grey">
              <div className="flex items-center gap-4 mb-2">
                {product.salePrice ? (
                  <>
                    <span className="text-h2 font-semibold">₹{product.salePrice}</span>
                    <span className="text-body-lg text-medium-grey line-through">₹{product.price}</span>
                    <span className="text-error text-sm font-semibold uppercase">Sale</span>
                  </>
                ) : (
                  <span className="text-h2 font-semibold">₹{product.price}</span>
                )}
              </div>
              {product.compareAtPrice && (
                <p className="text-body-sm text-medium-grey">Compare at ₹{product.compareAtPrice}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-h5 font-semibold mb-3">Description</h3>
              <p className="text-body-md text-charcoal leading-relaxed">{product.description}</p>
            </div>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <h3 className="text-h5 font-semibold mb-3">Color</h3>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button key={color.name} onClick={() => setSelectedColor(color.name)} className={`px-4 py-2 border-2 rounded-md text-sm font-semibold transition ${selectedColor === color.name ? 'bg-black text-white border-black' : 'border-medium-grey hover:border-black'}`}>
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <h3 className="text-h5 font-semibold mb-3">Size</h3>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((size) => (
                    <button key={size} onClick={() => setSelectedSize(size)} className={`px-3 py-2 border-2 rounded-md text-sm font-semibold transition ${selectedSize === size ? 'bg-black text-white border-black' : 'border-medium-grey hover:border-black'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div>
                <h3 className="text-h5 font-semibold mb-3">Quantity</h3>
                <div className="flex items-center border border-medium-grey rounded-md w-fit">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-off-white">−</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-12 text-center border-x border-medium-grey focus:outline-none" />
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-off-white">+</button>
                </div>
              </div>

              <button onClick={handleAddToCart} disabled={product.stock === 0} className="w-full btn btn-primary btn-lg hover:bg-charcoal disabled:opacity-50">
                {product.stock === 0 ? 'Out of Stock' : 'Add to Bag'}
              </button>

              <button className="w-full btn btn-secondary btn-lg flex items-center justify-center gap-2">
                <Heart size={18} />
                Add to Wishlist
              </button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-soft-grey">
              <div className="flex gap-3">
                <Truck className="flex-shrink-0 text-medium-grey" size={20} />
                <div>
                  <p className="text-sm font-semibold">Free Shipping</p>
                  <p className="text-xs text-medium-grey">On orders over ₹2000</p>
                </div>
              </div>
              <div className="flex gap-3">
                <RotateCw className="flex-shrink-0 text-medium-grey" size={20} />
                <div>
                  <p className="text-sm font-semibold">Easy Returns</p>
                  <p className="text-xs text-medium-grey">30-day return policy</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {(product.fabric || product.fit || product.careInstructions) && (
              <div className="pt-6 border-t border-soft-grey space-y-4">
                {product.fabric && (
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider">Fabric</p>
                    <p className="text-body-sm text-medium-grey">{product.fabric}</p>
                  </div>
                )}
                {product.fit && (
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider">Fit</p>
                    <p className="text-body-sm text-medium-grey">{product.fit}</p>
                  </div>
                )}
                {product.careInstructions && (
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider">Care</p>
                    <p className="text-body-sm text-medium-grey">{product.careInstructions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
