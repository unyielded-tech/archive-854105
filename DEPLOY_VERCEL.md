# Deploy on Vercel (Supabase edition)
1. In Supabase: SQL Editor -> paste supabase/schema.sql -> Run.
2. Vercel -> Project -> Settings -> Environment Variables:
   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET, NODE_ENV=production
3. Create the first admin once: `npm run admin:bootstrap` (needs the SUPABASE_* values and ADMIN_BOOTSTRAP_* in .env).
4. Redeploy. Admin panel: /admin
