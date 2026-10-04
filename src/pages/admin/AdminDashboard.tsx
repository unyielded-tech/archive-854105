import { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { getDashboardStats } from '@/services/api'
import { AdminShell } from '@/components/admin/AdminShell'

const money = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export function AdminDashboard() {
  const user = useAdminStore((s) => s.user)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStats(await getDashboardStats())
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        setFailed(true)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <AdminShell title="Overview" subtitle={user?.email}>
      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : failed ? (
        <div className="adm-empty">Could not load the overview. Please try again.</div>
      ) : (
        <>
          <div className="adm-stats">
            <div className="adm-stat"><small>Revenue</small><b>{money(stats?.totalRevenue)}</b></div>
            <div className="adm-stat"><small>Orders</small><b>{stats?.totalOrders || 0}</b></div>
            <div className="adm-stat"><small>Customers</small><b>{stats?.totalCustomers || 0}</b></div>
            <div className="adm-stat"><small>Products</small><b>{stats?.totalProducts || 0}</b></div>
          </div>

          <section className="adm-section">
            <h2>Recent orders</h2>
            {(stats?.recentOrders || []).length === 0 ? (
              <p className="adm-meta" style={{ padding: '14px 0' }}>No paid orders yet.</p>
            ) : (
              (stats.recentOrders as any[]).slice(0, 5).map((o) => (
                <div className="adm-line" key={o.id}>
                  <div>
                    <div className="serif">{o.orderId || o.id}</div>
                    <div className="adm-meta">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{money(o.total)}</div>
                    <div className="adm-meta" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11 }}>{o.status}</div>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="adm-section">
            <h2>Low stock</h2>
            {(stats?.lowStockProducts || []).length === 0 ? (
              <p className="adm-meta" style={{ padding: '14px 0' }}>Everything is well stocked.</p>
            ) : (
              (stats.lowStockProducts as any[]).slice(0, 5).map((p) => (
                <div className="adm-line" key={p.id}>
                  <div className="serif">{p.name}</div>
                  <div>{p.stock ?? 0} left</div>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </AdminShell>
  )
}
