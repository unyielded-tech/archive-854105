import { Link } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { useSeo } from '@/lib/seo'
import '@/styles/store.css'

export function NotFoundPage() {
  useSeo({ title: 'Page not found', noindex: true })
  return (
    <MainLayout>
      <div className="st-wrap st-empty" style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '5rem', lineHeight: 1 }}>404</div>
        <h1 className="st-page-title" style={{ margin: '6px 0' }}>Page not found</h1>
        <p className="st-sub" style={{ marginBottom: 18 }}>The page you are looking for has moved or does not exist.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" className="st-btn">Go home</Link>
          <Link to="/shop" className="st-btn ghost">Shop all</Link>
        </div>
      </div>
    </MainLayout>
  )
}
