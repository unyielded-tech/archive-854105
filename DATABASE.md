# ARCHIVE 854105 - Database Schema

Complete Firestore database schema with all collections, fields, and relationships.

## Collections Overview

```
admins/              - Admin users and system access
products/            - Product catalog
categories/          - Product categories
collections/         - Product collections
orders/              - Customer orders
users/               - Customer profiles
addresses/           - Saved addresses
coupons/             - Discount codes
articles/            - Journal articles
lookbooks/           - Editorial lookbooks
pages/               - CMS pages
settings/            - Store configuration
auditLogs/           - System audit trail
analytics/           - User events
```

## Detailed Schema

### admins

Admin user accounts with role-based access control.

```firestore
Collection: admins
Document ID: auto-generated

{
  email: string                    # Unique email, lowercase
  displayName: string              # Admin name
  passwordHash: string             # bcrypt hash (10 rounds)
  role: string                     # 'owner'|'admin'|'editor'|'inventory'|'orders'
  active: boolean                  # Account enabled
  createdAt: timestamp             # Account creation
  createdBy?: string               # Creator admin ID
  lastLoginAt?: timestamp          # Last login time
  lastLoginIp?: string             # Last login IP
  
  Indexes:
  - email (ascending, unique)
  - role (ascending)
  - active (ascending)
}
```

### products

Product catalog with inventory and metadata.

```firestore
Collection: products
Document ID: slug

{
  slug: string                     # URL-friendly unique identifier
  name: string                     # Product name
  shortDescription: string         # Brief description
  description: string              # Full description (HTML supported)
  price: number                    # Regular price (INR)
  salePrice?: number               # Sale price if applicable
  compareAtPrice?: number          # Original price for comparison
  sku: string                      # Unique SKU
  category: string                 # Category ID (ref)
  collection?: string              # Collection ID (ref)
  tags: array<string>              # Product tags
  
  # Media
  images: array<object>
    - id: string
    - url: string                  # Image URL (CDN)
    - alt: string                  # Alt text for accessibility
    - isPrimary: boolean            # Thumbnail image
    - order: number                 # Display order
  
  # Variants
  sizes: array<string>             # Available sizes
  colors: array<object>
    - name: string                 # Color name
    - hex?: string                 # Hex code
  
  inventory: array<object>         # Variant-specific stock
    - id: string
    - size: string
    - color: string
    - quantity: number
    - sku: string (variant SKU)
  
  # Stock management
  stock: number                    # Total stock (denormalized)
  lowStockThreshold: number        # Alert level
  
  # Features
  featured: boolean                # Homepage featured
  newArrival: boolean              # New product tag
  sale: boolean                    # Sale badge
  published: boolean               # Live status
  
  # Additional info
  fabric?: string                  # Material
  fit?: string                     # Fit description
  careInstructions?: string        # Care info
  
  # SEO
  seoTitle?: string
  seoDescription?: string
  
  # Metadata
  createdAt: timestamp
  updatedAt: timestamp
  viewCount: number                # Analytics
  
  Indexes:
  - slug (ascending, unique)
  - category (ascending)
  - published (ascending)
  - featured (ascending)
  - sale (ascending)
  - createdAt (descending)
  - collection (ascending)
}
```

### categories

Product categories for organization.

```firestore
Collection: categories
Document ID: slug

{
  slug: string                     # URL-friendly ID
  name: string                     # Category name
  description?: string             # Category description
  image?: string                   # Category image URL
  featured: boolean                # Featured on homepage
  published: boolean               # Live status
  order: number                    # Sort order
  createdAt: timestamp
  
  Indexes:
  - slug (ascending, unique)
  - published (ascending)
  - order (ascending)
}
```

### collections

Product collections and seasonal drops.

```firestore
Collection: collections
Document ID: slug

{
  slug: string                     # URL-friendly ID
  name: string                     # Collection name
  description?: string             # Description
  heroImage?: string               # Hero image URL
  products: array<string>          # Product IDs
  
  # Timeline
  startDate?: timestamp            # Collection start
  endDate?: timestamp              # Collection end
  
  # Status
  published: boolean               # Live status
  
  # SEO
  seoTitle?: string
  seoDescription?: string
  
  # Metadata
  createdAt: timestamp
  updatedAt: timestamp
  
  Indexes:
  - slug (ascending, unique)
  - published (ascending)
  - createdAt (descending)
}
```

