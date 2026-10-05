import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Copy, Printer, MessageCircle } from 'lucide-react'
import { inr } from '@/lib/format'
import { media } from '@/config/media'
import { cancelOrder, retryPayment, verifyPayment, type StoreOrder } from '@/services/orders'
import { openRazorpay } from '@/lib/razorpay'
import { CANCELLABLE, statusInfo, stageTime, shortDate, dateTime } from '@/lib/orderStatus'
import '@/styles/store.css'

const REASONS = ['Ordered by mistake', 'Found a better price', 'Need a different size', 'Delivery is taking too long', 'Other']

type Step = { label: string; time: string; done: boolean }

function stepsFor(o: StoreOrder): Step[] {
  const placed: Step = { label: 'Order placed', time: o.createdAt, done: true }
  if (o.status === 'cancelled') return [placed, { label: 'Cancelled', time: stageTime(o, 'cancelled'), done: true }]
  const idx = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'].indexOf(o.status)
  const rank = idx < 0 ? 0 : idx <= 0 ? 0 : idx <= 3 ? 1 : idx === 4 ? 2 : 3
  return [
    placed,
    { label: 'Confirmed', time: stageTime(o, 'confirmed', 'processing', 'packed'), done: rank >= 1 },
    { label: 'Shipped', time: stageTime(o, 'shipped'), done: rank >= 2 },
    { label: 'Delivered', time: stageTime(o, 'delivered'), done: rank >= 3 },
  ]
}

