import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminCustomers } from '@/services/api'
import { AdminShell } from '@/components/admin/AdminShell'

export function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdminCustomers()
        setCustomers(data.customers || [])
      } catch (e: any) {
        toast.error(e?.message || 'Could not load customers')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      [c.displayName, c.email, c.phoneNumber].some((v) => String(v || '').toLowerCase().includes(q))
    )
  }, [customers, search])

  return (
    <AdminShell title="Customers" subtitle={loading ? undefined : `${customers.length} in total`}>
      <input
        className="adm-in"
        type="search"
        placeholder="Search name, email or phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 18 }}
      />

      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="adm-empty">{customers.length === 0 ? 'No customers yet.' : 'Nothing matches your search.'}</div>
      ) : (
        <div>
          {shown.map((c) => (
            <div className="adm-row" key={c.id} style={{ display: 'block' }}>
              <p className="adm-name">{c.displayName || c.email || 'Customer'}</p>
              {c.displayName && c.email && <p className="adm-meta">{c.email}</p>}
              {c.phoneNumber && <p className="adm-meta">{c.phoneNumber}</p>}
              {c.createdAt && <p className="adm-meta">Joined {new Date(c.createdAt).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
