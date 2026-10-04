import { authHeader } from '@/services/orders'

export interface CustomerProfile {
  email: string
  displayName: string
  phone: string
  gender: '' | 'male' | 'female' | 'other' | 'none'
  dob: string
  createdAt?: string
}

export interface SavedAddress {
  id: string
  label: 'Home' | 'Work' | 'Other'
  name: string
  phone: string
  street: string
  landmark: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export type AddressInput = Omit<SavedAddress, 'id'>

async function call(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`/api/store/me${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || 'Something went wrong. Please try again.')
  return data
}

export const getAccount = (): Promise<{ profile: CustomerProfile; addresses: SavedAddress[] }> => call('')
export const saveProfile = (p: Pick<CustomerProfile, 'displayName' | 'phone' | 'gender' | 'dob'>): Promise<{ profile: CustomerProfile; addresses: SavedAddress[] }> => call('', 'PUT', p)
export const addAddress = (a: AddressInput): Promise<{ addresses: SavedAddress[] }> => call('/addresses', 'POST', a)
export const updateAddress = (id: string, a: AddressInput): Promise<{ addresses: SavedAddress[] }> => call(`/addresses/${id}`, 'PUT', a)
export const removeAddress = (id: string): Promise<{ addresses: SavedAddress[] }> => call(`/addresses/${id}`, 'DELETE')

// How complete the profile is (name, phone, gender, birthday, one saved address).
export function completeness(p: CustomerProfile | null, addressCount: number) {
  if (!p) return { percent: 0, missing: [] as string[] }
  const checks: [string, boolean][] = [
    ['name', p.displayName.trim().length >= 2],
    ['mobile number', p.phone.length === 10],
    ['gender', !!p.gender],
    ['date of birth', !!p.dob],
    ['a saved address', addressCount > 0],
  ]
  return { percent: Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100), missing: checks.filter(([, ok]) => !ok).map(([n]) => n) }
}
