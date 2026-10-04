import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { ProductCard } from '@/components/ProductCard'
import { getProducts } from '@/services/firestore'
import { useWishlistStore } from '@/store/wishlistStore'
import type { Product } from '@/types'
import '@/styles/store.css'

export function WishlistPage() {
  const ids = useWishlistStore((s) => s.ids)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts({ published: true, limit: 500 }).then(setProducts).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const saved = products.filter((p) => ids.includes(p.id))

  return (
    <MainLayout>
      <div className="st-wrap" style={{ paddingTop: 16, paddingBottom: 32 }}>
        <h1 className="st-page-title">Wishlist</h1>
        <p className="st-sub" style={{ marginBottom: 12 }}>{saved.length} saved</p>
        {loading ? (
          <div className="st-empty">Loading…</div>
        ) : saved.length === 0 ? (
          <div className="st-empty">
            <p>Tap the heart on any product to save it here.</p>
            <Link to="/shop" className="st-btn" style={{ marginTop: 12 }}>Browse products</Link>
          </div>
        ) : (
          <div className="pgrid wide">{saved.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </div>
    </MainLayout>
  )
}
