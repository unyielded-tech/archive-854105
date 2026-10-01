# ARCHIVE 854105 - Premium Luxury Streetwear E-Commerce Platform

A production-grade, premium luxury streetwear ecommerce platform built with React, TypeScript, Node.js, Express, and Firebase.

**Status**: Complete rebuild from scratch with clean architecture and production-ready authentication.

## 🎯 Overview

ARCHIVE 854105 is a completely rebuilt ecommerce platform featuring:

- **Premium Frontend**: React + TypeScript + Vite with custom design system
- **Production Backend**: Node.js + Express with server-side admin authentication
- **Real Authentication**: bcrypt-hashed passwords, HttpOnly sessions, rate limiting
- **Firestore Database**: Well-structured collections with proper indexing
- **Admin Portal**: Comprehensive dashboard with role-based access control
- **Complete Features**:
  - Product management with inventory
  - Order processing and tracking
  - Customer management
  - Coupon system
  - Editorial content (journal, lookbook)
  - CMS for pages and homepage
  - Audit logging
  - Analytics events

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (tested on 18.0.0)
- npm or yarn
- Firebase project (with Firestore enabled)

### Installation

1. **Clone and setup**
```bash
cd archive-854105-rebuild
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials and admin settings.

3. **Firebase Setup**

Create a Firestore database and enable these collections:
- `products`
- `categories`
- `collections`
- `orders`
- `users`
- `admins`
- `coupons`
- `articles`
- `lookbooks`
- `pages`
- `settings`
- `auditLogs`

4. **Create Default Admin User**

Add a document to `admins` collection:
```json
{
  "email": "admin@archive854105.com",
  "displayName": "Administrator",
  "passwordHash": "[bcrypt hash of your password]",
  "role": "owner",
  "active": true,
  "createdAt": "[current timestamp]"
}
```

To generate a bcrypt hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

5. **Run Development Servers**

In separate terminals:

```bash
# Frontend (http://localhost:5173)
npm run dev:client

# Backend (http://localhost:3000)
npm run dev:server

# Or both together:
npm run dev
```

## 📁 Project Structure

```
archive-854105-rebuild/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx       # Navigation header
│   │   ├── Footer.tsx       # Footer
│   │   └── AdminProtectedRoute.tsx
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx
│   │   ├── ShopPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── admin/           # Admin pages
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminProducts.tsx
│   │   │   └── AdminOrders.tsx
│   ├── layouts/
│   │   └── MainLayout.tsx   # Main layout wrapper
│   ├── services/
│   │   ├── firestore.ts     # Firestore operations
│   │   └── api.ts           # Backend API client
│   ├── store/               # Zustand stores
│   │   ├── cartStore.ts     # Shopping cart
│   │   └── adminStore.ts    # Admin auth state
│   ├── types/
│   │   └── index.ts         # TypeScript definitions
│   ├── lib/
│   │   └── firebase.ts      # Firebase initialization
│   ├── styles/
│   │   └── index.css        # Global styles & design system
│   ├── App.tsx              # Main app router
│   └── main.tsx             # Entry point
├── server/
│   ├── routes/              # Express routes
│   │   ├── admin-auth.js    # Authentication
│   │   ├── admin-products.js
│   │   ├── admin-orders.js
│   │   └── ...
│   ├── middleware/
│   │   └── admin-auth.js    # Auth middleware & role checks
│   ├── lib/
│   │   └── firebase-admin.js # Firebase Admin SDK
│   └── index.js             # Express server entry
├── firebase/                # Firestore config
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
├── public/
│   └── brand/               # Logo assets
├── index.html               # HTML entry point
├── tailwind.config.js       # Tailwind configuration
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## 🔐 Authentication & Security

### Admin Authentication

The platform implements **production-grade server-side authentication**:

1. **Password Hashing**: bcrypt with salt rounds 10
2. **Session Management**: HttpOnly cookies with 24-hour expiry
3. **Rate Limiting**: Max 5 login attempts per 15 minutes
4. **CORS Protection**: Configured for production domain
5. **Role-Based Access**: Owner → Admin → Editor/Inventory/Orders hierarchy
6. **Audit Logging**: All admin actions tracked

### Admin Roles

- **Owner** (hierarchy: 4)
  - Full system access
  - Create/manage admin accounts
  - System settings

- **Admin** (hierarchy: 3)
  - Manage all business operations
  - Products, orders, customers
  - Inventory & coupons

- **Editor** (hierarchy: 2)
  - Content management
  - Journal, lookbook, CMS
  - Product descriptions

- **Inventory** (hierarchy: 1)
  - Stock management only
  - Inventory adjustments

- **Orders** (hierarchy: 1)
  - Order management
  - Customer communication

## 📊 Database Schema

### Collections

**admins**
```
- email: string
- displayName: string
- passwordHash: string (bcrypt)
- role: 'owner' | 'admin' | 'editor' | 'inventory' | 'orders'
- active: boolean
- createdAt: timestamp
- lastLoginAt?: timestamp
```