// Order details in the style of a marketplace: status, tracker, items, price details, actions.
export function OrderView({ order, phone, onUpdated }: { order: StoreOrder; phone?: string; onUpdated?: (o: StoreOrder) => void }) {
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [busy, setBusy] = useState(false)

  const info = statusInfo(order)
  const steps = stepsFor(order)
  const canCancel = CANCELLABLE.includes(order.status)
  const itemsTotal = order.items.reduce((n, i) => n + i.quantity, 0)
  const help = `https://wa.me/${media.whatsapp}?text=${encodeURIComponent(`Hello ARCHIVE 854105, I need help with order ${order.orderId}.`)}`
  const returnMsg = `https://wa.me/${media.whatsapp}?text=${encodeURIComponent(`Hello ARCHIVE 854105, I want to return/exchange an item from order ${order.orderId}.`)}`

  const needsPayment = order.paymentMethod === 'razorpay' && order.paymentStatus !== 'completed' && order.status !== 'cancelled'
  const payNow = async () => {
    setBusy(true)
    try {
      const { razorpay } = await retryPayment(order.orderId, phone)
      const result = await openRazorpay(razorpay, { name: order.customer.name, phone: order.customer.phone, email: order.customer.email, description: `Order ${order.orderId}` })
      if (!result) { toast('Payment not completed'); return }
      const updated = await verifyPayment({ orderId: order.orderId, ...result })
      toast.success('Payment received')
      onUpdated?.(updated)
    } catch (e: any) {
      toast.error(e?.message || 'Could not complete the payment')
    } finally {
      setBusy(false)
    }
  }

  const doCancel = async () => {
    setBusy(true)
    try {
      const updated = await cancelOrder(order.orderId, { phone, reason })
      toast.success('Order cancelled')
      setCancelling(false)
      onUpdated?.(updated)
    } catch (e: any) {
      toast.error(e?.message || 'Could not cancel the order')
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(order.orderId); toast.success('Order number copied') } catch { toast.error('Could not copy') }
  }

  return (
    <div className="ov">
      {/* Status */}
      <div className="sec-box">
        <div className={`ov-status ${info.tone}`}><i />{info.text}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          <span className="st-sub">Order <b style={{ fontWeight: 500, color: 'var(--ink)' }}>{order.orderId}</b></span>
          <button className="ov-icon" onClick={copy} aria-label="Copy order number"><Copy size={14} /></button>
        </div>
        <div className="st-sub" style={{ fontSize: '.78rem' }}>Placed on {shortDate(order.createdAt)}</div>
        {order.trackingNumber && <div className="st-sub" style={{ marginTop: 4 }}>Tracking ID: <b style={{ fontWeight: 500, color: 'var(--ink)' }}>{order.trackingNumber}</b></div>}
        {order.cancelReason && <div className="st-sub" style={{ marginTop: 4 }}>Reason: {order.cancelReason}</div>}

        <div className="tl">
          {steps.map((s, i) => (
            <div key={s.label} className={`tl-row ${s.done ? 'done' : ''} ${order.status === 'cancelled' && i === steps.length - 1 ? 'bad' : ''}`}>
              <i />
              <div>
                <div className="tl-label">{s.label}</div>
                {s.time ? <div className="tl-time">{dateTime(s.time)}</div> : !s.done ? <div className="tl-time">Pending</div> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="sec-box">
        <h2>{itemsTotal} item{itemsTotal === 1 ? '' : 's'}</h2>
        {order.items.map((it) => (
          <div className="ov-item" key={it.id}>
            <div className="line-img" style={{ width: 62, height: 78 }}>{it.image ? <img src={it.image} alt="" /> : null}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.9rem', lineHeight: 1.3 }}>{it.name}</div>
              <div className="st-sub" style={{ fontSize: '.76rem', margin: '2px 0 4px' }}>{[it.size && `Size ${it.size}`, it.color, `Qty ${it.quantity}`].filter(Boolean).join(' · ')}</div>
              <div style={{ fontWeight: 500 }}>{inr(it.total)}</div>
              {it.slug && <Link to={`/product/${it.slug}`} className="st-link" style={{ display: 'inline-block', marginTop: 6 }}>Buy again</Link>}
            </div>
          </div>
        ))}
      </div>

      {/* Price details */}
      <div className="sec-box">
        <h2>Price details</h2>
        <div className="sum-row"><span>Price ({itemsTotal} item{itemsTotal === 1 ? '' : 's'})</span><span>{inr(order.subtotal)}</span></div>
        {order.discount > 0 && <div className="sum-row green"><span>Discount</span><span>−{inr(order.discount)}</span></div>}
        <div className="sum-row"><span>Delivery charges</span><span>{order.shipping === 0 ? 'Free' : inr(order.shipping)}</span></div>
        <div className="sum-row total"><span>Total amount</span><span>{inr(order.total)}</span></div>
        <p className="st-sub" style={{ margin: '8px 0 0', fontSize: '.78rem' }}>
          Payment: {order.paymentMethod === 'cod' ? 'Cash on delivery — pay when it arrives' : order.paymentStatus === 'completed' ? 'Paid online' : 'Online payment pending'}
        </p>
      </div>

      {/* Address */}
      <div className="sec-box">
        <h2>Delivery details</h2>
        <p style={{ margin: 0, fontSize: '.9rem', lineHeight: 1.6 }}>
          <b style={{ fontWeight: 500 }}>{order.address.fullName}</b><br />
          {order.address.street}{order.address.landmark ? `, ${order.address.landmark}` : ''}<br />
          {order.address.city}, {order.address.state} {order.address.pincode}<br />
          Phone: {order.address.phoneNumber}
        </p>
        <p className="st-sub" style={{ margin: '8px 0 0', fontSize: '.78rem' }}>{order.shippingMethod === 'express' ? 'Express' : 'Standard'} delivery</p>
      </div>

      {/* Actions */}
      <div className="sec-box">
        <h2>Need something?</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {needsPayment && <button className="st-btn block" onClick={payNow} disabled={busy}>{busy ? 'Please wait…' : `Pay ${inr(order.total)} now`}</button>}
          {canCancel && !cancelling && <button className="st-btn ghost block" onClick={() => setCancelling(true)}>Cancel order</button>}
          {cancelling && (
            <div className="ov-cancel">
              <label className="st-label" style={{ marginTop: 0 }}>Why are you cancelling?</label>
              <select className="st-select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <div className="st-two" style={{ marginTop: 10 }}>
                <button className="st-btn ghost" onClick={() => setCancelling(false)} disabled={busy}>Keep order</button>
                <button className="st-btn" onClick={doCancel} disabled={busy}>{busy ? 'Cancelling…' : 'Confirm cancel'}</button>
              </div>
            </div>
          )}
          {order.status === 'delivered' && <a className="st-btn ghost block" href={returnMsg} target="_blank" rel="noreferrer">Return or exchange</a>}
          <a className="st-btn ghost block" href={help} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Chat with us</a>
          {order.status !== 'cancelled' && <button className="st-btn ghost block" onClick={() => window.print()}><Printer size={15} /> Download invoice</button>}
        </div>
        {!canCancel && order.status === 'shipped' && <p className="st-sub" style={{ fontSize: '.76rem', margin: '10px 0 0' }}>Shipped orders can&apos;t be cancelled online. Chat with us if you need help.</p>}
      </div>

      {/* Printable invoice (hidden on screen) */}
      <div className="invoice">
        <h1>ARCHIVE 854105</h1>
        <p>{media.address} · {media.phone}</p>
        <h2>Invoice — {order.orderId}</h2>
        <p>Date: {shortDate(order.createdAt)}</p>
        <p>Bill to: {order.address.fullName}, {order.address.street}, {order.address.city}, {order.address.state} {order.address.pincode} · {order.address.phoneNumber}</p>
        <table>
          <thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
          <tbody>
            {order.items.map((i) => (<tr key={i.id}><td>{i.name}</td><td>{i.size}</td><td>{i.quantity}</td><td>{inr(i.price)}</td><td>{inr(i.total)}</td></tr>))}
          </tbody>
        </table>
        <p>Subtotal: {inr(order.subtotal)}{order.discount > 0 ? ` · Discount: −${inr(order.discount)}` : ''} · Delivery: {order.shipping === 0 ? 'Free' : inr(order.shipping)}</p>
        <p><b>Total: {inr(order.total)}</b> ({order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentStatus === 'completed' ? 'Paid online' : 'Online payment pending'})</p>
      </div>
    </div>
  )
}
