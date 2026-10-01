import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

let initialized = false
let db = null

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '../..')

function loadServiceAccount() {
  // Vercel: paste the service-account JSON (raw or base64) into FIREBASE_SERVICE_ACCOUNT_JSON
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (inline) {
    try {
      const text = inline.trim().startsWith('{') ? inline : Buffer.from(inline, 'base64').toString('utf8')
      const parsed = JSON.parse(text)
      if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
      return parsed
    } catch {}
  }
  const configured = process.env.FIREBASE_ADMIN_SDK_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS
  const candidates = [
    configured,
    resolve(projectRoot, 'serviceAccountKey.json'),
    resolve(projectRoot, 'firebase-service-account.json'),
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      const content = readFileSync(resolve(candidate), 'utf8')
      return JSON.parse(content)
    } catch {}
  }

  return null
}

export function initializeFirebaseAdmin() {
  if (initialized) return db

  if (getApps().length) {
    db = getFirestore()
    initialized = true
    return db
  }

  const serviceAccount = loadServiceAccount()
  if (!serviceAccount) {
    throw new Error(
      'Firebase Admin SDK credentials not found. Set FIREBASE_ADMIN_SDK_KEY or place firebase-service-account.json in the project root.'
    )
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  })

  db = getFirestore()
  initialized = true
  return db
}

export function getFirebaseDb() {
  return initializeFirebaseAdmin()
}

// Compatibility shim so routes can keep using admin.firestore.FieldValue / Timestamp
export const admin = { firestore: Object.assign(() => getFirestore(), { FieldValue, Timestamp }) }
