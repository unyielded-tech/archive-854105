import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MainLayout } from '@/layouts/MainLayout'
import { OrderView } from '@/components/OrderView'
import { watchCustomerAuth, logoutCustomer } from '@/services/customerAuth'
import type { CustomerUser as User } from '@/services/customerAuth'
import { getMyOrders, type StoreOrder } from '@/services/orders'
import { inr } from '@/lib/format'
import '@/styles/store.css'

export function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<StoreOrder[] | null>(null)
  const [open, setOpen] = useState('')

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    try {
      unsubscribe = watchCustomerAuth((next) => { setUser(next); setLoading(false) })
    } catch {
      setLoading(false)
    }
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    if (!user) { setOrders(null); return }
    getMyOrders().then(setOrders).catch(() => setOrders([]))
  }, [user?.uid])

  if (loading) return <MainLayout><div className="st-empty" style={{ minHeight: '50vh' }}>Loading…</div></MainLayout>

  if (!user) {
    return (
      <MainLayout>
        <div className="st-wrap st-empty" style={{ minHeight: '50vh' }}>
          <h1 className="st-page-title">Your account</h1>
          <p className="st-sub" style={{ margin: '6px 0 16px' }}>Sign in to see your orders and saved details.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="st-btn">Sign in</Link>
            <Link to="/track-order" className="st-btn ghost">Track an order</Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="st-wrap" style={{ maxWidth: 760, paddingTop: 16, paddingBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
          <div>
            <p className="st-sub" style={{ letterSpacing: '.2em', textTransform: 'uppercase', fontSize: '.68rem' }}>My account</p>
            <h1 className="st-page-title">{user.displayName || user.email}</h1>
            <p className="st-sub">{user.email}</p>
          </div>
          <button className="st-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={async () => { await logoutCustomer(); toast.success('Signed out') }}>Sign out</button>
        </div>

        <h2 className="st-title" style={{ marginBottom: 10 }}>My orders</h2>
        {orders === null ? (
          <div className="st-empty">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="st-empty">You have no orders yet. <Link to="/shop" style={{ textDecoration: 'underline' }}>Start shopping</Link></div>
        ) : (
          orders.map((o) => (
            <div key={o.orderId} className="sec-box">
              <button onClick={() => setOpen(open === o.orderId ? '' : o.orderId)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 0, textAlign: 'left', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                <span>
                  <b style={{ fontWeight: 500 }}>{o.orderId}</b>
                  <span className="st-sub" style={{ display: 'block', fontSize: '.78rem' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')} · {o.items.length} item{o.items.length === 1 ? '' : 's'} · {inr(o.total)}</span>
                </span>
                <span className="pill">{o.status.replace('_', ' ')}</span>
              </button>
              {open === o.orderId && <div style={{ marginTop: 12 }}><OrderView order={o} /></div>}
            </div>
          ))
        )}
      </div>
    </MainLayout>
  )
}