### orders

Customer orders with full lifecycle tracking.

```firestore
Collection: orders
Document ID: orderId (custom format: ORD-[timestamp]-[random])

{
  orderId: string                  # Human-readable order ID
  customerId: string               # Customer ID
  customer?: object                # Denormalized customer data
    - id: string
    - email: string
    - displayName: string
    - phoneNumber: string
  
  # Items
  items: array<object>
    - id: string
    - productId: string            # Product reference
    - product?: object             # Denormalized product data
    - size: string
    - color: string
    - quantity: number
    - price: number                # Unit price at purchase
  
  # Shipping
  address: object
    - id: string
    - fullName: string
    - email: string
    - phoneNumber: string
    - street: string
    - city: string
    - state: string
    - pincode: string
    - country?: string
    - isDefault: boolean
  
  # Pricing
  subtotal: number
  shipping: number
  discount: number                 # Coupon discount
  tax?: number
  total: number
  
  # Payment
  paymentMethod: string            # 'cod'|'razorpay'|'stripe'|'upi'
  paymentStatus: string            # 'pending'|'completed'|'failed'
  paymentId?: string               # Payment gateway ID
  
  # Fulfillment
  status: string                   # Order status (see OrderStatus type)
  notes?: string                   # Admin notes
  
  timeline: array<object>          # Status history
    - status: string
    - timestamp: timestamp
    - note?: string
  
  # Metadata
  createdAt: timestamp
  updatedAt: timestamp
  
  Indexes:
  - customerId (ascending)
  - createdAt (descending)
  - status (ascending)
  - paymentStatus (ascending)
  - orderId (ascending, unique)
}
```

### users

Customer profiles and account data.

```firestore
Collection: users
Document ID: auto-generated or Firebase Auth UID

{
  email: string                    # Email address
  displayName: string              # Customer name
  phoneNumber?: string             # Contact number
  role: string                     # Always 'customer'
  
  # Account info
  addresses: array<object>         # Saved addresses (see orders.address)
  totalSpent: number               # Lifetime spending (denormalized)
  totalOrders: number              # Order count
  wishlistCount: number            # Wishlist items count
  memberSince: timestamp           # Account creation date
  
  # Metadata
  createdAt: timestamp
  updatedAt: timestamp
  
  Indexes:
  - email (ascending, unique)
  - createdAt (descending)
}
```

### coupons

Discount codes and promotional offers.

```firestore
Collection: coupons
Document ID: auto-generated

{
  code: string                     # Coupon code (uppercase)
  type: string                     # 'percentage'|'fixed'
  value: number                    # Discount value
  
  # Conditions
  minOrderAmount?: number          # Minimum order total
  maxDiscount?: number             # Maximum discount cap
  usageLimit?: number              # Total usage limit
  perUserLimit?: number            # Per customer limit
  
  # Scope
  appliedProducts?: array<string>  # Product IDs (if limited)
  appliedCollections?: array<string> # Collection IDs (if limited)
  
  # Validity
  startDate: timestamp             # Valid from
  endDate: timestamp               # Valid until
  active: boolean                  # Enable/disable
  
  # Analytics
  usedCount: number                # Times used (denormalized)
  
  createdAt: timestamp
  
  Indexes:
  - code (ascending, unique)
  - active (ascending)
  - startDate (ascending)
  - endDate (ascending)
}
```

### articles

Journal/blog articles for editorial content.

```firestore
Collection: articles
Document ID: slug

{
  slug: string                     # URL-friendly ID
  title: string                    # Article title
  coverImage?: string              # Cover image URL
  excerpt?: string                 # Short description
  content: string                  # Full content (HTML)
  
  # Metadata
  author?: string                  # Author name
  category?: string                # Article category
  tags: array<string>              # Search tags
  
  # Publishing
  published: boolean               # Live status
  publishedAt: timestamp           # Publication date
  createdAt: timestamp
  updatedAt: timestamp
  
  # SEO
  seoTitle?: string
  seoDescription?: string
  
  # Analytics
  viewCount: number                # Page views
  
  Indexes:
  - slug (ascending, unique)
  - published (ascending)
  - publishedAt (descending)
  - category (ascending)
}
```

### lookbooks

Editorial lookbook galleries.

