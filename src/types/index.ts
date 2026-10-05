// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export interface User {
  id: string
  email: string
  displayName: string
  phoneNumber?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface AdminUser extends User {
  role: AdminRole
  lastLoginAt?: Date
}

export type UserRole = 'customer' | 'admin'
export type AdminRole = 'owner' | 'admin' | 'editor' | 'inventory' | 'orders'

export interface CustomerProfile extends User {
  addresses: Address[]
  totalSpent: number
  totalOrders: number
  wishlistCount: number
  memberSince: Date
}

export interface Address {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  street: string
  city: string
  state: string
  pincode: string
  country?: string
  isDefault: boolean
  createdAt: Date
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  id: string
  rating?: number
  reviewCount?: number
  slug: string
  name: string
  shortDescription: string
  description: string
  price: number
  compareAtPrice?: number
  salePrice?: number
  sku: string
  category: string
  collection?: string
  tags: string[]
  images: ProductImage[]
  sizes: string[]
  colors: ColorOption[]
  fabric?: string
  fit?: string
  careInstructions?: string
  stock: number
  lowStockThreshold: number
  featured: boolean
  newArrival: boolean
  sale: boolean
  published: boolean
  seoTitle?: string
  seoDescription?: string
  inventory: InventoryVariant[]
  createdAt: Date
  updatedAt: Date
  viewCount: number
}

export interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  order: number
}

export interface ColorOption {
  name: string
  hex?: string
}

export interface InventoryVariant {
  id: string
  size: string
  color: string
  quantity: number
  sku: string
}

// ============================================
// CATEGORY & COLLECTION TYPES
// ============================================

export interface Category {
  id: string
  slug: string
  name: string
  description?: string
  image?: string
  featured: boolean
  published: boolean
  order: number
  createdAt: Date
}

export interface Collection {
  id: string
  slug: string
  name: string
  description?: string
  heroImage?: string
  products: string[]
  startDate?: Date
  endDate?: Date
  published: boolean
  seoTitle?: string
  seoDescription?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// CART & ORDER TYPES
// ============================================

export interface CartItem {
  id: string
  productId: string
  product?: Product
  size: string
  color: string
  quantity: number
  price: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  couponCode?: string
}

export interface Order {
  id: string
  orderId: string
  customerId: string
  customer?: CustomerProfile
  items: OrderItem[]
  address: Address
  subtotal: number
  shipping: number
  discount: number
  tax?: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentId?: string
  status: OrderStatus
  notes?: string
  timeline: OrderTimeline[]
  createdAt: Date
  updatedAt: Date
}

export type PaymentMethod = 'cod' | 'razorpay' | 'stripe' | 'upi'
export type PaymentStatus = 'pending' | 'completed' | 'failed'
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded'

export interface OrderItem {
  id: string
  productId: string
  product?: Product
  size: string
  color: string
  quantity: number
  price: number
}

export interface OrderTimeline {
  status: OrderStatus
  timestamp: Date
  note?: string
}

// ============================================
// COUPON TYPES
// ============================================

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  perUserLimit?: number
  appliedProducts?: string[]
  appliedCollections?: string[]
  startDate: Date
  endDate: Date
  active: boolean
  createdAt: Date
}

// ============================================
// WISHLIST & REVIEW TYPES
// ============================================

export interface WishlistItem {
  id: string
  customerId: string
  productId: string
  product?: Product
  createdAt: Date
}

export interface Review {
  id: string
  productId: string
  customerId: string
  customer?: User
  rating: number
  title: string
  content: string
  images?: string[]
  verifiedPurchase: boolean
  status: 'pending' | 'approved' | 'rejected'
  helpful: number
  unhelpful: number
  createdAt: Date
  updatedAt: Date
}

// ============================================
// CMS TYPES
// ============================================

export interface CMSPage {
  id: string
  slug: string
  title: string
  content: string
  published: boolean
  seoTitle?: string
  seoDescription?: string
  createdAt: Date
  updatedAt: Date
}

export interface HomepageHero {
  id: string
  title: string
  subtitle?: string
  ctaText: string
  ctaLink: string
  backgroundImage?: string
  position?: string
}

export interface HomepageSection {
  id: string
  type: string
  title?: string
  subtitle?: string
  content?: string
  products?: string[]
  collection?: string
  image?: string
  order: number
  published: boolean
}

// ============================================
// EDITORIAL TYPES
// ============================================

export interface Lookbook {
  id: string
  slug: string
  title: string
  description?: string
  images: LookbookImage[]
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface LookbookImage {
  id: string
  url: string
  caption?: string
  order: number
}

export interface JournalArticle {
  id: string
  slug: string
  title: string
  coverImage?: string
  content: string
  author?: string
  category?: string
  tags: string[]
  excerpt?: string
  publishedAt: Date
  published: boolean
  seoTitle?: string
  seoDescription?: string
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

// ============================================
// SETTINGS & CONFIGURATION
// ============================================

export interface StoreSettings {
  id: string
  brandName: string
  logo?: string
  contactEmail: string
  whatsappNumber?: string
  instagramHandle?: string
  address?: string
  currency: string
  freeShippingThreshold: number
  shippingCost: number
  taxRate?: number
  storeOpen: boolean
  announcementBar?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// AUDIT & ANALYTICS
// ============================================

export interface AuditLog {
  id: string
  userId: string
  userEmail?: string
  action: string
  entityType: string
  entityId?: string
  changes?: Record<string, any>
  ipAddress?: string
  timestamp: Date
}

export interface AnalyticsEvent {
  eventName: string
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
  timestamp: Date
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface AuthResponse {
  token: string
  user: User
  expiresIn: number
}

// ============================================
// FILTER & SORT TYPES
// ============================================

export interface ProductFilters {
  category?: string
  collection?: string
  minPrice?: number
  maxPrice?: number
  colors?: string[]
  sizes?: string[]
  search?: string
  featured?: boolean
  sale?: boolean
  sort?: 'newest' | 'price-low' | 'price-high' | 'popular'
  page?: number
  limit?: number
}

export interface OrderFilters {
  status?: OrderStatus
  customerId?: string
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
  page?: number
  limit?: number
}
