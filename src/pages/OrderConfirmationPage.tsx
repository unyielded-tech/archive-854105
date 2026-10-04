import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { MainLayout } from '@/layouts/MainLayout'
import { OrderView } from '@/components/OrderView'
import { trackOrder, LAST_ORDER_KEY, type StoreOrder } from '@/services/orders'
import '@/styles/store.css'

export function OrderConfirmationPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<StoreOrder | null>(null)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('')
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async (id: string, ph: string) => {
    setLoading(true)
    setError('')
    try { setOrder(await trackOrder(id, ph)); setVerifiedPhone(ph) } catch (e: any) { setError(e?.message || 'Could not load the order') } finally { setLoading(false) }
  }

  useEffect(() => {
    let saved: { orderId?: string; phone?: string } = {}
    try { saved = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || '{}') } catch { /* ignore */ }
    if (saved.orderId === orderId && saved.phone) load(orderId, saved.phone)
    else setLoading(false)
  }, [orderId])

  return (
    <MainLayout>
      <div className="st-wrap" style={{ maxWidth: 720, paddingBottom: 40 }}>
        <div style={{ textAlign: 'center', padding: '28px 0 14px' }}>
          <CheckCircle size={44} style={{ color: '#1a7f37' }} />
          <h1 className="st-page-title" style={{ marginTop: 8 }}>Thank you for your order</h1>
          <p className="st-sub">We have received your order and will confirm it shortly. You can pay in cash when it arrives.</p>
        </div>

        {loading ? (
          <div className="st-empty">Loading your order…</div>
        ) : order ? (
          <OrderView order={order} phone={verifiedPhone} onUpdated={setOrder} />
        ) : (
          <div className="sec-box">
            <p style={{ margin: '0 0 6px' }}>Your order number is <b style={{ fontWeight: 500 }}>{orderId}</b>. Save it to track your order.</p>
            <label className="st-label">Enter your phone number to see the details</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="st-input" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
              <button className="st-btn" onClick={() => load(orderId, phone)}>View</button>
            </div>
            {error && <p style={{ color: '#b3261e', fontSize: '.85rem', margin: '8px 0 0' }}>{error}</p>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 18 }}>
          <Link to="/shop" className="st-btn">Continue shopping</Link>
          <Link to="/track-order" className="st-btn ghost">Track an order</Link>
        </div>
      </div>
    </MainLayout>
  )
}
