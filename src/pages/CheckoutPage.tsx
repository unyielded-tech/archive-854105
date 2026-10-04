import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MainLayout } from '@/layouts/MainLayout'
import { useCartStore } from '@/store/cartStore'
import { applyCoupon } from '@/services/firestore'
import { placeOrder, LAST_ORDER_KEY } from '@/services/orders'
import { getAccount, addAddress, type SavedAddress } from '@/services/account'
import { useCustomer } from '@/lib/useCustomer'
import { inr, imageOf, couponDiscount, shippingFor, SHIPPING } from '@/lib/format'
import type { Coupon } from '@/types'
import '@/styles/store.css'

const SAVED_KEY = 'archive-checkout'
type Form = { name: string; phone: string; email: string; street: string; landmark: string; city: string; state: string; pincode: string }
const blank: Form = { name: '', phone: '', email: '', street: '', landmark: '', city: 'Katihar', state: 'Bihar', pincode: '' }

export function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const couponCode = useCartStore((s) => s.couponCode)
  const clearCart = useCartStore((s) => s.clearCart)
  const [form, setForm] = useState<Form>(() => {
    try { return { ...blank, ...JSON.parse(localStorage.getItem(SAVED_KEY) || '{}') } } catch { return blank }
  })
  const [method, setMethod] = useState<'standard' | 'express'>('standard')
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [busy, setBusy] = useState(false)
  const { user } = useCustomer()
  const [saved, setSaved] = useState<SavedAddress[]>([])
  const [pick, setPick] = useState('')
  const [saveAddr, setSaveAddr] = useState(true)

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  useEffect(() => {
    if (!couponCode) { setCoupon(null); return }
    applyCoupon(couponCode, subtotal).then((c) => setCoupon(c)).catch(() => setCoupon(null))
  }, [couponCode, subtotal])

  const discount = coupon ? couponDiscount(coupon, subtotal) : 0
  const shipping = shippingFor(subtotal - discount, method)
  const total = subtotal - discount + shipping

  const set = (k: keyof Form, v: string) => {
    if (k === 'street' || k === 'pincode') setPick('')
    setForm((f) => ({ ...f, [k]: v }))
  }
  const fill = (a: SavedAddress) => {
    setPick(a.id)
    setForm((f) => ({ ...f, name: a.name, phone: a.phone, street: a.street, landmark: a.landmark, city: a.city, state: a.state, pincode: a.pincode }))
  }

  // Signed-in shoppers get their profile and saved addresses filled in.
  useEffect(() => {
    if (!user) return
    getAccount().then(({ profile, addresses }) => {
      setSaved(addresses)
      setForm((f) => ({ ...f, name: f.name || profile.displayName, phone: f.phone || profile.phone, email: f.email || profile.email }))
      const def = addresses.find((a) => a.isDefault) || addresses[0]
      if (def && !form.street) fill(def)
    }).catch(() => {})
  }, [user?.uid])

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="st-wrap st-empty" style={{ minHeight: '50vh' }}>
          <h1 className="st-page-title">Your bag is empty</h1>
          <Link to="/shop" className="st-btn" style={{ marginTop: 14 }}>Continue shopping</Link>
        </div>
      </MainLayout>
    )
  }

  const submit = async () => {
    const phone = form.phone.replace(/\D/g, '').slice(-10)
    if (form.name.trim().length < 2) return toast.error('Enter your full name')
    if (phone.length !== 10) return toast.error('Enter a valid 10-digit phone number')
    if (form.street.trim().length < 5) return toast.error('Enter your full address')
    if (!form.city.trim() || !form.state.trim()) return toast.error('Enter your city and state')
    if (form.pincode.replace(/\D/g, '').length !== 6) return toast.error('Enter a valid 6-digit pincode')

    setBusy(true)
    try {
      const res = await placeOrder({
        items: items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
        customer: { name: form.name.trim(), phone, email: form.email.trim() },
        address: { street: form.street.trim(), landmark: form.landmark.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.replace(/\D/g, '') },
        shippingMethod: method,
        couponCode: coupon?.code,
      })
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify({ ...form, phone }))
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ orderId: res.orderId, phone }))
      } catch { /* storage may be blocked */ }
      if (user && saveAddr && !pick) {
        addAddress({ label: 'Home', name: form.name.trim(), phone, street: form.street.trim(), landmark: form.landmark.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.replace(/\D/g, ''), isDefault: saved.length === 0 }).catch(() => {})
      }
      clearCart()
      navigate(`/order-confirmation/${res.orderId}`, { replace: true })
    } catch (e: any) {
      toast.error(e?.message || 'Could not place your order')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MainLayout hideFab>
      <div className="st-wrap">
        <h1 className="st-page-title" style={{ paddingTop: 16 }}>Checkout</h1>

        <div className="lay2">
          <div>
            <div className="sec-box">
              <h2>Contact</h2>
              <label className="st-label">Full name</label>
              <input className="st-input" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
              <div className="st-two">
                <div>
                  <label className="st-label">Phone</label>
                  <input className="st-input" inputMode="numeric" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="10-digit mobile" />
                </div>
                <div>
                  <label className="st-label">Email (optional)</label>
                  <input className="st-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
                </div>
              </div>
            </div>

            <div className="sec-box">
              <h2>Delivery address</h2>
              {saved.length > 0 && (
                <>
                  <label className="st-label">Choose a saved address</label>
                  {saved.map((a) => (
                    <label key={a.id} className={`opt ${pick === a.id ? 'on' : ''}`} style={{ alignItems: 'flex-start' }}>
                      <input type="radio" name="saved" checked={pick === a.id} onChange={() => fill(a)} style={{ marginTop: 4 }} />
                      <span style={{ lineHeight: 1.45 }}><b style={{ fontWeight: 500 }}>{a.label}</b> · {a.name}<br />{a.street}, {a.city} {a.pincode}</span>
                    </label>
                  ))}
                </>
              )}
              <label className="st-label">{saved.length > 0 ? 'Or enter an address' : 'Address'}</label>
              <textarea className="st-input" value={form.street} onChange={(e) => set('street', e.target.value)} placeholder="House no, street, area" autoComplete="street-address" />
              <label className="st-label">Landmark (optional)</label>
              <input className="st-input" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} />
              <div className="st-two">
                <div>
                  <label className="st-label">City</label>
                  <input className="st-input" value={form.city} onChange={(e) => set('city', e.target.value)} autoComplete="address-level2" />
                </div>
                <div>
                  <label className="st-label">State</label>
                  <input className="st-input" value={form.state} onChange={(e) => set('state', e.target.value)} autoComplete="address-level1" />
                </div>
              </div>
              <label className="st-label">Pincode</label>
              <input className="st-input" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => set('pincode', e.target.value)} autoComplete="postal-code" />
              {user ? (
                !pick && <label className="opt" style={{ marginTop: 12 }}><input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} /><span>Save this address to my account</span></label>
              ) : (
                <p className="st-sub" style={{ fontSize: '.76rem', margin: '10px 0 0' }}><Link to="/login" style={{ textDecoration: 'underline' }}>Sign in</Link> to use saved addresses and track orders in your account.</p>
              )}
            </div>

            <div className="sec-box">
              <h2>Delivery</h2>
              <label className={`opt ${method === 'standard' ? 'on' : ''}`}>
                <input type="radio" checked={method === 'standard'} onChange={() => setMethod('standard')} />
                <span style={{ flex: 1 }}>Standard · 5–7 days</span>
                <span>{shippingFor(subtotal - discount, 'standard') === 0 ? 'Free' : inr(SHIPPING.standard)}</span>
              </label>
              <label className={`opt ${method === 'express' ? 'on' : ''}`}>
                <input type="radio" checked={method === 'express'} onChange={() => setMethod('express')} />
                <span style={{ flex: 1 }}>Express · 2–3 days</span>
                <span>{inr(SHIPPING.express)}</span>
              </label>
            </div>

            <div className="sec-box">
              <h2>Payment</h2>
              <div className="opt on"><input type="radio" checked readOnly /><span>Cash on delivery — pay when your order arrives</span></div>
            </div>
          </div>

          <div>
            <div className="sum">
              <h2 className="st-title" style={{ fontSize: '1.25rem', marginBottom: 8 }}>Order summary</h2>
              {items.map((i) => (
                <div key={i.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '.85rem' }}>
                  <div className="line-img" style={{ width: 44, height: 54 }}>{i.product && imageOf(i.product) ? <img src={imageOf(i.product)} alt="" /> : null}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ lineHeight: 1.25 }}>{i.product?.name}</div>
                    <div className="st-sub" style={{ fontSize: '.74rem' }}>{[i.size && `Size ${i.size}`, `Qty ${i.quantity}`].join(' · ')}</div>
                  </div>
                  <div>{inr(i.price * i.quantity)}</div>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <div className="sum-row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
                {discount > 0 && <div className="sum-row green"><span>Coupon {coupon?.code}</span><span>−{inr(discount)}</span></div>}
                <div className="sum-row"><span>Delivery</span><span>{shipping === 0 ? 'Free' : inr(shipping)}</span></div>
                <div className="sum-row total"><span>To pay</span><span>{inr(total)}</span></div>
              </div>
            </div>

            <div className="stick-cta">
              <button className="st-btn block" disabled={busy} onClick={submit}>{busy ? 'Placing order…' : `Place order · ${inr(total)}`}</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
