import { authHeader } from '@/services/orders'

export interface Review { id: string; name: string; rating: number; title: string; body: string; createdAt: string; verified: boolean }
export interface ReviewData { summary: { average: number; count: number; breakdown: number[] }; reviews: Review[] }

export async function getReviews(productId: string): Promise<ReviewData> {
  const res = await fetch(`/api/store/reviews/${encodeURIComponent(productId)}`)
  if (!res.ok) throw new Error('Could not load reviews')
  return res.json()
}

export async function postReview(input: { productId: string; rating: number; title: string; body: string }) {
  const res = await fetch('/api/store/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not save your review')
  return data as { message: string }
}
