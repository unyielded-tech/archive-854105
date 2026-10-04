import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { ProductCard } from '@/components/ProductCard'
import { getCollectionBySlug, getProducts } from '@/services/firestore'
import type { Collection, Product } from '@/types'
import '@/styles/store.css'

export function CollectionDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getCollectionBySlug(slug), getProducts({ published: true, limit: 500 })])
      .then(([c, prods]) => {
        setCollection(c)
        setProducts(c ? prods.filter((p) => p.collection && [c.id, c.slug, c.name].includes(p.collection)) : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <MainLayout>
      <div className="st-wrap" style={{ paddingTop: 16, paddingBottom: 32 }}>
        {loading ? (
          <div className="st-empty">Loading…</div>
        ) : !collection ? (
          <div className="st-empty">
            <p>This collection could not be found.</p>
            <Link to="/collections" className="st-btn" style={{ marginTop: 12 }}>All collections</Link>
          </div>
        ) : (
          <>
            <h1 className="st-page-title">{collection.name}</h1>
            {collection.description && <p className="st-sub" style={{ marginBottom: 12 }}>{collection.description}</p>}
            {products.length === 0 ? (
              <div className="st-empty">No products in this collection yet.</div>
            ) : (
              <div className="pgrid wide">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}
