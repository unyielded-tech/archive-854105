import { initializeApp, type FirebaseApp } from 'firebase/app'
import { 
  getAuth, 
  connectAuthEmulator,
  type Auth 
} from 'firebase/auth'
import { 
  getFirestore, 
  connectFirestoreEmulator,
  type Firestore 
} from 'firebase/firestore'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

// Lazy initialization
export function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (app && auth && db) {
    return { app, auth, db }
  }

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  // Validate config
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error('Firebase customer authentication is not configured. Check the VITE_FIREBASE_* environment variables.')
  }

  try {
    app = initializeApp(config)
    auth = getAuth(app)
    db = getFirestore(app)

    // Use emulator in development if available
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
        connectFirestoreEmulator(db, 'localhost', 8080)
      } catch {
        // Emulator not available, proceed with production
      }
    }

    return { app, auth, db }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    throw error
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const { app: initApp } = initializeFirebase()
    return initApp
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const { auth: initAuth } = initializeFirebase()
    return initAuth
  }
  return auth
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const { db: initDb } = initializeFirebase()
    return initDb
  }
  return db
}

// Utility to check if Firebase is properly initialized
export function isFirebaseReady(): boolean {
  return !!app && !!auth && !!db
}
