import {
  getFirebaseDb,
  getFirebaseAuth,
} from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  setDoc,
  updateDoc,
  deleteDoc,
  WriteBatch,
  writeBatch,
  arrayUnion,
  increment,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  type DocumentReference,
} from 'firebase/firestore'
import type {
  Product,
  Category,
  Collection,
  Order,
  CartItem,
  Coupon,
  JournalArticle,
  Lookbook,
  CMSPage,
  StoreSettings,
  User,
  Address,
  AuditLog,
} from '@/types'

// ============================================
// PRODUCT OPERATIONS
// ============================================

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'products'),
    where('slug', '==', slug),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  return convertDocToProduct(snapshot.docs[0])
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = getFirebaseDb()
  const docSnap = await getDoc(doc(db, 'products', id))
  if (!docSnap.exists()) return null
  return convertDocToProduct(docSnap as any)
}

export async function getProducts(
  filters?: {
    category?: string
    collection?: string
    featured?: boolean
    sale?: boolean
    published?: boolean
    limit?: number
  }
): Promise<Product[]> {
  const db = getFirebaseDb()
  const constraints: QueryConstraint[] = []

  if (filters?.category) {
    constraints.push(where('category', '==', filters.category))
  }
  if (filters?.collection) {
    constraints.push(where('collection', '==', filters.collection))
  }
  if (filters?.featured !== undefined) {
    constraints.push(where('featured', '==', filters.featured))
  }
  if (filters?.sale !== undefined) {
    constraints.push(where('sale', '==', filters.sale))
  }
  if (filters?.published !== undefined) {
    constraints.push(where('published', '==', filters.published))
  }

  constraints.push(orderBy('createdAt', 'desc'))
  if (filters?.limit) {
    constraints.push(limit(filters.limit))
  }

  const q = query(collection(db, 'products'), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertDocToProduct(doc as any))
}

// ============================================
// CATEGORY OPERATIONS
// ============================================

export async function getCategories(): Promise<Category[]> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'categories'),
    where('published', '==', true),
    orderBy('order', 'asc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
  } as Category))
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'categories'),
    where('slug', '==', slug),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return {
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
  } as Category
}

// ============================================
// COLLECTION OPERATIONS
// ============================================

export async function getCollections(): Promise<Collection[]> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'collections'),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertDocToCollection(doc as any))
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'collections'),
    where('slug', '==', slug),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  return convertDocToCollection(snapshot.docs[0] as any)
}

