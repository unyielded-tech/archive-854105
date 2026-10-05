import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminOrders, updateOrder, getAllOrders } from '@/services/api'
import { AdminShell } from '@/components/admin/AdminShell'

const STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded']
const FILTERS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]
const label = (s: string) => String(s || '').replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())
const money = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const digits = (v: any) => String(v || '').replace(/\D/g, '').slice(-10)

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState('')
  const [tracking, setTracking] = useState<Record<string, string>>({})

  const exportCsv = async () => {
    try {
      toast('Preparing the file…')
      const all = await getAllOrders()
      const q = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const head = ['Order', 'Date', 'Customer', 'Phone', 'Email', 'Address', 'Items', 'Subtotal', 'Discount', 'Delivery', 'Total', 'Payment', 'Paid', 'Status', 'Tracking']
      const rows = all.map((o) => [
        o.orderId, o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '', o.customer?.name, o.customer?.phone, o.customer?.email,
        [o.address?.street, o.address?.landmark, o.address?.city, o.address?.state, o.address?.pincode].filter(Boolean).join(', '),
        (o.items || []).map((i: any) => `${i.name}${i.size ? ' (' + i.size + ')' : ''} x${i.quantity}`).join('; '),
        o.subtotal, o.discount || 0, o.shipping || 0, o.total, o.paymentMethod === 'cod' ? 'COD' : 'Online', o.paymentStatus === 'completed' ? 'Yes' : 'No', o.status, o.trackingNumber || '',
      ].map(q).join(','))
      const blob = new Blob(['\ufeff' + [head.map(q).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `archive-orders-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a); a.click(); a.remove()
      toast.success(`${all.length} orders exported`)
    } catch (e: any) { toast.error(e?.message || 'Could not export orders') }
  }

  const fetchPage = useCallback(async (p: number, st: string, append: boolean) => {
    try {
      append ? setMore(true) : setLoading(true)
      const data: any = await getAdminOrders({ page: p, status: st || undefined })
      setOrders((cur) => (append ? [...cur, ...(data.orders || [])] : data.orders || []))
      setHasMore(!!data.hasMore)
      setPage(p)
    } catch (e: any) {
      toast.error(e?.message || 'Could not load orders')
    } finally {
      setLoading(false)
      setMore(false)
    }
  }, [])

  useEffect(() => {
    fetchPage(1, status, false)
  }, [status, fetchPage])

  const patch = async (o: any, changes: Record<string, unknown>, ok: string) => {
    try {
      await updateOrder(o.id, changes)
      setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, ...changes } : x)))
      toast.success(ok)
    } catch (e: any) {
      toast.error(e?.message || 'Could not update the order')
    }
  }

  const changeStatus = (o: any, next: string) => {
    if (next === o.status) return
    if (next === 'cancelled' && !window.confirm('Cancel this order? Stock will be added back.')) return
    patch(o, { status: next, ...(next === 'delivered' && o.paymentMethod === 'cod' ? { paymentStatus: 'completed' } : {}) }, 'Order updated')
  }

  return (
    <AdminShell title="Orders" subtitle="Tap an order to see details">
      <div className="adm-chips" style={{ marginBottom: 6 }}>
        {FILTERS.map((f) => (
          <button key={f.key} className={`adm-chip ${status === f.key ? 'on' : ''}`} onClick={() => setStatus(f.key)}>{f.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 22 }}>
        <button className="adm-text" onClick={() => fetchPage(1, status, false)}>Refresh</button>
        <button className="adm-text" onClick={exportCsv}>Export CSV</button>
      </div>

      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="adm-empty">No orders yet. New orders from the shop will appear here.</div>
      ) : (
        <div>
          {orders.map((o) => {
            const isOpen = open === o.id
            const phone = digits(o.customer?.phone || o.address?.phoneNumber)
            const items: any[] = Array.isArray(o.items) ? o.items : []
            const msg = `Hello ${o.customer?.name || ''}, this is ARCHIVE 854105 about your order ${o.orderId}.`
            return (
              <div className="adm-row" key={o.id} style={{ display: 'block' }}>
                <button onClick={() => setOpen(isOpen ? '' : o.id)} style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <p className="adm-name">{o.orderId || o.id}</p>
                    <p className="adm-name">{money(o.total)}</p>
                  </div>
                  <p className="adm-meta">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}
                    {` · ${items.length} item${items.length === 1 ? '' : 's'}`}
                    {o.customer?.name ? ` · ${o.customer.name}` : ''}
                  </p>
                  <p style={{ margin: '6px 0 0' }}>
                    <span className={`adm-tag ${o.status === 'pending' ? '' : 'dim'}`}>{o.status === 'pending' ? 'New' : label(o.status)}</span>{' '}
                    <span className="adm-tag dim">{o.paymentStatus === 'completed' ? 'Paid' : o.paymentMethod === 'cod' ? 'COD · unpaid' : 'Online · unpaid'}</span>
                  </p>
                </button>

                {isOpen && (
                  <div style={{ marginTop: 14 }}>
                    {items.map((it, i) => (
                      <div key={it.id || i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                        {it.image ? <img className="adm-thumb" style={{ width: 48, height: 58 }} src={it.image} alt="" /> : <div className="adm-thumb" style={{ width: 48, height: 58 }} />}
                        <div className="adm-grow">
                          <div>{it.name}</div>
                          <div className="adm-meta">{[it.size && `Size ${it.size}`, it.color, `Qty ${it.quantity}`].filter(Boolean).join(' · ')}</div>
                        </div>
                        <div>{money(it.total ?? it.price * it.quantity)}</div>
                      </div>
                    ))}

                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8, fontSize: 14 }}>
                      <div className="adm-line" style={{ padding: '4px 0', border: 0 }}><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
                      {o.discount > 0 && <div className="adm-line" style={{ padding: '4px 0', border: 0 }}><span>Discount {o.couponCode ? `(${o.couponCode})` : ''}</span><span>−{money(o.discount)}</span></div>}
                      <div className="adm-line" style={{ padding: '4px 0', border: 0 }}><span>Delivery ({o.shippingMethod || 'standard'})</span><span>{o.shipping ? money(o.shipping) : 'Free'}</span></div>
                      <div className="adm-line" style={{ padding: '4px 0', border: 0 }}><b>Total to collect</b><b>{money(o.total)}</b></div>
                    </div>

                    {o.cancelReason && <p className="adm-meta" style={{ marginTop: 10 }}>Cancelled by customer: {o.cancelReason}</p>}

                    <label className="adm-label">Deliver to</label>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>
                      {o.address?.fullName || o.customer?.name}<br />
                      {o.address?.street}{o.address?.landmark ? `, ${o.address.landmark}` : ''}<br />
                      {o.address?.city}, {o.address?.state} {o.address?.pincode}<br />
                      {phone && <>Phone: {phone}</>}
                    </p>
                    {phone && (
                      <div className="adm-two" style={{ marginTop: 10 }}>
                        <a className="adm-btn ghost" style={{ textDecoration: 'none' }} href={`tel:+91${phone}`}>Call</a>
                        <a className="adm-btn ghost" style={{ textDecoration: 'none' }} href={`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                      </div>
                    )}

                    <label className="adm-label">Order status</label>
                    <select className="adm-in" value={o.status} onChange={(e) => changeStatus(o, e.target.value)}>
                      {!STATUSES.includes(o.status) && <option value={o.status}>{label(o.status)}</option>}
                      {STATUSES.map((s) => <option key={s} value={s}>{s === 'pending' ? 'New (pending)' : label(s)}</option>)}
                    </select>

                    <label className="adm-label">Tracking number (optional)</label>
                    <div className="adm-imgrow">
                      <input className="adm-in" value={tracking[o.id] ?? o.trackingNumber ?? ''} onChange={(e) => setTracking((t) => ({ ...t, [o.id]: e.target.value }))} placeholder="Courier tracking ID" />
                      <button className="adm-btn ghost" onClick={() => patch(o, { trackingNumber: tracking[o.id] ?? '' }, 'Tracking saved')}>Save</button>
                    </div>

                    {o.paymentStatus !== 'completed' && o.status !== 'cancelled' && (
                      <button className="adm-btn ghost block" style={{ marginTop: 14 }} onClick={() => patch(o, { paymentStatus: 'completed' }, 'Marked as paid')}>Mark as paid</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {hasMore && (
            <button className="adm-btn ghost block" style={{ marginTop: 18 }} disabled={more} onClick={() => fetchPage(page + 1, status, true)}>
              {more ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </AdminShell>
  )
}
