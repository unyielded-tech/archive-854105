import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { OrderView } from '@/components/OrderView'
import { trackOrder, type StoreOrder } from '@/services/orders'
import '@/styles/store.css'
import { useSeo } from '@/lib/seo'

export function TrackOrderPage() {
  useSeo({ title: 'Track your order', noindex: true })
  const params = useParams<{ orderId: string }>()
  const [orderId, setOrderId] = useState(params.orderId || '')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState<StoreOrder | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setOrder(null)
    try { setOrder(await trackOrder(orderId, phone)) } catch (err: any) { setError(err?.message || 'Could not find the order') } finally { setBusy(false) }
  }

  return (
    <MainLayout>
      <div className="st-wrap" style={{ maxWidth: 720, paddingTop: 16, paddingBottom: 40 }}>
        <h1 className="st-page-title">Track your order</h1>
        <p className="st-sub">Enter the order number from your confirmation and the phone number you used.</p>

        <form onSubmit={submit} className="sec-box" style={{ marginTop: 14 }}>
          <label className="st-label" style={{ marginTop: 0 }}>Order number</label>
          <input className="st-input" value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())} placeholder="ARC-241004-AB12" />
          <label className="st-label">Phone number</label>
          <input className="st-input" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
          <button className="st-btn block" style={{ marginTop: 14 }} disabled={busy || !orderId || !phone}>{busy ? 'Checking…' : 'Track order'}</button>
          {error && <p style={{ color: '#b3261e', fontSize: '.85rem', margin: '10px 0 0' }}>{error}</p>}
        </form>

        {order && <OrderView order={order} phone={phone} onUpdated={setOrder} />}
      </div>
    </MainLayout>
  )
}