// ============================================
// ORDER OPERATIONS
// ============================================

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const db = getFirebaseDb()
  const ordersRef = collection(db, 'orders')
  
  // Generate order ID
  const timestamp = new Date().getTime()
  const orderId = `ORD-${timestamp}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  const orderDoc = {
    ...order,
    orderId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }

  const docRef = await setDoc(doc(ordersRef, orderId), orderDoc)
  
  return {
    ...orderDoc,
    id: orderId,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Order
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = getFirebaseDb()
  const docSnap = await getDoc(doc(db, 'orders', id))
  if (!docSnap.exists()) return null
  return convertDocToOrder(docSnap as any)
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertDocToOrder(doc as any))
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string
): Promise<void> {
  const db = getFirebaseDb()
  const orderRef = doc(db, 'orders', orderId)
  
  const timeline = {
    status: newStatus,
    timestamp: Timestamp.now(),
    note: note || undefined,
  }

  await updateDoc(orderRef, {
    status: newStatus,
    timeline: arrayUnion(timeline),
    updatedAt: Timestamp.now(),
  })
}

// ============================================
// COUPON OPERATIONS
// ============================================

export async function applyCoupon(code: string, orderTotal: number): Promise<Coupon | null> {
  const db = getFirebaseDb()
  const now = new Date()
  
  const q = query(
    collection(db, 'coupons'),
    where('code', '==', code.toUpperCase()),
    where('active', '==', true),
    where('startDate', '<=', Timestamp.fromDate(now)),
    where('endDate', '>=', Timestamp.fromDate(now))
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const coupon = convertDocToCoupon(snapshot.docs[0] as any)
  
  // Validate minimum order amount
  if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
    return null
  }

  // Validate usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return null
  }

  return coupon
}

// ============================================
// ARTICLE OPERATIONS
// ============================================

export async function getArticles(
  limit_?: number,
  published?: boolean
): Promise<JournalArticle[]> {
  const db = getFirebaseDb()
  const constraints: QueryConstraint[] = []

  if (published !== undefined) {
    constraints.push(where('published', '==', published))
  }

  constraints.push(orderBy('publishedAt', 'desc'))
  if (limit_) {
    constraints.push(limit(limit_))
  }

  const q = query(collection(db, 'articles'), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertDocToArticle(doc as any))
}

export async function getArticleBySlug(slug: string): Promise<JournalArticle | null> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'articles'),
    where('slug', '==', slug),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  return convertDocToArticle(snapshot.docs[0] as any)
}

// ============================================
// LOOKBOOK OPERATIONS
// ============================================

export async function getLookbooks(): Promise<Lookbook[]> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'lookbooks'),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertDocToLookbook(doc as any))
}

export async function getLookbookBySlug(slug: string): Promise<Lookbook | null> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'lookbooks'),
    where('slug', '==', slug),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  return convertDocToLookbook(snapshot.docs[0] as any)
}

// ============================================
// CMS OPERATIONS
// ============================================

export async function getPageBySlug(slug: string): Promise<CMSPage | null> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'pages'),
    where('slug', '==', slug),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  return convertDocToPage(snapshot.docs[0] as any)
}

// ============================================
// SETTINGS
// ============================================

export async function getStoreSettings(): Promise<StoreSettings | null> {
  const db = getFirebaseDb()
  const docSnap = await getDoc(doc(db, 'settings', 'store'))
  if (!docSnap.exists()) return null
  return convertDocToSettings(docSnap as any)
}

// ============================================
// HELPER CONVERSION FUNCTIONS
// ============================================

function convertDocToProduct(
  doc: QueryDocumentSnapshot<DocumentData> | any
): Product {
  const data = doc.data?.() || doc
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as Product
}

function convertDocToCollection(
  doc: QueryDocumentSnapshot<DocumentData> | any
): Collection {
  const data = doc.data?.() || doc
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as Collection
}

function convertDocToOrder(
  doc: QueryDocumentSnapshot<DocumentData> | any
): Order {
  const data = doc.data?.() || doc
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as Order
}

function convertDocToCoupon(
  doc: QueryDocumentSnapshot<DocumentData> | any
): Coupon {
  const data = doc.data?.() || doc
  return {
    ...data,
    id: doc.id,
    startDate: data.startDate?.toDate?.() || new Date(),
    endDate: data.endDate?.toDate?.() || new Date(),
    createdAt: data.createdAt?.toDate?.() || new Date(),
  } as Coupon
}

function convertDocToArticle(
  doc: QueryDocumentSnapshot<DocumentData> | any
): JournalArticle {
  const data = doc.data?.() || doc
  return {
    ...data,
    id: doc.id,
    publishedAt: data.publishedAt?.toDate?.() || new Date(),
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as JournalArticle
}

function convertDocToLookbook(
  doc: QueryDocumentSnapshot<DocumentData> | any
): Lookbook {
  const data = doc.data?.() || doc
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as Lookbook
}

function convertDocToPage(
  doc: QueryDocumentSnapshot<DocumentData> | any
): CMSPage {
  const data = doc.data?.() || doc
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as CMSPage
}

function convertDocToSettings(
  doc: QueryDocumentSnapshot<DocumentData> | any
): StoreSettings {
  const data = doc.data?.() || doc
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as StoreSettings
}

// ============================================
// BATCH OPERATIONS
// ============================================

export function createBatch(): WriteBatch {
  return writeBatch(getFirebaseDb())
}

export async function commitBatch(batch: WriteBatch): Promise<void> {
  await batch.commit()
}