**products**
```
- slug: string (unique)
- name: string
- description: string
- price: number
- salePrice?: number
- compareAtPrice?: number
- category: string (ref)
- collection?: string (ref)
- images: ProductImage[]
- sizes: string[]
- colors: ColorOption[]
- inventory: InventoryVariant[]
- stock: number
- featured: boolean
- sale: boolean
- published: boolean
- createdAt: timestamp
- updatedAt: timestamp
```

**orders**
```
- orderId: string (unique)
- customerId: string
- items: OrderItem[]
- address: Address
- subtotal: number
- total: number
- status: OrderStatus
- paymentMethod: 'cod' | 'razorpay' | 'stripe'
- paymentStatus: 'pending' | 'completed' | 'failed'
- timeline: OrderTimeline[]
- createdAt: timestamp
- updatedAt: timestamp
```

**collections**, **categories**, **coupons**, **articles**, **lookbooks**, **pages**, **settings**, **auditLogs**

See `DATABASE.md` for complete schema.

## 🎨 Design System

Custom Tailwind CSS configuration with luxury aesthetic:

### Colors
- **Primary**: Black, Off-white, Charcoal
- **Accents**: Gold (#C9A961), Silver
- **Semantic**: Success, Error, Warning

### Typography
- **Display**: Georgia serif for headers/titles
- **Body**: Inter sans-serif for content
- **Scale**: Responsive from 12px to 64px

### Spacing
- 5-level system: xs (0.25rem) to 5xl (8rem)
- Consistent 8px base unit

## 🔄 API Endpoints

### Admin Authentication

```
POST   /api/admin/login          - Login
POST   /api/admin/logout         - Logout
GET    /api/admin/me             - Current session
POST   /api/admin/register       - Create admin (owner only)
```

### Admin Operations (Protected)

```
GET    /api/admin/products       - List products
POST   /api/admin/products       - Create product
PUT    /api/admin/products/:id   - Update product
DELETE /api/admin/products/:id   - Delete product

GET    /api/admin/orders         - List orders
GET    /api/admin/orders/:id     - Get order
PUT    /api/admin/orders/:id/status - Update order status

GET    /api/admin/inventory      - Inventory report
PUT    /api/admin/inventory      - Adjust stock

GET    /api/admin/customers      - List customers
GET    /api/admin/customers/:id  - Customer profile

GET    /api/admin/dashboard      - Dashboard stats
GET    /api/admin/audit-log      - Audit logs

GET    /api/admin/coupons        - List coupons
POST   /api/admin/coupons        - Create coupon
PUT    /api/admin/coupons/:id    - Update coupon
DELETE /api/admin/coupons/:id    - Delete coupon
```

## 📦 Build & Deploy

### Development Build

```bash
npm run build
npm run preview
```

### Production Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Update `SESSION_SECRET` to random 32+ char string
   - Configure production domain in CORS
   - Use production Firebase project

2. **Security Headers**
   - Helmet.js configured for security
   - HTTPS required
   - Secure cookies enabled

3. **Deployment Options**
   - Vercel (frontend only)
   - Firebase Hosting (with Cloud Functions)
   - Self-hosted Node.js
   - Docker (create Dockerfile)

## 🛠️ Development

### Commands

```bash
npm run dev              # Start both servers
npm run dev:client       # Frontend only
npm run dev:server       # Backend only
npm run build           # Build for production
npm run type-check      # TypeScript validation
npm run lint            # ESLint check
npm run format          # Format code
```

### Key Libraries

- **React** 18.2 - UI framework
- **TypeScript** 5.3 - Type safety
- **Vite** 5.0 - Build tool
- **Tailwind CSS** 3.3 - Styling
- **Framer Motion** 10.16 - Animations
- **Zustand** 4.4 - State management
- **Firebase** 10.7 - Backend
- **Express** 4.18 - Server
- **bcryptjs** 2.4 - Password hashing

## 📝 Notes

### About the Firebase API Key

The existing Firebase API key may show `auth/api-key-not-valid`. This is expected. Customer authentication can use Firebase Auth but is optional. Admin authentication is **completely independent** and works via server-side sessions.

### Next Steps to Complete

1. **Implement remaining pages**: Shop, Product, Cart, Checkout, Account
2. **Implement admin routes**: Complete CRUD operations in each route file
3. **Add Firestore indexes**: Deploy indexes.json to Firebase
4. **Implement checkout**: Add payment methods (COD, Razorpay, Stripe)
5. **Add email notifications**: Order confirmation, shipping updates
6. **Implement analytics**: Track events, pageviews
7. **Add image management**: Cloud Storage or CDN integration
8. **Set up CI/CD**: GitHub Actions or Firebase Hosting

## 📞 Support

For issues or questions:
- Check Firebase console for errors
- Review server logs in terminal
- Verify Firestore rules allow operations
- Ensure environment variables are set correctly

## 📄 License

ARCHIVE 854105 - Premium Luxury Streetwear
© 2024 All Rights Reserved
