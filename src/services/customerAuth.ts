import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase'

export function firebaseAuthMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : ''
  if (code.includes('api-key-not-valid')) return 'Customer authentication is temporarily unavailable. Please try again later.'
  if (code.includes('invalid-api-key')) return 'Customer authentication is temporarily unavailable. Please try again later.'
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Invalid email or password.'
  if (code.includes('email-already-in-use')) return 'An account already exists with this email.'
  if (code.includes('weak-password')) return 'Choose a stronger password.'
  if (code.includes('invalid-email')) return 'Enter a valid email address.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait and try again.'
  if (code.includes('network-request-failed')) return 'Network error. Check your connection and try again.'
  return 'Authentication could not be completed. Please try again.'
}

export async function registerCustomer(email: string, password: string, displayName: string) {
  try {
    const auth = getFirebaseAuth()
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    if (displayName.trim()) await updateProfile(credential.user, { displayName: displayName.trim() })
    await sendEmailVerification(credential.user)

    const db = getFirebaseDb()
    await setDoc(doc(db, 'users', credential.user.uid), {
      email: credential.user.email,
      displayName: displayName.trim(),
      role: 'customer',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true })

    return credential.user
  } catch (error) {
    throw new Error(firebaseAuthMessage(error))
  }
}

export async function loginCustomer(email: string, password: string) {
  try {
    const auth = getFirebaseAuth()
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
    return credential.user
  } catch (error) {
    throw new Error(firebaseAuthMessage(error))
  }
}

export async function resetCustomerPassword(email: string) {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim())
  } catch (error) {
    throw new Error(firebaseAuthMessage(error))
  }
}

export function watchCustomerAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback)
}

export async function logoutCustomer() {
  await signOut(getFirebaseAuth())
}
