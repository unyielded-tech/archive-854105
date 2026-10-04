import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { AccountLayout } from '@/components/AccountLayout'
import { OrderView } from '@/components/OrderView'
import { getMyOrders, getMyOrder, type StoreOrder } from '@/services/orders'
import { inr } from '@/lib/format'
import { statusInfo, itemCount, IN_PROGRESS } from '@/lib/orderStatus'
import '@/styles/store.css'

// One order in a list: photo of the first item, names, status line and total.
export function OrderRow({ order }: { order: StoreOrder }) {
  const first = order.items[0]
  const info = statusInfo(order)
  const more = order.items.length - 1
  return (
    <Link to={`/account/orders/${order.orderId}`} className="orow">
      <div className="orow-img">
        {first?.image ? <img src={first.image} alt="" loading="lazy" /> : null}
        {more > 0 && <span className="orow-more">+{more}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="orow-name">{first?.name}{more > 0 ? ` and ${more} more` : ''}</div>
        <div className="st-sub" style={{ fontSize: '.76rem' }}>{[first?.size && `Size ${first.size}`, `${itemCount(order)} item${itemCount(order) === 1 ? '' : 's'}`, inr(order.total)].filter(Boolean).join(' · ')}</div>
        <div className={`ov-status ${info.tone}`}><i />{info.text}</div>
        <div className="st-sub" style={{ fontSize: '.7rem', marginTop: 2 }}>{order.orderId}</div>
      </div>
      <ChevronRight size={18} style={{ alignSelf: 'center', flex: 'none', color: 'var(--stone)' }} />
    </Link>
  )
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

function List() {
  const [orders, setOrders] = useState<StoreOrder[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    getMyOrders().then(setOrders).catch((e) => { setError(e?.message || 'Could not load your orders'); setOrders([]) })
  }, [])

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase()
    return (orders || []).filter((o) => {
      if (filter === 'active' && !IN_PROGRESS.includes(o.status)) return false
      if (filter === 'delivered' && o.status !== 'delivered') return false
      if (filter === 'cancelled' && !['cancelled', 'returned', 'refunded'].includes(o.status)) return false
      if (query && !(o.orderId.toLowerCase().includes(query) || o.items.some((i) => i.name.toLowerCase().includes(query)))) return false
      return true
    })
  }, [orders, filter, q])

  return (
    <div>
      <div className="hd-search" style={{ marginBottom: 10 }}>
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your orders" />
      </div>
      <div className="chips">
        {FILTERS.map((f) => <button key={f.key} className={`chip ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>)}
      </div>

      {orders === null ? (
        <div className="st-empty">Loading orders…</div>
      ) : shown.length === 0 ? (
        <div className="st-empty">
          {error || (orders.length === 0 ? 'You have not placed any orders yet.' : 'No orders match your search.')}
          {orders.length === 0 && !error && <div style={{ marginTop: 12 }}><Link to="/shop" className="st-btn">Start shopping</Link></div>}
        </div>
      ) : (
        shown.map((o) => <OrderRow key={o.orderId} order={o} />)
      )}
    </div>
  )
}

function Detail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<StoreOrder | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyOrder(orderId).then(setOrder).catch((e) => setError(e?.message || 'Could not load this order'))
  }, [orderId])

  if (error) return <div className="st-empty">{error}</div>
  if (!order) return <div className="st-empty">Loading order…</div>
  return <OrderView order={order} onUpdated={setOrder} />
}

export function AccountOrdersPage() {
  return <AccountLayout title="My orders" subtitle="Track, cancel or buy again.">{() => <List />}</AccountLayout>
}

export function AccountOrderDetailPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  return (
    <AccountLayout title="Order details">
      {() => (
        <div>
          <Link to="/account/orders" className="st-link" style={{ display: 'inline-block', marginBottom: 10 }}>← All orders</Link>
          <Detail orderId={orderId} />
        </div>
      )}
    </AccountLayout>
  )
}
