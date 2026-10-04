// Storefront data access. Reads go through the server's public /api/store endpoints (backed by Supabase).
import type { Product, Category, Collection, Coupon, JournalArticle, Lookbook, CMSPage, StoreSettings } from '@/types'

const DATE_KEYS = ['createdAt', 'updatedAt', 'publishedAt', 'startDate', 'endDate']

function revive<T>(raw: any): T {
  const out = { ...raw }
  for (const k of DATE_KEYS) if (out[k]) out[k] = new Date(out[k])
  if (!out.createdAt) out.createdAt = new Date()
  return out as T
}

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`/api/store${path}`)
  if (!res.ok) throw new Error(`Store request failed (${res.status})`)
  const data = await res.json()
  return data === null ? null : (data as T)
}

const many = async <T>(path: string): Promise<T[]> => ((await get<any[]>(path)) || []).map((r) => revive<T>(r))
const one = async <T>(path: string): Promise<T | null> => {
  const r = await get<any>(path)
  return r ? revive<T>(r) : null
}

export function getProductBySlug(slug: string) { return one<Product>(`/products/by-slug/${encodeURIComponent(slug)}`) }
export function getProductById(id: string) { return one<Product>(`/products/${encodeURIComponent(id)}`) }

export function getProducts(filters?: {
  category?: string; collection?: string; featured?: boolean; sale?: boolean; published?: boolean; limit?: number
}) {
  const p = new URLSearchParams()
  if (filters?.category) p.set('category', filters.category)
  if (filters?.collection) p.set('collection', filters.collection)
  if (filters?.featured !== undefined) p.set('featured', String(filters.featured))
  if (filters?.sale !== undefined) p.set('sale', String(filters.sale))
  if (filters?.limit) p.set('limit', String(filters.limit))
  return many<Product>(`/products?${p}`)
}

export const getCategories = () => many<Category>('/categories')
export const getCategoryBySlug = (slug: string) => one<Category>(`/categories/${encodeURIComponent(slug)}`)
export const getCollections = () => many<Collection>('/collections')
export const getCollectionBySlug = (slug: string) => one<Collection>(`/collections/${encodeURIComponent(slug)}`)
export const getLookbooks = () => many<Lookbook>('/lookbooks')
export const getLookbookBySlug = (slug: string) => one<Lookbook>(`/lookbooks/${encodeURIComponent(slug)}`)
export const getArticles = (limit?: number) => many<JournalArticle>(`/articles${limit ? `?limit=${limit}` : ''}`)
export const getArticleBySlug = (slug: string) => one<JournalArticle>(`/articles/${encodeURIComponent(slug)}`)
export const getPageBySlug = (slug: string) => one<CMSPage>(`/pages/${encodeURIComponent(slug)}`)
export interface HomeBannerData { type?: 'image' | 'video' | ''; url?: string; line1?: string; line2?: string }
export const getHomeBanner = () => get<HomeBannerData>('/banner')
export const getStoreSettings = () => one<StoreSettings>('/settings')

export async function applyCoupon(code: string, orderTotal: number): Promise<Coupon | null> {
  const res = await fetch('/api/store/coupons/apply', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, orderTotal }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data ? revive<Coupon>(data) : null
}
