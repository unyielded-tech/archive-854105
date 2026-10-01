# ARCHIVE 854105 — Deployment Guide

## Overview
This guide covers deploying ARCHIVE 854105 to production environments. The architecture consists of:
- **Frontend**: React + Vite (static assets) → Vercel / Netlify / Firebase Hosting
- **Backend**: Node.js + Express (server-side auth, admin routes) → Vercel / Railway / Render
- **Database**: Firestore (managed by Google Cloud)
- **Storage**: Firebase Storage or Cloudinary (optional)

---

## Pre-Deployment Checklist

- [ ] Environment variables configured (.env)
- [ ] Firebase project created and credentials set up
- [ ] Admin user created in Firestore admins collection
- [ ] Firestore Security Rules updated
- [ ] Payment processor configured (Razorpay/Stripe - optional)
- [ ] SSL certificate for custom domain
- [ ] Email service configured (SendGrid/Mailgun - optional)

---

## Deployment Options

### Option 1: Vercel (Full Stack)

**Best for**: Fast setup, free tier with generous limits

#### Setup
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Configure `vercel.json` in root:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "env": {
       "VITE_FIREBASE_API_KEY": "@firebase_api_key",
       "VITE_FIREBASE_AUTH_DOMAIN": "@firebase_auth_domain"
     },
     "functions": {
       "server/**/*.js": {
         "memory": 512,
         "maxDuration": 60
       }
     }
   }
   ```

3. Deploy frontend:
   ```bash
   npm run build
   vercel --prod
   ```

4. Deploy backend as serverless functions:
   ```bash
   mkdir -p api
   cp -r server/* api/
   vercel deploy --prod
   ```

5. Update Vite config for API:
   ```typescript
   export default {
     server: {
       proxy: {
         '/api': 'https://your-vercel-backend.vercel.app'
       }
     }
   }
   ```

### Option 2: Railway.app

**Best for**: Simple one-click deployment

1. Connect GitHub repo to Railway
2. Set environment variables:
   - `NODE_ENV=production`
   - `SESSION_SECRET=your-secret`
   - `FIREBASE_ADMIN_SDK_KEY=your-key`
3. Deploy button handles everything

### Option 3: Docker + AWS/GCP

**Best for**: Enterprise deployments

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Frontend build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:client

# Backend dependencies
RUN npm ci --production

EXPOSE 3000

CMD ["npm", "run", "start:server"]
```

#### Build & Deploy
```bash
docker build -t archive-854105 .
docker tag archive-854105 gcr.io/your-project/archive-854105
docker push gcr.io/your-project/archive-854105

# GCP Cloud Run
gcloud run deploy archive-854105 \
  --image gcr.io/your-project/archive-854105 \
  --platform managed \
  --region us-central1 \
  --set-env-vars SESSION_SECRET=xxx,FIREBASE_ADMIN_SDK_KEY=yyy
```

---

## Environment Variables (Production)

Create `.env.production`:
```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Server
NODE_ENV=production
SESSION_SECRET=your-very-secure-session-secret-min-32-chars
FIREBASE_ADMIN_SDK_KEY=path/to/serviceAccountKey.json
CLIENT_URL=https://yourdomain.com
PORT=3000

# Optional: Payment
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Optional: Email
SENDGRID_API_KEY=

# Optional: Storage
CLOUDINARY_URL=
```

---

## Firestore Security Rules (Production)

Update Security Rules in Firebase Console:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public collections (read-only published content)
    match /products/{doc=**} {
      allow read: if resource.data.published == true;
      allow write: if false;
    }
    
    match /categories/{doc=**} {
      allow read: if resource.data.published == true;
      allow write: if false;
    }
    
    match /collections/{doc=**} {
      allow read: if resource.data.published == true;
      allow write: if false;
    }
    
    match /articles/{doc=**} {
      allow read: if resource.data.published == true;
      allow write: if false;
    }
    
    // User data (own only)
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /addresses/{doc=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Orders
    match /orders/{orderId} {
      allow create: if request.auth.uid == request.resource.data.customerId;
      allow read: if request.auth.uid == resource.data.customerId;
      allow write: if false;
    }
    
    // Admin collection - never readable from client
    match /admins/{doc=**} {
      allow read, write: if false;
    }
    
    // Audit logs - never readable from client
    match /auditLogs/{doc=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Database Indexes

Firestore requires composite indexes for complex queries. In Firebase Console:

**Products Collection**:
- `category` + `published` + `createdAt` (Descending)
- `featured` + `published` + `createdAt` (Descending)
- `sale` + `published` + `createdAt` (Descending)

**Orders Collection**:
- `customerId` + `createdAt` (Descending)
- `status` + `createdAt` (Descending)
- `paymentStatus` + `createdAt` (Descending)

**Articles Collection**:
- `published` + `publishedAt` (Descending)
- `category` + `published` + `publishedAt` (Descending)

---

## Custom Domain & SSL

### Vercel
1. Add domain in Vercel dashboard
2. Update DNS records
3. SSL handled automatically

### Firebase Hosting
```bash
firebase hosting:sites:create
firebase deploy --only hosting
```

### Let's Encrypt (Self-hosted)
```bash
certbot certonly --standalone -d yourdomain.com
# Update server config with cert paths
```

---

## CDN & Image Optimization

### Cloudinary Integration
1. Sign up at cloudinary.com
2. Add to env: `VITE_CLOUDINARY_CLOUD_NAME`
3. Update image URLs in code:

```typescript
// Before
<img src="/uploads/product.jpg" />

// After
<img src={`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_800,q_auto/product.jpg`} />
```

---

## Monitoring & Analytics

### Sentry (Error Tracking)
```bash
npm install --save @sentry/react @sentry/express
```

```typescript
// Frontend (main.tsx)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

```javascript
// Backend (index.js)
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "your-sentry-dsn" });
```

### Google Analytics
```typescript
import { initializeAnalytics } from '@/services/analytics'

initializeAnalytics()
```

---

## Performance Optimization

### Frontend
- ✅ Image optimization (next/image or similar)
- ✅ Code splitting (React Router lazy loading)
- ✅ Gzip compression (Vercel handles automatically)
- ✅ HTTP/2 Server Push
- ✅ Service Worker for offline support

### Backend
- ✅ Database indexing (see above)
- ✅ Connection pooling (Firebase SDK handles)
- ✅ Caching headers for static assets
- ✅ API response compression
- ✅ Rate limiting (implemented in middleware)

---

## Testing Before Production

```bash
# Frontend tests
npm run test

# Build validation
npm run build
npm run preview

# Backend tests
npm run test:server

# Lighthouse audit
npm run audit
```

---

## Deployment Checklist

```bash
# 1. Security
- [ ] Environment variables NOT in git
- [ ] Firestore rules updated
- [ ] CORS configured correctly
- [ ] SSL certificate enabled
- [ ] Admin credentials secured

# 2. Performance
- [ ] Images optimized
- [ ] Code bundled & minified
- [ ] Database indexes created
- [ ] Caching headers configured
- [ ] CDN enabled

# 3. Monitoring
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Logging set up
- [ ] Health checks working
- [ ] Alerts configured

# 4. Backup & Recovery
- [ ] Database backups scheduled
- [ ] Storage backups configured
- [ ] Recovery plan documented
- [ ] Disaster recovery tested
```

---

## Production Support

**Issues? Check:**
1. Cloud Firestore quota (Settings → Usage)
2. Error logs (Cloud Logging)
3. Vercel Analytics (Performance)
4. Browser console (Client errors)
5. Network tab (API responses)

**Common Issues:**

❌ "CORS error"
→ Check `firebase.json` and server CORS middleware

❌ "Firestore document not found"
→ Verify collection name and document ID

❌ "Session cookie expired"
→ Extend `maxAge` in server session config or refresh

❌ "Image not loading"
→ Check Firebase Storage bucket CORS settings

---

## Rollback Procedure

```bash
# Vercel
vercel rollback

# Firebase
firebase deploy --only hosting:production

# Railway
railway rollback [DEPLOYMENT_ID]

# Docker (AWS)
aws ecs update-service --cluster prod --service archive-854105 --desired-count 0
# Redeploy previous image version
```

---

## Cost Optimization

| Service | Free Tier | Production |
|---------|-----------|-----------|
| Firestore | 25k reads/day | ~$5-20/month |
| Firebase Auth | 50k MAU | ~$1-5/month |
| Cloud Storage | 5GB | ~$0.02/GB/month |
| Vercel | 100GB/month | ~$20/month |
| Analytics | Free | Free |

**Total estimated**: ~$50-100/month for moderate traffic

---

## Getting Help

- Firebase Docs: https://firebase.google.com/docs
- Vercel Docs: https://vercel.com/docs
- GitHub Issues: [your-repo]
- Support: hello@archive854105.com

---

**Last Updated:** September 26, 2024
**Maintained By:** ARCHIVE 854105 Team
