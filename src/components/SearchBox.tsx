import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getProducts } from '@/services/firestore'
import { inr, imageOf } from '@/lib/format'
import type { Product } from '@/types'
import '@/styles/store.css'

let cache: Product[] | null = null

// Search field with live product suggestions (loaded once, filtered on the phone).
export function SearchBox({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>(cache || [])
  const box = useRef<HTMLDivElement>(null)

  const load = () => {
    if (cache) return
    getProducts({ published: true, limit: 300 }).then((p) => { cache = p; setProducts(p) }).catch(() => {})
  }

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const hits = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (t.length < 2) return []
    return products
      .filter((p) => `${p.name} ${p.category || ''} ${(p.tags || []).join(' ')}`.toLowerCase().includes(t))
      .slice(0, 6)
  }, [q, products])

  const go = (e: React.FormEvent) => {
    e.preventDefault()
    const t = q.trim()
    navigate(t ? `/shop?search=${encodeURIComponent(t)}` : '/shop')
    setOpen(false)
    onDone?.()
  }

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <form onSubmit={go} className="hd-search" role="search">
        <Search size={16} />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => { load(); setOpen(true) }}
          placeholder="Search for shirts, tees, jackets…"
          autoComplete="off"
          enterKeyHint="search"
        />
      </form>
      {open && q.trim().length >= 2 && (
        <div className="sugg">
          {hits.length === 0 ? (
            <div className="sugg-empty">No matches for “{q.trim()}”</div>
          ) : (
            hits.map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="sugg-row" onClick={() => { setOpen(false); setQ(''); onDone?.() }}>
                <span className="sugg-img">{imageOf(p) ? <img src={imageOf(p)} alt="" /> : null}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="sugg-name">{p.name}</span>
                  <span className="sugg-meta">{p.category || 'Product'}</span>
                </span>
                <span style={{ fontSize: '.85rem' }}>{inr(p.salePrice && p.salePrice < p.price ? p.salePrice : p.price)}</span>
              </Link>
            ))
          )}
          <button className="sugg-all" onMouseDown={(e) => e.preventDefault()} onClick={go}>See all results for “{q.trim()}”</button>
        </div>
      )}
    </div>
  )
}
