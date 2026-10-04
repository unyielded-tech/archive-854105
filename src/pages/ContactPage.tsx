import { MainLayout } from '@/layouts/MainLayout'
import { StoreMap, ContactBlock } from '@/components/StoreMap'
import '@/styles/store.css'

export function ContactPage() {
  return (
    <MainLayout>
      <div className="st-wrap" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1 className="st-page-title">Visit us</h1>
        <p className="st-sub" style={{ marginBottom: 14 }}>Come and try the pieces in person. We are right in front of City Kart.</p>
        <div style={{ display: 'grid', gap: 18 }}>
          <ContactBlock />
          <StoreMap height={380} />
        </div>
      </div>
    </MainLayout>
  )
}
