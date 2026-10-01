import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/store/adminStore'
import { adminLogin } from '@/services/api'
import toast from 'react-hot-toast'

export function AdminLogin() {
  const navigate = useNavigate()
  const setUser = useAdminStore((state) => state.setUser)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await adminLogin({ email, password })
      
      if (result.success && result.user) {
        setUser(result.user)
        toast.success('Logged in successfully')
        navigate('/admin/dashboard')
      } else {
        toast.error(result.message || 'Login failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold tracking-widest mb-2">
            ARCHIVE
          </h1>
          <p className="text-sm tracking-wider text-medium-grey">Admin Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-medium-grey rounded-md focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              placeholder="admin@archive854105.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-medium-grey rounded-md focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 font-semibold uppercase tracking-wider rounded-md hover:bg-charcoal disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-medium-grey">
            This is a secure admin area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  )
}