```firestore
Collection: lookbooks
Document ID: slug

{
  slug: string                     # URL-friendly ID
  title: string                    # Lookbook title
  description?: string             # Description
  
  images: array<object>
    - id: string
    - url: string                  # Image URL
    - caption?: string             # Image caption
    - order: number                # Display order
  
  # Publishing
  published: boolean               # Live status
  createdAt: timestamp
  updatedAt: timestamp
  
  Indexes:
  - slug (ascending, unique)
  - published (ascending)
  - createdAt (descending)
}
```

### pages

CMS pages for static content.

```firestore
Collection: pages
Document ID: slug

{
  slug: string                     # URL-friendly ID
  title: string                    # Page title
  content: string                  # HTML content
  
  # Publishing
  published: boolean               # Live status
  
  # SEO
  seoTitle?: string
  seoDescription?: string
  
  # Metadata
  createdAt: timestamp
  updatedAt: timestamp
  
  Indexes:
  - slug (ascending, unique)
  - published (ascending)
}
```

### settings

Store configuration and global settings.

```firestore
Collection: settings
Document ID: "store" (singleton pattern)

{
  brandName: string                # Store name
  logo?: string                    # Logo URL
  contactEmail: string             # Support email
  whatsappNumber?: string          # WhatsApp contact
  instagramHandle?: string         # Instagram handle
  address?: string                 # Store address
  
  # E-commerce
  currency: string                 # 'INR' (currency code)
  freeShippingThreshold: number    # Free shipping minimum
  shippingCost: number             # Shipping cost
  taxRate?: number                 # Tax percentage
  
  # Operations
  storeOpen: boolean               # Accept orders
  announcementBar?: string         # Site announcement
  
  createdAt: timestamp
  updatedAt: timestamp
}
```

### auditLogs

System audit trail for compliance and debugging.

```firestore
Collection: auditLogs
Document ID: auto-generated

{
  userId: string                   # Admin ID
  userEmail?: string               # Admin email (denormalized)
  action: string                   # Action type
  entityType: string               # 'product'|'order'|'coupon'|etc
  entityId?: string                # Affected entity ID
  
  # Changes
  changes?: object                 # Before/after values
  
  # Context
  ipAddress?: string               # Request IP
  userAgent?: string               # Browser info
  
  timestamp: timestamp             # When it happened
  
  Indexes:
  - userId (ascending)
  - timestamp (descending)
  - entityType (ascending)
  - action (ascending)
}
```

### analytics (Events)

User activity tracking for analytics.

```firestore
Collection: analytics
Document ID: auto-generated

{
  eventName: string                # Event type
  userId?: string                  # Customer ID
  sessionId?: string               # Session ID
  
  properties?: object              # Event-specific data
    - (dynamic based on event type)
  
  timestamp: timestamp
  
  # Consider TTL deletion (90 days) in production
}
```

## Firestore Rules

See `firebase/firestore.rules` for security rules.

Key principles:
- Customers can only read published content
- Customers can only create orders for themselves
- Customers cannot modify admin settings
- Admin operations require server-side validation
- Audit logs are append-only

## Firestore Indexes

Required indexes are defined in `firebase/firestore.indexes.json`.

Deploy with:
```bash
firebase deploy --only firestore:indexes
```

## Data Relationships

```
products
  ├─→ category → categories
  ├─→ collection → collections
  └─→ inventory (embedded)

orders
  ├─→ customerId → users
  ├─→ items → products
  └─→ address (embedded)

collections
  └─→ products (array refs)

coupons
  ├─→ appliedProducts (array refs)
  └─→ appliedCollections (array refs)

auditLogs
  └─→ userId → admins
```

## Denormalization Strategy

For performance, these fields are denormalized (copied):
- `orders.customer` - Copy of user data at time of order
- `orders.items[].product` - Copy of product data at time of order
- `products.stock` - Denormalized from inventory array
- `coupons.usedCount` - Incremented on each use

This trades write performance for read performance.

## Indexes Required

Deploy `firestore.indexes.json` to Firebase:
```bash
firebase deploy --only firestore:indexes
```

Indexes are automatically suggested when you run queries in the Firebase console.

## Storage Structure

### Image Assets

Images are stored with CDN URLs in product and collection documents:
- Product images: `products/{productId}/images/`
- Category images: `categories/{categoryId}/image`
- Collection images: `collections/{collectionId}/heroImage`

## Backup & Recovery

Regular Firestore backups are recommended:
```bash
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)
```

See Google Cloud documentation for restoration procedures.
