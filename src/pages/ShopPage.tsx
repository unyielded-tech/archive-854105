import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { MainLayout } from '@/layouts/MainLayout'
import { ProductCard } from '@/components/ProductCard'
import { getProducts } from '@/services/firestore'
import type { Product } from '@/types'
import { inr } from '@/lib/format'
import '@/styles/store.css'

const priceOf = (p: Product) => (p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price)
const NEW_DAYS = 30

export function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState(false)

  const category = params.get('category') || ''
  const search = params.get('search') || ''
  const sort = params.get('sort') || 'newest'
  const onlySale = params.get('sale') === 'true'
  const onlyNew = params.get('new') === 'true'
  const size = params.get('size') || ''
  const maxPrice = Number(params.get('max') || 0)

  useEffect(() => {
    getProducts({ published: true, limit: 500 })
      .then(setProducts)
      .catch((e) => console.error('Failed to load shop data:', e))
      .finally(() => setLoading(false))
  }, [])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))), [products])
  const sizes = useMemo(() => Array.from(new Set(products.flatMap((p) => p.sizes || []))), [products])
  const topPrice = useMemo(() => Math.max(1000, ...products.map(priceOf)), [products])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    const cutoff = Date.now() - NEW_DAYS * 86400000
    let list = products.filter((p) => {
      if (category && p.category !== category) return false
      if (onlySale && !(p.salePrice && p.salePrice < p.price)) return false
      if (onlyNew && !(p.newArrival || new Date(p.createdAt).getTime() > cutoff)) return false
      if (size && !(p.sizes || []).includes(size)) return false
      if (maxPrice && priceOf(p) > maxPrice) return false
      if (q && !`${p.name} ${p.category} ${p.tags?.join(' ') || ''}`.toLowerCase().includes(q)) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'price-low') return priceOf(a) - priceOf(b)
      if (sort === 'price-high') return priceOf(b) - priceOf(a)
      if (sort === 'popular') return (b.viewCount || 0) - (a.viewCount || 0)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return list
  }, [products, category, onlySale, onlyNew, size, maxPrice, search, sort])

  const heading = onlySale ? 'Sale' : onlyNew ? 'New arrivals' : category || (search ? `Results for “${search}”` : 'Shop')
  const activeFilters = [size && `Size ${size}`, maxPrice ? `Under ${inr(maxPrice)}` : '', search && `“${search}”`].filter(Boolean) as string[]

  return (
    <MainLayout>
      <div className="st-wrap" style={{ paddingTop: 16, paddingBottom: 32 }}>
        <h1 className="st-page-title">{heading}</h1>
        <p className="st-sub" style={{ marginBottom: 10 }}>{loading ? 'Loading…' : `${shown.length} product${shown.length === 1 ? '' : 's'}`}</p>

        {categories.length > 0 && (
          <div className="chips">
            <button className={`chip ${!category ? 'on' : ''}`} onClick={() => setParam('category', '')}>All</button>
            {categories.map((c) => (
              <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => setParam('category', c)}>{c}</button>
            ))}
          </div>
        )}

        <div className="toolbar">
          <button className="chip" onClick={() => setDrawer(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={14} /> Filters{activeFilters.length ? ` (${activeFilters.length})` : ''}
          </button>
          <select className="st-select" style={{ width: 'auto', minHeight: 34, fontSize: 14 }} value={sort} onChange={(e) => setParam('sort', e.target.value === 'newest' ? '' : e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="popular">Popular</option>
          </select>
        </div>

        {activeFilters.length > 0 && (
          <div className="chips">
            {activeFilters.map((f) => <span key={f} className="chip on">{f}</span>)}
            <button className="chip" onClick={() => setParams(category ? { category } : {}, { replace: true })}>Clear</button>
          </div>
        )}

        {loading ? (
          <div className="st-empty">Loading…</div>
        ) : shown.length === 0 ? (
          <div className="st-empty">
            {products.length === 0 ? 'New styles are on the way. Check back soon.' : 'No products match your filters.'}
          </div>
        ) : (
          <div className="pgrid wide">
            {shown.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      {drawer && (
        <>
          <div className="drawer-back" onClick={() => setDrawer(false)} />
          <div className="drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="st-title">Filters</h2>
              <button className="hd-icon" onClick={() => setDrawer(false)} aria-label="Close"><X size={20} /></button>
            </div>

            {sizes.length > 0 && (
              <>
                <label className="st-label">Size</label>
                <div className="chips" style={{ flexWrap: 'wrap' }}>
                  <button className={`chip ${!size ? 'on' : ''}`} onClick={() => setParam('size', '')}>Any</button>
                  {sizes.map((s) => (
                    <button key={s} className={`chip ${size === s ? 'on' : ''}`} onClick={() => setParam('size', s)}>{s}</button>
                  ))}
                </div>
              </>
            )}

            <label className="st-label">Max price {maxPrice ? `· ${inr(maxPrice)}` : ''}</label>
            <input type="range" min={0} max={topPrice} step={100} value={maxPrice || topPrice} onChange={(e) => setParam('max', Number(e.target.value) >= topPrice ? '' : e.target.value)} style={{ width: '100%' }} />

            <div style={{ display: 'flex', gap: 8, margin: '16px 0 4px' }}>
              <button className="st-btn ghost block" onClick={() => { const n = new URLSearchParams(); if (category) n.set('category', category); setParams(n, { replace: true }) }}>Reset</button>
              <button className="st-btn block" onClick={() => setDrawer(false)}>Show {shown.length}</button>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  )
}
