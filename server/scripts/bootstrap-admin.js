import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { getFirebaseDb } from '../lib/firebase-admin.js'

const email = String(process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase()
const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '')
const displayName = String(process.env.ADMIN_BOOTSTRAP_NAME || 'Ayaz Ahmad').trim()
const role = String(process.env.ADMIN_BOOTSTRAP_ROLE || 'owner').trim().toLowerCase()

if (!email || !password) {
  console.error('Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in .env before running npm run admin:bootstrap')
  process.exit(1)
}

if (!['owner','admin','editor','inventory','orders'].includes(role)) {
  console.error('Invalid ADMIN_BOOTSTRAP_ROLE')
  process.exit(1)
}

const db = getFirebaseDb()
const ref = db.collection('admins').doc(email.replace(/[^a-z0-9._-]/gi, '_'))
const existing = await ref.get()

if (existing.exists) {
  console.log(`Admin already exists: ${email}`)
  process.exit(0)
}

const passwordHash = await bcrypt.hash(password, 12)
await ref.set({
  email,
  displayName,
  role,
  passwordHash,
  active: true,
  createdAt: new Date(),
  createdBy: 'bootstrap',
  lastLoginAt: null,
  lastLoginIp: null,
})

console.log(`Created ${role} admin: ${email}`)
