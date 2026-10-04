import type { StoreOrder } from '@/services/orders'

export const CANCELLABLE = ['pending', 'confirmed', 'processing', 'packed']
export const IN_PROGRESS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'return_requested']

const day = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
export const dateTime = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

// When an entry for this stage was written to the order timeline.
export function stageTime(order: StoreOrder, ...statuses: string[]) {
  const hit = [...order.timeline].reverse().find((t) => statuses.includes(t.status))
  return hit?.timestamp || ''
}

export function arrivalBy(order: StoreOrder) {
  const days = order.shippingMethod === 'express' ? 3 : 7
  return new Date(new Date(order.createdAt).getTime() + days * 86400000)
}

export type Tone = 'green' | 'red' | 'amber' | 'ink'

// Headline shown on order cards and at the top of an order.
export function statusInfo(order: StoreOrder): { text: string; tone: Tone } {
  const t = (iso: string) => (iso ? shortDate(iso) : '')
  switch (order.status) {
    case 'delivered': return { text: `Delivered${stageTime(order, 'delivered') ? ' on ' + t(stageTime(order, 'delivered')) : ''}`, tone: 'green' }
    case 'cancelled': return { text: `Cancelled${stageTime(order, 'cancelled') ? ' on ' + t(stageTime(order, 'cancelled')) : ''}`, tone: 'red' }
    case 'returned': return { text: 'Returned', tone: 'red' }
    case 'refunded': return { text: 'Refunded', tone: 'red' }
    case 'return_requested': return { text: 'Return requested', tone: 'amber' }
    case 'shipped': return { text: `Shipped · arriving by ${day(arrivalBy(order))}`, tone: 'amber' }
    case 'pending': return { text: `Order placed · arriving by ${day(arrivalBy(order))}`, tone: 'ink' }
    default: return { text: `Confirmed · arriving by ${day(arrivalBy(order))}`, tone: 'ink' }
  }
}

export const itemCount = (o: StoreOrder) => o.items.reduce((n, i) => n + i.quantity, 0)
