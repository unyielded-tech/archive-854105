import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { getAdminProducts, deleteProduct } from '@/services/api'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadProducts()
  }, [page, search])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getAdminProducts({ page, search })
      setProducts(data.products)
    } catch (error) {
      toast.error('Failed to load products')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await deleteProduct(id)
      toast.success('Product deleted')
      loadProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="min-h-screen bg-off-white">
      <div className="bg-white border-b border-soft-grey sticky top-0 z-10">
        <div className="container py-6 flex justify-between items-center">
          <h1 className="text-h2 font-display">Products</h1>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="container py-12">
        {/* Search */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-medium-grey" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-medium-grey rounded-md"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20"><p className="text-medium-grey">Loading...</p></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20"><p className="text-medium-grey">No products found</p></div>
        ) : (
          <>
            <div className="bg-white rounded-md border border-soft-grey overflow-hidden">
              <table className="w-full">
                <thead className="bg-off-white border-b border-soft-grey">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-soft-grey hover:bg-off-white transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-medium-grey">{product.shortDescription}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{product.sku}</td>
                      <td className="px-6 py-4 text-sm font-semibold">₹{product.price}</td>
                      <td className="px-6 py-4 text-sm">{product.stock}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${product.published ? 'bg-success text-white' : 'bg-soft-grey'}`}>
                          {product.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-soft-grey rounded-md transition">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-error hover:text-white rounded-md transition">
                            <Trash2 size={16} />
                          </button>
                        </div>
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
