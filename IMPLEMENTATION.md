# ARCHIVE 854105 — Firebase Customer Auth + Local Private Admin

## Architecture

- Public storefront: Firebase Client SDK for customer Email/Password Auth + Firestore reads/writes permitted by Firestore Rules.
- Private admin UI: local Vite development server only (`http://localhost:5173/admin/...`).
- Private admin API: local Express server on `127.0.0.1:8541`.
- Admin database access: Firebase Admin SDK using a server-only service-account JSON file.
- Admin sessions: HttpOnly `express-session` cookie. No admin password in localStorage.
- The production Firebase Hosting build intentionally does not register `/admin/*` routes.

## 1. Install

```bash
cd ~/downloads/archive-854105
npm install
```

## 2. Create `.env`

```bash
cp .env.example .env
openssl rand -hex 32
nano .env
```

Set the Firebase Web App values for the existing `archive-854105` Firebase project. Do not invent a new API key.

Set:

```env
PORT=8541
CLIENT_URL=http://localhost:5173
SESSION_SECRET=<the openssl output>
FIREBASE_PROJECT_ID=archive-854105
FIREBASE_ADMIN_SDK_KEY=./firebase-service-account.json
ADMIN_BOOTSTRAP_EMAIL=your-admin-email
ADMIN_BOOTSTRAP_PASSWORD=<10+ character local admin password>
ADMIN_BOOTSTRAP_NAME=Ayaz Ahmad
ADMIN_BOOTSTRAP_ROLE=owner
```

## 3. Firebase Admin credentials

Download the service-account JSON from Firebase/Google Cloud and save it as:

```text
firebase-service-account.json
```

in the project root. Never put this file in `src/`, `public/`, `dist/`, GitHub, or Firebase Hosting.

## 4. Create your first local admin

```bash
npm run admin:bootstrap
```

The admin account is stored in the Firestore `admins` collection as a bcrypt password hash.

## 5. Run locally

```bash
npm run dev
```

This starts:

- Storefront: `http://localhost:5173`
- Private admin API: `http://127.0.0.1:8541`
- Admin UI: `http://localhost:5173/admin/login`

The admin API only binds to loopback, so it is not publicly reachable.

## 6. Customer Auth

Customer routes:

- `/login`
- `/register`
- `/account`

Firebase Client Auth is lazy. Visiting `/admin/*` does not initialize customer Firebase Auth.

If Firebase returns an API-key error, the UI converts it to a generic authentication-unavailable message. It does not pretend the underlying Firebase configuration is valid; actual customer authentication still requires the existing Firebase Web App configuration to be valid.

## 7. Admin → live website

Admin product/content writes go through:

```text
Local Admin UI
  -> localhost:8541
  -> Firebase Admin SDK
  -> Firestore
  -> Live storefront reads Firestore
```

Normal product/content changes therefore do not require a Firebase Hosting redeploy.

Code/UI changes still require a normal frontend build/deploy.

## 8. Build

```bash
npm run type-check
npm run build
```

## 9. Deploy storefront

After a successful build:

```bash
firebase use archive-854105
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

The local admin API is not deployed by Firebase Hosting.
