# Deploy on Vercel
1. Push this folder to GitHub, import it in Vercel (Framework: Vite; settings come from vercel.json).
2. Environment Variables (Project Settings):
   - VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
   - FIREBASE_SERVICE_ACCOUNT_JSON  (whole service-account JSON, or its base64)
   - SESSION_SECRET (long random string), NODE_ENV=production
3. Create the first admin once from your PC: `npm run admin:bootstrap` (uses ADMIN_BOOTSTRAP_* in .env).
4. Admin panel: https://YOUR-SITE.vercel.app/admin
5. Add real GIF/MP4 files to public/media and list them in src/config/media.ts.
