import { useEffect, useState } from 'react'
import { getAdminOrders } from '@/services/api'
import type { Order, OrderStatus } from '@/types'
import { Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const orderStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadOrders()
  }, [page, statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await getAdminOrders({ 
        page, 
        status: statusFilter || undefined 
      })
      setOrders(data.orders)
    } catch (error) {
      toast.error('Failed to load orders')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-off-white">
      <div className="bg-white border-b border-soft-grey sticky top-0 z-10">
        <div className="container py-6">
          <h1 className="text-h2 font-display">Orders</h1>
        </div>
      </div>

      <div className="container py-12">
        {/* Filters */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-medium-grey" size={18} />
            <input
              type="text"
              placeholder="Search by order ID..."
              className="w-full pl-10 pr-4 py-2 border border-medium-grey rounded-md"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ''); setPage(1) }}
            className="px-4 py-2 border border-medium-grey rounded-md text-sm"
          >
            <option value="">All Statuses</option>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20"><p className="text-medium-grey">Loading...</p></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20"><p className="text-medium-grey">No orders found</p></div>
        ) : (
          <>
            <div className="bg-white rounded-md border border-soft-grey overflow-hidden">
              <table className="w-full">
                <thead className="bg-off-white border-b border-soft-grey">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-soft-grey hover:bg-off-white transition">
                      <td className="px-6 py-4 text-sm font-semibold">{order.orderId}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-semibold">{order.customer?.displayName || 'N/A'}</p>
                          <p className="text-xs text-medium-grey">{order.customer?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-medium-grey">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">₹{order.total}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider
                          ${order.status === 'delivered' ? 'bg-success text-white' : ''}
                          ${order.status === 'shipped' ? 'bg-blue-100 text-blue-900' : ''}
                          ${order.status === 'cancelled' ? 'bg-error text-white' : ''}
                          ${['pending', 'confirmed', 'processing'].includes(order.status) ? 'bg-yellow-100 text-yellow-900' : ''}
                        `}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${order.paymentStatus === 'completed' ? 'bg-success text-white' : 'bg-soft-grey'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a href={`/admin/orders/${order.id}`} className="text-sm hover:underline font-semibold">
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn btn-secondary disabled:opacity-50">
                Previous
              </button>
              <span className="px-4 py-2">Page {page}</span>
              <button onClick={() => setPage(page + 1)} className="btn btn-secondary">
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
