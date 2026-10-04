import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAdminStore } from '@/store/adminStore'
import { adminLogout } from '@/services/api'
import '@/styles/admin.css'

export const adminToastOptions = {
  duration: 3500,
  style: {
    background: '#faf7f0',
    color: '#0b0b0b',
    border: '1px solid #0b0b0b',
    borderRadius: 0,
    boxShadow: 'none',
    fontSize: '14px',
  },
}

const links = [
  { to: '/admin/dashboard', label: 'Home' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
]

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AdminShell({ title, subtitle, children }: Props) {
  const navigate = useNavigate()
  const logout = useAdminStore((s) => s.logout)

  const signOut = async () => {
    try {
      await adminLogout()
    } catch {
      // even if the call fails, leave the admin area
    }
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="adm has-nav">
      <header className="adm-top">
        <span className="adm-brand">Archive</span>
        <button className="adm-text" onClick={signOut}>Sign out</button>
      </header>

      <main className="adm-main">
        <div className="adm-head">
          <h1>{title}</h1>
          {subtitle && <p className="adm-sub">{subtitle}</p>}
        </div>
        {children}
      </main>

      <nav className="adm-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <Toaster position="top-center" toastOptions={adminToastOptions} />
    </div>
  )
}
