import type {
  Product,
  Order,
  Category,
  Collection,
  Coupon,
  JournalArticle,
  Lookbook,
  Customer,
  AuditLog,
} from '@/types'

const API_BASE = '/api'

// ============================================
// TYPES
// ============================================

export interface ApiError {
  message: string
  code?: string
  status?: number
}

// ============================================
// UTILS
// ============================================

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Send cookies for auth
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }))
    throw {
      message: error.message || error.error || 'API Error',
      status: response.status,
    } as ApiError
  }

  return response.json()
}

// ============================================
// ADMIN AUTH
// ============================================

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    role: string
  }
}

export async function adminLogin(credentials: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function adminLogout(): Promise<{ success: boolean }> {
  return apiFetch('/admin/auth/logout', {
    method: 'POST',
  })
}

export async function adminCheckSession(): Promise<{
  authenticated: boolean
  user?: { id: string; email: string; role: string }
}> {
  try {
    return await apiFetch('/admin/auth/me', {
      method: 'GET',
    })
  } catch {
    return { authenticated: false }
  }
}

// ============================================
// ADMIN PRODUCTS
// ============================================

export async function getAdminProducts(filters?: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ products: Product[]; total: number; page: number }> {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.search) params.append('search', filters.search)

  return apiFetch(`/admin/products?${params.toString()}`)
}

export async function createProduct(
  product: Record<string, unknown>
): Promise<{ id: string; slug?: string; message: string }> {
  return apiFetch('/admin/products', {
    method: 'POST',
    body: JSON.stringify(product),
  })
}

export async function updateProduct(
  id: string,
  updates: Record<string, unknown>
): Promise<{ message: string }> {
  return apiFetch(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function uploadProductImage(dataUrl: string): Promise<{ url: string }> {
  return apiFetch('/admin/uploads', {
    method: 'POST',
    body: JSON.stringify({ dataUrl }),
  })
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/admin/products/${id}`, {
    method: 'DELETE',
  })
}

// ============================================
// ADMIN ORDERS
// ============================================

export async function getAdminOrders(filters?: {
  page?: number
  limit?: number
  status?: string
}): Promise<{ orders: Order[]; total: number; page: number }> {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.status) params.append('status', filters.status)

  return apiFetch(`/admin/orders?${params.toString()}`)
}

export async function getAdminOrder(id: string): Promise<Order> {
  return apiFetch(`/admin/orders/${id}`)
}

export async function updateOrderStatus(
  id: string,
  status: string,
  note?: string
): Promise<{ message: string }> {
  return apiFetch(`/admin/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes: note }),
  })
}

// ============================================
// ADMIN INVENTORY
// ============================================

export async function getInventory(): Promise<any> {
  return apiFetch('/admin/inventory')
}

export async function updateInventory(
  productId: string,
  variantId: string,
  quantity: number
): Promise<{ success: boolean }> {
  return apiFetch('/admin/inventory', {
    method: 'PUT',
    body: JSON.stringify({ productId, variantId, quantity }),
  })
}

// ============================================
// ADMIN COUPONS
// ============================================

export async function getAdminCoupons(): Promise<Coupon[]> {
  return apiFetch('/admin/coupons')
}

export async function createCoupon(
  coupon: Omit<Coupon, 'id' | 'createdAt'>
): Promise<Coupon> {
  return apiFetch('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(coupon),
  })
}

export async function updateCoupon(
  id: string,
  updates: Partial<Coupon>
): Promise<Coupon> {
  return apiFetch(`/admin/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteCoupon(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/admin/coupons/${id}`, {
    method: 'DELETE',
  })
}

// ============================================
// ADMIN DASHBOARD
// ============================================

export async function getDashboardStats(): Promise<{
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  recentOrders: Order[]
  lowStockProducts: Product[]
}> {
  return apiFetch('/admin/dashboard/stats')
}

// ============================================
// ADMIN AUDIT LOG
// ============================================

export async function getAuditLog(filters?: {
  page?: number
  limit?: number
}): Promise<{ logs: AuditLog[]; total: number }> {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())

  return apiFetch(`/admin/audit-log?${params.toString()}`)
}

// ============================================
// ADMIN CUSTOMERS
// ============================================

export async function getAdminCustomers(filters?: {
  page?: number
  limit?: number
  search?: string
}): Promise<any> {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.search) params.append('search', filters.search)

  return apiFetch(`/admin/customers?${params.toString()}`)
}

export async function getAdminCustomer(id: string): Promise<any> {
  return apiFetch(`/admin/customers/${id}`)
}

