import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AccountLayout } from '@/components/AccountLayout'
import { logoutCustomer } from '@/services/customerAuth'
import { getSupabase } from '@/lib/supabase'
import {
  getAccount, saveProfile, addAddress, updateAddress, removeAddress, completeness,
  type CustomerProfile, type SavedAddress, type AddressInput,
} from '@/services/account'
import { media } from '@/config/media'
import '@/styles/store.css'

const GENDERS: { key: CustomerProfile['gender']; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
  { key: 'none', label: 'Prefer not to say' },
]

/* ---------------- Profile details ---------------- */
function ProfileForm({ email }: { email: string }) {
  const [params] = useSearchParams()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [addrCount, setAddrCount] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<CustomerProfile['gender']>('')
  const [dob, setDob] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const apply = (p: CustomerProfile) => { setProfile(p); setName(p.displayName); setPhone(p.phone); setGender(p.gender); setDob(p.dob) }

  useEffect(() => {
    getAccount().then((a) => { apply(a.profile); setAddrCount(a.addresses.length) }).catch((e) => setError(e?.message || 'Could not load your profile'))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return toast.error('Enter your full name')
    if (phone && phone.replace(/\D/g, '').length !== 10) return toast.error('Enter a valid 10-digit mobile number')
    setBusy(true)
    try {
      const res = await saveProfile({ displayName: name.trim(), phone: phone.replace(/\D/g, '').slice(-10), gender, dob })
      apply(res.profile)
      toast.success('Profile saved')
    } catch (err: any) {
      toast.error(err?.message || 'Could not save your profile')
    } finally {
      setBusy(false)
    }
  }

  if (error) return <div className="st-empty">{error}</div>
  if (!profile) return <div className="st-empty">Loading…</div>
  const { percent, missing } = completeness({ ...profile, displayName: name, phone: phone.replace(/\D/g, ''), gender, dob }, addrCount)

  return (
    <form onSubmit={save}>
      {params.get('welcome') && <div className="banner" style={{ marginBottom: 12 }}><b style={{ fontWeight: 500 }}>Welcome to ARCHIVE 854105!</b> Tell us a little about yourself so checkout is quick and we can send delivery updates.</div>}

      <div className="sec-box">
        <b style={{ fontWeight: 500 }}>Profile {percent}% complete</b>
        <div className="meter"><i style={{ width: `${percent}%` }} /></div>
        {missing.length > 0 && <span className="st-sub" style={{ fontSize: '.78rem' }}>Still to add: {missing.join(', ')}.</span>}
      </div>

      <div className="sec-box">
        <h2>Personal information</h2>
        <label className="st-label">Full name</label>
        <input className="st-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />

        <label className="st-label">Gender</label>
        <div className="seg">
          {GENDERS.map((g) => <button type="button" key={g.key} className={gender === g.key ? 'on' : ''} onClick={() => setGender(g.key)}>{g.label}</button>)}
        </div>

        <label className="st-label">Date of birth</label>
        <input className="st-input" type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} />
      </div>

      <div className="sec-box">
        <h2>Contact information</h2>
        <label className="st-label">Email</label>
        <input className="st-input" value={email} readOnly style={{ background: '#f1ede6' }} />
        <label className="st-label">Mobile number</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="st-input" value="+91" readOnly style={{ width: 64, background: '#f1ede6', textAlign: 'center' }} />
          <input className="st-input" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" autoComplete="tel-national" />
        </div>
        <p className="st-sub" style={{ fontSize: '.76rem', margin: '8px 0 0' }}>We only use your number for delivery updates about your orders.</p>
      </div>

      <button className="st-btn block" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    </form>
  )
}

export function AccountProfilePage() {
  return <AccountLayout title="Profile details" subtitle="Keep your details up to date.">{(user) => <ProfileForm email={user.email || ''} />}</AccountLayout>
}

/* ---------------- Saved addresses ---------------- */
const blank: AddressInput = { label: 'Home', name: '', phone: '', street: '', landmark: '', city: 'Katihar', state: 'Bihar', pincode: '', isDefault: false }

