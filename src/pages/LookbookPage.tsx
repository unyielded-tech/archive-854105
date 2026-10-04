import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { getLookbooks } from '@/services/firestore'
import type { Lookbook } from '@/types'
import '@/styles/store.css'

export function LookbookPage() {
  const [books, setBooks] = useState<Lookbook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLookbooks().then(setBooks).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <MainLayout>
      <div className="st-wrap" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1 className="st-page-title">Lookbook</h1>
        <p className="st-sub" style={{ marginBottom: 14 }}>See how ARCHIVE 854105 is worn.</p>
        {loading ? (
          <div className="st-empty">Loading…</div>
        ) : books.length === 0 ? (
          <div className="st-empty">
            <p>Our first lookbook is on its way.</p>
            <Link to="/shop" className="st-btn" style={{ marginTop: 12 }}>Shop the latest</Link>
          </div>
        ) : (
          books.map((b) => (
            <section key={b.id} className="st-sec">
              <h2 className="st-title">{b.title}</h2>
              {b.description && <p className="st-sub" style={{ margin: '4px 0 10px' }}>{b.description}</p>}
              <div className="pgrid">
                {[...(b.images || [])].sort((x, y) => x.order - y.order).map((img) => (
                  <div key={img.id} className="pcard">
                    <div className="pcard-img"><img src={img.url} alt={img.caption || ''} loading="lazy" /></div>
                    {img.caption && <div className="pcard-body"><div className="pcard-name" style={{ minHeight: 0, margin: 0 }}>{img.caption}</div></div>}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </MainLayout>
  )
}
