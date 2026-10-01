import { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { getDashboardStats } from '@/services/api'
import { BarChart, TrendingUp, Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react'

export function AdminDashboard() {
  const user = useAdminStore((state) => state.user)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white border-b border-soft-grey sticky top-0 z-10">
        <div className="container py-6 flex justify-between items-center">
          <div>
            <h1 className="text-h2 font-display">Dashboard</h1>
            <p className="text-body-sm text-medium-grey">Welcome, {user?.displayName}</p>
          </div>
          <div className="text-right">
            <p className="text-body-sm text-medium-grey">Role: <span className="font-semibold capitalize">{user?.role}</span></p>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {loading ? (
          <div className="text-center py-20"><p className="text-body-lg text-medium-grey">Loading...</p></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard title="Total Revenue" value={stats?.totalRevenue || 0} icon={TrendingUp} format="currency" />
              <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingCart} />
              <StatCard title="Total Customers" value={stats?.totalCustomers || 0} icon={Users} />
              <StatCard title="Total Products" value={stats?.totalProducts || 0} icon={Package} />
            </div>

            {/* Charts & Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Recent Orders */}
              <div className="bg-white p-6 rounded-md border border-soft-grey">
                <h2 className="text-h5 font-semibold mb-6">Recent Orders</h2>
                <div className="space-y-4">
                  {(stats?.recentOrders || []).slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex justify-between items-center pb-4 border-b border-soft-grey last:border-b-0">
                      <div>
                        <p className="text-sm font-semibold">{order.orderId}</p>
                        <p className="text-xs text-medium-grey">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₹{order.total}</p>
                        <p className="text-xs uppercase tracking-wider text-charcoal">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Stock */}
              <div className="bg-white p-6 rounded-md border border-soft-grey">
                <h2 className="text-h5 font-semibold mb-6 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-warning" />
                  Low Stock Alerts
                </h2>
                <div className="space-y-4">
                  {(stats?.lowStockProducts || []).slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex justify-between items-center pb-4 border-b border-soft-grey last:border-b-0">
                      <div>
                        <p className="text-sm font-semibold">{product.name}</p>
                        <p className="text-xs text-medium-grey">SKU: {product.sku}</p>
                      </div>
                      <p className={`text-sm font-semibold ${product.stock === 0 ? 'text-error' : 'text-warning'}`}>
                        {product.stock} left
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-md border border-soft-grey">
              <h2 className="text-h5 font-semibold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <a href="/admin/products" className="p-4 bg-off-white rounded-md hover:bg-soft-grey transition text-center">
                  <Package size={24} className="mx-auto mb-2" />
                  <p className="text-sm font-semibold">Manage Products</p>
                </a>
                <a href="/admin/orders" className="p-4 bg-off-white rounded-md hover:bg-soft-grey transition text-center">
                  <ShoppingCart size={24} className="mx-auto mb-2" />
                  <p className="text-sm font-semibold">View Orders</p>
                </a>
                <a href="/admin/customers" className="p-4 bg-off-white rounded-md hover:bg-soft-grey transition text-center">
                  <Users size={24} className="mx-auto mb-2" />
                  <p className="text-sm font-semibold">Manage Customers</p>
                </a>
                <a href="/admin/inventory" className="p-4 bg-off-white rounded-md hover:bg-soft-grey transition text-center">
                  <BarChart size={24} className="mx-auto mb-2" />
                  <p className="text-sm font-semibold">Check Inventory</p>
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, format = 'number' }: any) {
  const formatted = format === 'currency' ? `₹${value.toLocaleString()}` : value.toLocaleString()
  return (
    <div className="bg-white p-6 rounded-md border border-soft-grey">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-body-sm text-medium-grey uppercase tracking-wider">{title}</p>
          <p className="text-h4 font-semibold mt-2">{formatted}</p>
        </div>
        <Icon className="text-medium-grey" size={24} />
      </div>
    </div>
  )
}
