import { getSupabase } from '@/lib/supabase'

export interface StoreOrderItem {
  id: string
  productId: string
  name: string
  slug?: string
  image?: string
  size?: string
  color?: string
  quantity: number
  price: number
  total: number
}

export interface StoreOrder {
  orderId: string
  status: string
  paymentMethod: string
  paymentStatus: string
  shippingMethod: string
  trackingNumber?: string
  items: StoreOrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  address: { fullName: string; phoneNumber: string; street: string; landmark?: string; city: string; state: string; pincode: string }
  customer: { name: string; phone: string; email?: string }
  timeline: { status: string; timestamp: string }[]
  cancelReason?: string
  createdAt: string
}

export interface PlaceOrderInput {
  items: { productId: string; size: string; color: string; quantity: number }[]
  customer: { name: string; phone: string; email: string }
  address: { street: string; landmark: string; city: string; state: string; pincode: string }
  shippingMethod: 'standard' | 'express'
  couponCode?: string
  notes?: string
  paymentMethod?: 'cod' | 'online'
}

export async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await getSupabase().auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function read(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || 'Something went wrong. Please try again.')
  return data
}

export async function placeOrder(input: PlaceOrderInput): Promise<{ orderId: string; total: number; razorpay?: { keyId: string; orderId: string; amount: number } | null }> {
  const res = await fetch('/api/store/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(input),
  })
  return read(res)
}

export async function trackOrder(orderId: string, phone: string): Promise<StoreOrder> {
  const q = new URLSearchParams({ orderId: orderId.trim(), phone: phone.trim() })
  return read(await fetch(`/api/store/orders/track?${q}`))
}

export async function getMyOrders(): Promise<StoreOrder[]> {
  const data = await read(await fetch('/api/store/orders/mine', { headers: await authHeader() }))
  return data.orders || []
}

export async function getMyOrder(orderId: string): Promise<StoreOrder> {
  return read(await fetch(`/api/store/orders/mine/${encodeURIComponent(orderId)}`, { headers: await authHeader() }))
}

export async function cancelOrder(orderId: string, opts: { phone?: string; reason?: string }): Promise<StoreOrder> {
  const res = await fetch('/api/store/orders/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ orderId, phone: opts.phone || '', reason: opts.reason || '' }),
  })
  return read(res)
}

export async function getConfig(): Promise<{ onlinePayments: boolean }> {
  try {
    const res = await fetch('/api/store/config')
    return res.ok ? await res.json() : { onlinePayments: false }
  } catch {
    return { onlinePayments: false }
  }
}

export async function verifyPayment(body: { orderId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<StoreOrder> {
  const res = await fetch('/api/store/orders/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return read(res)
}

export async function retryPayment(orderId: string, phone?: string): Promise<{ razorpay: { keyId: string; orderId: string; amount: number } }> {
  const res = await fetch('/api/store/orders/retry-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ orderId, phone: phone || '' }),
  })
  return read(res)
}

export const LAST_ORDER_KEY = 'archive-last-order'
