import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { inr, imageOf } from '@/lib/format'
import type { Product } from '@/types'
import '@/styles/store.css'

export function ProductCard({ product }: { product: Product }) {
  const liked = useWishlistStore((s) => s.ids.includes(product.id))
  const toggle = useWishlistStore((s) => s.toggle)
  const img = imageOf(product)
  const onSale = !!product.salePrice && product.salePrice > 0 && product.salePrice < product.price
  const price = onSale ? (product.salePrice as number) : product.price
  const off = onSale ? Math.round((1 - (product.salePrice as number) / product.price) * 100) : 0
  const stock = typeof product.stock === 'number' ? product.stock : null
  const soldOut = stock !== null && stock <= 0
  const low = stock !== null && stock > 0 && stock <= 5

  return (
    <Link to={`/product/${product.slug}`} className="pcard">
      <div className="pcard-img">
        {img && <img src={img} alt={product.name} loading="lazy" />}
        {onSale ? <span className="pcard-tag">{off}% off</span> : product.newArrival ? <span className="pcard-tag">New</span> : null}
        <button
          type="button"
          className="pcard-heart"
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id) }}
        >
          <Heart size={16} fill={liked ? '#111' : 'none'} />
        </button>
        {soldOut && <div className="pcard-sold">Sold out</div>}
      </div>
      <div className="pcard-body">
        {product.category ? <div className="pcard-cat">{product.category}</div> : null}
        <div className="pcard-name">{product.name}</div>
        <div className="pcard-price">
          <span className="pcard-now">{inr(price)}</span>
          {onSale && <span className="pcard-was">{inr(product.price)}</span>}
          {onSale && <span className="pcard-off">{off}% off</span>}
        </div>
        {low && <div className="pcard-low">Only {stock} left</div>}
      </div>
    </Link>
  )
}
