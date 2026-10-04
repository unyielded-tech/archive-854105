export const inr = (n: number | undefined | null) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export const FREE_SHIPPING_ABOVE = 2000
export const SHIPPING = { standard: 100, express: 300 }

export function shippingFor(subtotal: number, method: 'standard' | 'express') {
  return method === 'express' ? SHIPPING.express : subtotal > FREE_SHIPPING_ABOVE ? 0 : SHIPPING.standard
}

export function couponDiscount(c: { type: string; value: number; maxDiscount?: number }, subtotal: number) {
  let off = c.type === 'fixed' ? Number(c.value) || 0 : (subtotal * (Number(c.value) || 0)) / 100
  if (c.type !== 'fixed' && c.maxDiscount) off = Math.min(off, Number(c.maxDiscount))
  return Math.max(0, Math.min(Math.round(off), subtotal))
}

export const imageOf = (p: any): string => {
  const first = p?.images?.find((i: any) => i?.isPrimary) || p?.images?.[0]
  return typeof first === 'string' ? first : first?.url || ''
}