function AddressForm({ initial, onCancel, onSaved, defaultName, defaultPhone }: { initial?: SavedAddress; onCancel: () => void; onSaved: (list: SavedAddress[]) => void; defaultName: string; defaultPhone: string }) {
  const [a, setA] = useState<AddressInput>(initial ? { ...initial } : { ...blank, name: defaultName, phone: defaultPhone })
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof AddressInput>(k: K, v: AddressInput[K]) => setA((x) => ({ ...x, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = initial ? await updateAddress(initial.id, a) : await addAddress(a)
      toast.success(initial ? 'Address updated' : 'Address saved')
      onSaved(res.addresses)
    } catch (err: any) {
      toast.error(err?.message || 'Could not save the address')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="sec-box">
      <h2>{initial ? 'Edit address' : 'Add a new address'}</h2>
      <label className="st-label">Address type</label>
      <div className="seg">
        {(['Home', 'Work', 'Other'] as const).map((l) => <button type="button" key={l} className={a.label === l ? 'on' : ''} onClick={() => set('label', l)}>{l}</button>)}
      </div>
      <div className="st-two">
        <div><label className="st-label">Full name</label><input className="st-input" value={a.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></div>
        <div><label className="st-label">Mobile</label><input className="st-input" inputMode="numeric" maxLength={10} value={a.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} autoComplete="tel-national" /></div>
      </div>
      <label className="st-label">Address</label>
      <textarea className="st-input" value={a.street} onChange={(e) => set('street', e.target.value)} placeholder="House no, street, area" />
      <label className="st-label">Landmark (optional)</label>
      <input className="st-input" value={a.landmark} onChange={(e) => set('landmark', e.target.value)} />
      <div className="st-two">
        <div><label className="st-label">City</label><input className="st-input" value={a.city} onChange={(e) => set('city', e.target.value)} /></div>
        <div><label className="st-label">State</label><input className="st-input" value={a.state} onChange={(e) => set('state', e.target.value)} /></div>
      </div>
      <label className="st-label">Pincode</label>
      <input className="st-input" inputMode="numeric" maxLength={6} value={a.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} />
      <label className="opt" style={{ marginTop: 12 }}>
        <input type="checkbox" checked={a.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
        <span>Make this my default address</span>
      </label>
      <div className="st-two" style={{ marginTop: 14 }}>
        <button type="button" className="st-btn ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="st-btn" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
      </div>
    </form>
  )
}

function Addresses() {
  const [list, setList] = useState<SavedAddress[] | null>(null)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [editing, setEditing] = useState<SavedAddress | 'new' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAccount().then((a) => { setList(a.addresses); setProfile(a.profile) }).catch((e) => { setError(e?.message || 'Could not load addresses'); setList([]) })
  }, [])

  const makeDefault = async (a: SavedAddress) => {
    try { setList((await updateAddress(a.id, { ...a, isDefault: true })).addresses); toast.success('Default address updated') } catch (e: any) { toast.error(e?.message || 'Could not update') }
  }
  const remove = async (a: SavedAddress) => {
    if (!window.confirm('Delete this address?')) return
    try { setList((await removeAddress(a.id)).addresses); toast.success('Address deleted') } catch (e: any) { toast.error(e?.message || 'Could not delete') }
  }

  if (list === null) return <div className="st-empty">Loading…</div>

  return (
    <div>
      {error && <div className="st-empty">{error}</div>}
      {editing ? (
        <AddressForm
          initial={editing === 'new' ? undefined : editing}
          defaultName={profile?.displayName || ''}
          defaultPhone={profile?.phone || ''}
          onCancel={() => setEditing(null)}
          onSaved={(l) => { setList(l); setEditing(null) }}
        />
      ) : (
        <>
          <button className="st-btn ghost block" style={{ marginBottom: 12 }} onClick={() => setEditing('new')} disabled={list.length >= 8}>+ Add a new address</button>
          {list.length === 0 && !error && <div className="st-empty">No saved addresses yet. Add one to check out faster.</div>}
          {list.map((a) => (
            <div key={a.id} className={`addr ${a.isDefault ? 'def' : ''}`}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="pill">{a.label}</span>
                {a.isDefault && <span className="pill dim">Default</span>}
              </div>
              <p><b style={{ fontWeight: 500 }}>{a.name}</b> · {a.phone}<br />{a.street}{a.landmark ? `, ${a.landmark}` : ''}<br />{a.city}, {a.state} {a.pincode}</p>
              <div className="addr-actions">
                <button className="link-btn" onClick={() => setEditing(a)}>Edit</button>
                {!a.isDefault && <button className="link-btn" onClick={() => makeDefault(a)}>Set as default</button>}
                <button className="link-btn danger" onClick={() => remove(a)}>Delete</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export function AccountAddressesPage() {
  return <AccountLayout title="Saved addresses" subtitle="Used to fill in checkout for you.">{() => <Addresses />}</AccountLayout>
}

/* ---------------- Password & security ---------------- */
function Security({ email }: { email: string }) {
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)

  const change = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 6) return toast.error('Use at least 6 characters')
    if (pw !== pw2) return toast.error('The two passwords do not match')
    setBusy(true)
    try {
      const { error } = await getSupabase().auth.updateUser({ password: pw })
      if (error) throw error
      setPw(''); setPw2('')
      toast.success('Password changed')
    } catch (err: any) {
      toast.error(err?.message || 'Could not change the password')
    } finally {
      setBusy(false)
    }
  }

  const signOutAll = async () => {
    try { await getSupabase().auth.signOut({ scope: 'global' }); toast.success('Signed out of all devices'); navigate('/') } catch { toast.error('Could not sign out') }
  }

  return (
    <div>
      <form onSubmit={change} className="sec-box">
        <h2>Change password</h2>
        <label className="st-label">New password</label>
        <input className="st-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={6} />
        <label className="st-label">Confirm new password</label>
        <input className="st-input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" minLength={6} />
        <button className="st-btn block" style={{ marginTop: 14 }} disabled={busy || !pw}>{busy ? 'Saving…' : 'Update password'}</button>
      </form>

      <div className="sec-box">
        <h2>Sessions</h2>
        <p className="st-sub" style={{ margin: '0 0 10px' }}>Signed in as {email}</p>
        <div style={{ display: 'grid', gap: 8 }}>
          <button className="st-btn ghost block" onClick={async () => { await logoutCustomer(); toast.success('Signed out'); navigate('/') }}>Sign out</button>
          <button className="st-btn ghost block" onClick={signOutAll}>Sign out of all devices</button>
        </div>
      </div>

      <div className="sec-box">
        <h2>Need to delete your account?</h2>
        <p className="st-sub" style={{ margin: '0 0 10px' }}>Message us and we will remove your account and saved details.</p>
        <a className="st-btn ghost block" href={`https://wa.me/${media.whatsapp}?text=${encodeURIComponent('Hello ARCHIVE 854105, please delete my account: ' + email)}`} target="_blank" rel="noreferrer">Request deletion on WhatsApp</a>
      </div>

      <Link to="/faq" className="st-link">Privacy and help</Link>
    </div>
  )
}

export function AccountSecurityPage() {
  return <AccountLayout title="Password & security">{(user) => <Security email={user.email || ''} />}</AccountLayout>
}