// ============================================
// ADMIN CMS
// ============================================

export async function getAdminPages(): Promise<any[]> {
  return apiFetch('/admin/cms/pages')
}

export async function createPage(page: any): Promise<any> {
  return apiFetch('/admin/cms/pages', {
    method: 'POST',
    body: JSON.stringify(page),
  })
}

export async function updatePage(id: string, updates: any): Promise<any> {
  return apiFetch(`/admin/cms/pages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deletePage(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/admin/cms/pages/${id}`, {
    method: 'DELETE',
  })
}

// ============================================
// ADMIN JOURNAL
// ============================================

export async function getAdminArticles(): Promise<JournalArticle[]> {
  return apiFetch('/admin/journal')
}

export async function createArticle(
  article: Omit<JournalArticle, 'id' | 'createdAt' | 'updatedAt'>
): Promise<JournalArticle> {
  return apiFetch('/admin/journal', {
    method: 'POST',
    body: JSON.stringify(article),
  })
}

export async function updateArticle(
  id: string,
  updates: Partial<JournalArticle>
): Promise<JournalArticle> {
  return apiFetch(`/admin/journal/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteArticle(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/admin/journal/${id}`, {
    method: 'DELETE',
  })
}

// ============================================
// ADMIN LOOKBOOKS
// ============================================

export async function getAdminLookbooks(): Promise<Lookbook[]> {
  return apiFetch('/admin/lookbooks')
}

export async function createLookbook(
  lookbook: Omit<Lookbook, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Lookbook> {
  return apiFetch('/admin/lookbooks', {
    method: 'POST',
    body: JSON.stringify(lookbook),
  })
}

export async function updateLookbook(
  id: string,
  updates: Partial<Lookbook>
): Promise<Lookbook> {
  return apiFetch(`/admin/lookbooks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteLookbook(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/admin/lookbooks/${id}`, {
    method: 'DELETE',
  })
}


// ============================================
// HOMEPAGE BANNER
// ============================================

export interface HomeBanner {
  type: 'image' | 'video' | ''
  url: string
  line1: string
  line2: string
}

export async function getAdminBanner(): Promise<HomeBanner> {
  return apiFetch('/admin/banner')
}

export async function saveAdminBanner(banner: HomeBanner): Promise<{ message: string }> {
  return apiFetch('/admin/banner', {
    method: 'PUT',
    body: JSON.stringify(banner),
  })
}

export async function getVideoUploadTarget(
  contentType: string
): Promise<{ path: string; token: string; publicUrl: string }> {
  return apiFetch('/admin/uploads/video-url', {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  })
}


export async function updateOrder(id: string, changes: Record<string, unknown>): Promise<{ message: string }> {
  return apiFetch(`/admin/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}


// ============================================
// COUPONS (admin) + REVIEWS (admin) + ORDER EXPORT
// ============================================

export interface AdminCoupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderAmount?: number
  maxDiscount?: number | null
  usageLimit?: number | null
  usedCount?: number
  startDate?: string | null
  endDate?: string | null
  active: boolean
}

export async function listCoupons(): Promise<{ coupons: AdminCoupon[] }> {
  return apiFetch('/admin/coupons')
}
export async function saveCoupon(id: string | null, body: Record<string, unknown>): Promise<{ message?: string }> {
  return apiFetch(id ? `/admin/coupons/${id}` : '/admin/coupons', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) })
}
export async function removeCoupon(id: string): Promise<{ message: string }> {
  return apiFetch(`/admin/coupons/${id}`, { method: 'DELETE' })
}

export interface AdminReview { id: string; productId: string; productName: string; name: string; rating: number; title: string; body: string; hidden?: boolean; createdAt: string }
export async function listReviews(): Promise<{ reviews: AdminReview[] }> {
  return apiFetch('/admin/reviews')
}
export async function setReviewHidden(id: string, hidden: boolean): Promise<{ message: string }> {
  return apiFetch(`/admin/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ hidden }) })
}
export async function removeReview(id: string): Promise<{ message: string }> {
  return apiFetch(`/admin/reviews/${id}`, { method: 'DELETE' })
}

// Every order, newest first (loads page by page).
export async function getAllOrders(): Promise<any[]> {
  const all: any[] = []
  for (let page = 1; page < 30; page++) {
    const data: any = await apiFetch(`/admin/orders?page=${page}&limit=100`)
    all.push(...(data.orders || []))
    if (!data.hasMore) break
  }
  return all
}
