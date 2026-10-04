import { Link } from 'react-router-dom'
import { inr } from '@/lib/format'
import type { StoreOrder } from '@/services/orders'
import '@/styles/store.css'

const FLOW = ['pending', 'confirmed', 'shipped', 'delivered']
const LABEL: Record<string, string> = { pending: 'Placed', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' }
const stage = (s: string) => {
  if (s === 'processing' || s === 'packed') return 1
  const i = FLOW.indexOf(s)
  return i === -1 ? (s === 'cancelled' ? -1 : 0) : i
}

export function OrderView({ order }: { order: StoreOrder }) {
  const at = stage(order.status)
  const cancelled = order.status === 'cancelled' || order.status === 'returned' || order.status === 'refunded'

  return (
    <div>
      <div className="sec-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div>
            <div className="st-sub" style={{ fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase' }}>Order number</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 500 }}>{order.orderId}</div>
          </div>
          <span className={`pill ${cancelled ? 'dim' : ''}`}>{order.status.replace('_', ' ')}</span>
        </div>
        <div className="st-sub" style={{ marginTop: 6 }}>Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>

        {!cancelled && (
          <div className="steps">
            {FLOW.map((s, i) => (
              <div key={s} className={`step ${i <= at ? 'done' : ''}`}><i />{LABEL[s]}</div>
            ))}
          </div>
        )}
        {order.trackingNumber && <p className="st-sub" style={{ marginTop: 8 }}>Tracking number: <b style={{ fontWeight: 500, color: 'var(--ink)' }}>{order.trackingNumber}</b></p>}
      </div>

      <div className="sec-box">
        <h2>Items</h2>
        {order.items.map((it) => (
          <div className="line" key={it.id} style={{ border: 0, borderBottom: '1px solid var(--line)', marginBottom: 0, padding: '10px 0' }}>
            <div className="line-img" style={{ width: 56, height: 70 }}>{it.image ? <img src={it.image} alt="" /> : null}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {it.slug ? <Link to={`/product/${it.slug}`} style={{ fontSize: '.9rem' }}>{it.name}</Link> : <span style={{ fontSize: '.9rem' }}>{it.name}</span>}
              <div className="st-sub" style={{ fontSize: '.78rem' }}>{[it.size && `Size ${it.size}`, it.color, `Qty ${it.quantity}`].filter(Boolean).join(' · ')}</div>
            </div>
            <div style={{ fontSize: '.9rem' }}>{inr(it.total)}</div>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <div className="sum-row"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="sum-row green"><span>Discount</span><span>−{inr(order.discount)}</span></div>}
          <div className="sum-row"><span>Delivery</span><span>{order.shipping === 0 ? 'Free' : inr(order.shipping)}</span></div>
          <div className="sum-row total"><span>Total</span><span>{inr(order.total)}</span></div>
        </div>
      </div>

      <div className="sec-box">
        <h2>Delivery address</h2>
        <p style={{ margin: 0, fontSize: '.9rem', lineHeight: 1.6 }}>
          {order.address.fullName}<br />
          {order.address.street}{order.address.landmark ? `, ${order.address.landmark}` : ''}<br />
          {order.address.city}, {order.address.state} {order.address.pincode}<br />
          Phone: {order.address.phoneNumber}
        </p>
        <p className="st-sub" style={{ margin: '10px 0 0' }}>
          Payment: {order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod} ({order.paymentStatus === 'completed' ? 'paid' : 'pay on delivery'})
          {' · '}{order.shippingMethod === 'express' ? 'Express' : 'Standard'} delivery
        </p>
      </div>
    </div>
  )
}
