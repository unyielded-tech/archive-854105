import express from 'express'
import { randomUUID } from 'node:crypto'
import { getFirebaseDb, initializeFirebaseAdmin } from '../lib/firebase-admin.js'

// Signed-in customer profile + saved addresses. Every route needs the customer's login token.
const router = express.Router()
const db = () => getFirebaseDb()

const GENDERS = ['male', 'female', 'other', 'none']
const LABELS = ['Home', 'Work', 'Other']
const MAX_ADDRESSES = 8

const str = (v, max = 200) => String(v ?? '').trim().slice(0, max)
const phone10 = (v) => String(v || '').replace(/\D/g, '').slice(-10)

async function auth(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer /i, '')
  if (!token) return res.status(401).json({ error: 'Please sign in' })
  try {
    const { data, error } = await initializeFirebaseAdmin().auth.getUser(token)
    if (error || !data?.user) return res.status(401).json({ error: 'Please sign in again' })
    req.user = data.user
    next()
  } catch {
    res.status(401).json({ error: 'Please sign in again' })
  }
}
router.use(auth)

async function load(user) {
  const snap = await db().collection('users').doc(user.id).get()
  const d = snap.exists ? snap.data() : {}
  return {
    profile: {
      email: user.email || '',
      displayName: d.displayName || user.user_metadata?.displayName || '',
      phone: d.phone || '',
      gender: d.gender || '',
      dob: d.dob || '',
      createdAt: d.createdAt || user.created_at || '',
    },
    addresses: Array.isArray(d.addresses) ? d.addresses : [],
  }
}

async function save(user, patch) {
  await db().collection('users').doc(user.id).set({
    email: user.email,
    role: 'customer',
    ...patch,
    updatedAt: new Date().toISOString(),
  }, { merge: true })
}

function cleanAddress(a, existing) {
  const out = {
    id: existing?.id || randomUUID().replace(/-/g, '').slice(0, 12),
    label: LABELS.includes(a.label) ? a.label : 'Home',
    name: str(a.name, 80),
    phone: phone10(a.phone),
    street: str(a.street, 200),
    landmark: str(a.landmark, 120),
    city: str(a.city, 80),
    state: str(a.state, 80),
    pincode: String(a.pincode || '').replace(/\D/g, ''),
    isDefault: a.isDefault === true,
  }
  if (out.name.length < 2) return { error: 'Enter the full name' }
  if (out.phone.length !== 10) return { error: 'Enter a valid 10-digit phone number' }
  if (out.street.length < 5) return { error: 'Enter the full street address' }
  if (out.city.length < 2 || out.state.length < 2) return { error: 'Enter the city and state' }
  if (out.pincode.length !== 6) return { error: 'Enter a valid 6-digit pincode' }
  return { address: out }
}

// GET /api/store/me
router.get('/', async (req, res) => {
  try {
    res.json(await load(req.user))
  } catch (e) {
    console.error('Load profile error:', e)
    res.status(500).json({ error: 'Could not load your profile' })
  }
})

// PUT /api/store/me
router.put('/', async (req, res) => {
  try {
    const b = req.body || {}
    const name = str(b.displayName, 80)
    const phone = phone10(b.phone)
    const gender = GENDERS.includes(b.gender) ? b.gender : ''
    const dob = str(b.dob, 10)

    if (name.length < 2) return res.status(400).json({ error: 'Enter your full name' })
    if (b.phone && phone.length !== 10) return res.status(400).json({ error: 'Enter a valid 10-digit phone number' })
    if (dob) {
      const t = new Date(dob).getTime()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(t) || t > Date.now() || t < new Date('1900-01-01').getTime()) {
        return res.status(400).json({ error: 'Enter a valid date of birth' })
      }
    }

    await save(req.user, { displayName: name, phone, phoneNumber: phone, gender, dob })
    res.json(await load(req.user))
  } catch (e) {
    console.error('Save profile error:', e)
    res.status(500).json({ error: 'Could not save your profile' })
  }
})

// POST /api/store/me/addresses
router.post('/addresses', async (req, res) => {
  try {
    const cur = await load(req.user)
    if (cur.addresses.length >= MAX_ADDRESSES) return res.status(400).json({ error: `You can save up to ${MAX_ADDRESSES} addresses` })
    const { address, error } = cleanAddress(req.body || {})
    if (error) return res.status(400).json({ error })

    let list = [...cur.addresses]
    if (address.isDefault || list.length === 0) {
      address.isDefault = true
      list = list.map((a) => ({ ...a, isDefault: false }))
    }
    list.push(address)
    await save(req.user, { addresses: list })
    res.status(201).json({ addresses: list })
  } catch (e) {
    console.error('Add address error:', e)
    res.status(500).json({ error: 'Could not save the address' })
  }
})

// PUT /api/store/me/addresses/:id
router.put('/addresses/:id', async (req, res) => {
  try {
    const cur = await load(req.user)
    const old = cur.addresses.find((a) => a.id === req.params.id)
    if (!old) return res.status(404).json({ error: 'Address not found' })
    const { address, error } = cleanAddress(req.body || {}, old)
    if (error) return res.status(400).json({ error })

    let list = cur.addresses.map((a) => (a.id === old.id ? address : a))
    if (address.isDefault) list = list.map((a) => ({ ...a, isDefault: a.id === address.id }))
    if (!list.some((a) => a.isDefault) && list.length) list[0].isDefault = true
    await save(req.user, { addresses: list })
    res.json({ addresses: list })
  } catch (e) {
    console.error('Update address error:', e)
    res.status(500).json({ error: 'Could not update the address' })
  }
})

// DELETE /api/store/me/addresses/:id
router.delete('/addresses/:id', async (req, res) => {
  try {
    const cur = await load(req.user)
    let list = cur.addresses.filter((a) => a.id !== req.params.id)
    if (list.length && !list.some((a) => a.isDefault)) list[0] = { ...list[0], isDefault: true }
    await save(req.user, { addresses: list })
    res.json({ addresses: list })
  } catch (e) {
    console.error('Delete address error:', e)
    res.status(500).json({ error: 'Could not delete the address' })
  }
})

export default router
