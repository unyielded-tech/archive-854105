import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'

export function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(false)
    // TODO: Implement customer loading
  }, [search])

  return (
    <div className="min-h-screen bg-off-white">
      <div className="bg-white border-b border-soft-grey sticky top-0 z-10">
        <div className="container py-6">
          <h1 className="text-h2 font-display">Customers</h1>
        </div>
      </div>

      <div className="container py-12">
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-medium-grey" size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-medium-grey rounded-md"
            />
          </div>
        </div>

        <div className="bg-white rounded-md border border-soft-grey p-8 text-center">
          <p className="text-medium-grey">Customers feature coming soon</p>
        </div>
      </div>
    </div>
  )
}
