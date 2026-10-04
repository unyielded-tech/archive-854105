import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { useAdminStore } from '@/store/adminStore'
import { adminLogin } from '@/services/api'
import { adminToastOptions } from '@/components/admin/AdminShell'
import '@/styles/admin.css'

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
        setUser(result.user as any)
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
    <div className="adm adm-login">
      <div className="adm-login-box">
        <span className="adm-brand">Archive</span>
        <p className="adm-sub">Admin</p>

        <form onSubmit={handleSubmit}>
          <label className="adm-label" style={{ marginTop: 0 }}>Email</label>
          <input
            className="adm-in"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="adm-label">Password</label>
          <input
            className="adm-in"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="adm-btn block" style={{ marginTop: 24 }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      <Toaster position="top-center" toastOptions={adminToastOptions} />
    </div>
  )
}
