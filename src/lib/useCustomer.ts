import { useEffect, useState } from 'react'
import { watchCustomerAuth } from '@/services/customerAuth'
import type { CustomerUser } from '@/services/customerAuth'

// The signed-in shopper (null when signed out). `loading` is true until the first check finishes.
export function useCustomer() {
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let off: (() => void) | undefined
    try {
      off = watchCustomerAuth((next) => { setUser(next); setLoading(false) })
    } catch {
      setLoading(false)
    }
    return () => off?.()
  }, [])

  return { user, loading }
}
