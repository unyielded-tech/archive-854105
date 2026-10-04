import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminOrders, updateOrderStatus } from '@/services/api'
import { AdminShell } from '@/components/admin/AdminShell'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const money = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

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

  const changeStatus = async (o: any, next: string) => {
    const prev = o.status
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status: next } : x)))
    try {
      await updateOrderStatus(o.id, next)
      toast.success('Order updated')
    } catch (e: any) {
      setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status: prev } : x)))
      toast.error(e?.message || 'Could not update order')
    }
  }

  return (
    <AdminShell title="Orders">
      <select className="adm-in" value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 18 }}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{cap(s)}</option>
        ))}
      </select>

      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="adm-empty">No orders found.</div>
      ) : (
        <div>
          {orders.map((o) => (
            <div className="adm-row" key={o.id} style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <p className="adm-name">{o.orderId || o.id}</p>
                <p className="adm-name">{money(o.total)}</p>
              </div>
              <p className="adm-meta">
                {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}
                {Array.isArray(o.items) ? ` · ${o.items.length} item${o.items.length === 1 ? '' : 's'}` : ''}
                {o.paymentStatus ? ` · payment ${o.paymentStatus}` : ''}
              </p>
              {(o.customer?.displayName || o.customer?.email) && (
                <p className="adm-meta">{o.customer.displayName || o.customer.email}</p>
              )}
              <select
                className="adm-in"
                style={{ marginTop: 10 }}
                value={o.status}
                onChange={(e) => changeStatus(o, e.target.value)}
                aria-label="Order status"
              >
                {!STATUSES.includes(o.status) && <option value={o.status}>{cap(String(o.status || 'unknown'))}</option>}
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{cap(s)}</option>
                ))}
              </select>
            </div>
          ))}
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
