import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { useCustomer } from '@/lib/useCustomer'
import '@/styles/store.css'

const links = [
  { to: '/account', label: 'Overview', end: true },
  { to: '/account/orders', label: 'My orders' },
  { to: '/account/profile', label: 'Profile details' },
  { to: '/account/addresses', label: 'Saved addresses' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/account/security', label: 'Password & security' },
  { to: '/faq', label: 'Help centre' },
]

export function SignInGate() {
  return (
    <div className="st-wrap st-empty" style={{ minHeight: '50vh' }}>
      <h1 className="st-page-title">Your account</h1>
      <p className="st-sub" style={{ margin: '6px 0 16px' }}>Sign in to see your orders, saved addresses and details.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/login" className="st-btn">Sign in</Link>
        <Link to="/register" className="st-btn ghost">Create account</Link>
        <Link to="/track-order" className="st-btn ghost">Track an order</Link>
      </div>
    </div>
  )
}

// Wraps every account page: handles sign-in, the side menu (desktop) and the back link (phone).
export function AccountLayout({ title, subtitle, home = false, children }: { title: string; subtitle?: string; home?: boolean; children: (user: { uid: string; email: string | null; displayName: string }) => ReactNode }) {
  const { user, loading } = useCustomer()

  if (loading) return <MainLayout><div className="st-empty" style={{ minHeight: '50vh' }}>Loading…</div></MainLayout>
  if (!user) return <MainLayout><SignInGate /></MainLayout>

  return (
    <MainLayout>
      <div className="st-wrap">
        <div className="acc">
          <nav className="acc-nav" aria-label="Account">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'on' : '')}>{l.label}</NavLink>
            ))}
          </nav>
          <div>
            {!home && <Link to="/account" className="acc-back">← Account</Link>}
            <h1 className="st-page-title">{title}</h1>
            {subtitle && <p className="st-sub" style={{ marginBottom: 12 }}>{subtitle}</p>}
            <div style={{ marginTop: subtitle ? 0 : 10 }}>{children(user)}</div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
