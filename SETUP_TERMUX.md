# ARCHIVE 854105 - Setup Guide for Termux

Complete setup instructions for running ARCHIVE 854105 in Termux (Android) or any Linux environment.

## Prerequisites

### Termux Installation

1. Install Termux from F-Droid (recommended) or Google Play Store
2. Grant storage permissions:
   ```bash
   termux-setup-storage
   ```

### System Requirements

- Node.js 18+ 
- npm
- ~500MB free space
- Internet connection for Firebase

## Quick Start (5 minutes)

### 1. Install Node.js

```bash
# Update package manager
pkg update && pkg upgrade -y

# Install Node.js (includes npm)
pkg install nodejs -y

# Verify installation
node --version    # Should be 18.0.0+
npm --version     # Should be 9.0.0+
```

### 2. Clone/Extract Project

```bash
# Create project directory
mkdir -p ~/projects && cd ~/projects

# Extract the archive (if you have a ZIP)
unzip archive-854105-rebuild.zip
cd archive-854105-rebuild

# Or clone if using git
git clone <repository-url>
cd archive-854105-rebuild
```

### 3. Install Dependencies

```bash
npm install

# This may take 3-5 minutes on first install
# You may see some warnings - these are normal
```

### 4. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with your Firebase credentials
nano .env
```

Press Ctrl+X to exit nano after editing.

**Required in .env:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `FIREBASE_ADMIN_SDK_KEY` (path to serviceAccountKey.json)
- `SESSION_SECRET` (random 32+ character string)

### 5. Run Development Servers

```bash
# Terminal 1 - Frontend
npm run dev:client

# Terminal 2 (new session) - Backend
npm run dev:server

# Or run both together
npm run dev
```

**Frontend**: http://localhost:5173
**Backend**: http://localhost:3000
**Admin Login**: http://localhost:5173/admin/login

## Firebase Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name: "ARCHIVE 854105"
4. Enable Firestore Database
5. Enable Authentication (optional for customers)

### Download Service Account Key

1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json` in project root
4. Never commit this file (already in .gitignore)

### Create Firestore Collections

```javascript
// These collections are created automatically on first write
// Or manually create with empty documents:

collections: [
  'admins',
  'products', 
  'categories',
  'collections',
  'orders',
  'users',
  'coupons',
  'articles',
  'lookbooks',
  'pages',
  'settings',
  'auditLogs',
  'analytics'
]
```

### Deploy Firestore Rules

```bash
# Install Firebase CLI (if not already)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Deploy rules and indexes
firebase deploy --only firestore
```

### Create Admin User

1. Add document to `admins` collection:

```json
{
  "email": "admin@archive854105.com",
  "displayName": "Administrator",
  "passwordHash": "$2b$10$...",  // bcrypt hash
  "role": "owner",
  "active": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

2. To generate bcrypt hash:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10))"
```

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Firebase connection issues

- Check `.env` file has correct credentials
- Verify Firestore database is enabled
- Check Firebase rules allow access
- Try: `firebase emulator:start`

### Port already in use

```bash
# Change ports in vite.config.ts
# Or kill existing process:
lsof -ti:5173 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### npm install hangs

```bash
# Try with different registry:
npm install --registry https://registry.npmmirror.com

# Or increase timeout:
npm install --no-audit --prefer-offline
```

## Production Deployment

### Build for Production

```bash
npm run build

# Output in `dist/` directory
# Ready to deploy to Firebase Hosting, Vercel, etc.
```

### Firebase Hosting

```bash
firebase deploy --only hosting
```

### Environment for Production

Update `.env` for production:
- Set `NODE_ENV=production`
- Use strong `SESSION_SECRET`
- Update CORS origin
- Use production Firebase project

## Development Commands

```bash
# Start both servers
npm run dev

# Start only frontend
npm run dev:client

# Start only backend  
npm run dev:server

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Preview production build
npm run preview
```

## File Structure

```
archive-854105-rebuild/
├── src/              # React frontend
├── server/           # Express backend
├── firebase/         # Firestore config
├── public/           # Static assets
├── .env              # Configuration (not in git)
├── .env.example      # Template
├── .gitignore        # Git rules
├── package.json      # Dependencies
├── README.md         # Full documentation
├── DATABASE.md       # Schema documentation
└── SETUP_TERMUX.md   # This file
```

## Useful Commands

### View logs

```bash
# Frontend errors
npm run dev:client 2>&1 | tee client.log

# Backend errors  
npm run dev:server 2>&1 | tee server.log
```

### Database operations

```bash
# Export Firestore
firebase export backup-data --import-dir backups

# View running processes
ps aux | grep node

# Kill process on port
kill -9 $(lsof -t -i:5173)
```

### Environment info

```bash
node --version
npm --version
firebase --version
whoami
pwd
env | grep FIREBASE
```

## Admin Login

1. Open http://localhost:5173/admin/login
2. Email: admin@archive854105.com
3. Password: your-password
4. Submit

You should see the admin dashboard.

## Common Issues

### Issue: "EACCES: permission denied"

```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Issue: CORS errors

Check that backend and frontend are connecting:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Verify vite.config.ts proxy settings

### Issue: Firebase auth fails

1. Check `VITE_FIREBASE_API_KEY` is correct
2. Verify Firebase project is active
3. Check Firestore rules allow public reads
4. Try Firebase emulator:
   ```bash
   firebase emulator:start
   ```

### Issue: Slow npm install

```bash
# Use offline mode
npm install --prefer-offline --no-audit

# Or increase timeout
npm config set fetch-timeout 60000
```

## Performance Tips

### Reduce build time

```bash
# Skip type checking during dev
npm run dev  # Faster

# Type check separately
npm run type-check
```

### Optimize database queries

- Use Firestore indexes
- Limit query results
- Cache frequently accessed data
- Use Zustand for local state

### Monitor performance

- Open DevTools (F12)
- Check Network tab for slow requests
- Profile with DevTools Performance tab

## Next Steps

1. **Implement pages**: Add content to HomePage, ShopPage, etc.
2. **Connect Firestore**: Implement actual data fetching
3. **Admin features**: Implement admin CRUD operations
4. **Payment**: Add Razorpay/Stripe integration
5. **Images**: Set up Cloud Storage or CDN
6. **Email**: Configure SendGrid for notifications

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Termux Wiki](https://wiki.termux.com)
- [Express.js Guide](https://expressjs.com)

## Security Reminders

⚠️ **NEVER commit these files:**
- `.env` (has sensitive keys)
- `serviceAccountKey.json` (has admin credentials)
- `dist/` (production build)
- `node_modules/` (dependencies)

✅ **DO commit:**
- `.env.example` (template only)
- Source code
- Configuration templates
- Documentation

## Success!

If you see both servers running without errors, you're ready to start development:

```
✓ Frontend running on http://localhost:5173
✓ Backend running on http://localhost:3000
✓ Admin portal: http://localhost:5173/admin/login
```

Happy coding! 🚀
