import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { watchCustomerAuth, logoutCustomer } from '@/services/customerAuth'
import type { CustomerUser as User } from '@/services/customerAuth'
import toast from 'react-hot-toast'

export function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    try {
      unsubscribe = watchCustomerAuth((next) => { setUser(next); setLoading(false) })
    } catch {
      setLoading(false)
    }
    return () => unsubscribe?.()
  }, [])

  if (loading) return <MainLayout><div className="min-h-[60vh] flex items-center justify-center text-sm tracking-widest uppercase">Loading account…</div></MainLayout>

  if (!user) {
    return <MainLayout><div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6"><p className="text-xs uppercase tracking-[0.3em] text-medium-grey mb-4">ARCHIVE 854105</p><h1 className="font-display text-4xl mb-4">Your account</h1><p className="text-medium-grey mb-8">Sign in to view your orders and saved details.</p><Link to="/login" className="bg-black text-white px-8 py-4 text-xs uppercase tracking-widest">Sign in</Link></div></MainLayout>
  }

  return <MainLayout><div className="container py-16"><div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"><div><p className="text-xs uppercase tracking-[0.3em] text-medium-grey mb-3">My account</p><h1 className="font-display text-5xl">{user.displayName || user.email}</h1><p className="text-sm text-medium-grey mt-3">{user.email}</p></div><button onClick={async () => { await logoutCustomer(); toast.success('Signed out') }} className="text-xs uppercase tracking-widest underline self-start">Sign out</button></div><div className="border-t border-soft-grey pt-8"><h2 className="font-display text-2xl mb-3">Account status</h2><p className="text-medium-grey">{user.emailVerified ? 'Email verified.' : 'Please verify your email address.'}</p></div></div></MainLayout>
}
