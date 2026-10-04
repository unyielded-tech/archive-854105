import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { MainLayout } from '@/layouts/MainLayout'
import { useCartStore } from '@/store/cartStore'
import { applyCoupon } from '@/services/firestore'
import { inr, imageOf, couponDiscount, shippingFor, FREE_SHIPPING_ABOVE } from '@/lib/format'
import type { Coupon } from '@/types'
import '@/styles/store.css'

export function CartPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const couponCode = useCartStore((s) => s.couponCode)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const setCoupon = useCartStore((s) => s.applyCoupon)
  const removeCoupon = useCartStore((s) => s.removeCoupon)
  const [code, setCode] = useState('')
  const [coupon, setCouponData] = useState<Coupon | null>(null)

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // Re-check a saved coupon against the current subtotal.
  useEffect(() => {
    if (!couponCode) { setCouponData(null); return }
    applyCoupon(couponCode, subtotal).then((c) => {
      if (c) setCouponData(c)
      else { setCouponData(null); removeCoupon() }
    }).catch(() => {})
  }, [couponCode, subtotal])

  const discount = coupon ? couponDiscount(coupon, subtotal) : 0
  const shipping = shippingFor(subtotal - discount, 'standard')
  const total = subtotal - discount + shipping

  const apply = async () => {
    const c = code.trim().toUpperCase()
    if (!c) return
    try {
      const found = await applyCoupon(c, subtotal)
      if (!found) { toast.error('This coupon is not valid for your bag'); return }
      setCoupon(found.code)
      setCouponData(found)
      setCode('')
      toast.success('Coupon applied')
    } catch {
      toast.error('Could not check the coupon. Try again.')
    }
  }

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="st-wrap st-empty" style={{ minHeight: '50vh' }}>
          <h1 className="st-page-title">Your bag is empty</h1>
          <p className="st-sub" style={{ marginBottom: 16 }}>Add something you love and it will show up here.</p>
          <Link to="/shop" className="st-btn">Continue shopping</Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout hideFab>
      <div className="st-wrap">
        <h1 className="st-page-title" style={{ paddingTop: 16 }}>Shopping bag</h1>
        <p className="st-sub">{items.length} item{items.length === 1 ? '' : 's'}</p>

        <div className="lay2">
          <div>
            {items.map((item) => (
              <div className="line" key={item.id}>
                <Link to={`/product/${item.product?.slug || ''}`} className="line-img">
                  {item.product && imageOf(item.product) ? <img src={imageOf(item.product)} alt="" /> : null}
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/product/${item.product?.slug || ''}`} style={{ fontSize: '.92rem', lineHeight: 1.25, display: 'block' }}>{item.product?.name || 'Product'}</Link>
                  <div className="st-sub" style={{ fontSize: '.78rem', margin: '3px 0 8px' }}>{[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div className="qty">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Less">−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, Math.min(10, item.quantity + 1))} aria-label="More">+</button>
                    </div>
                    <div style={{ fontWeight: 500 }}>{inr(item.price * item.quantity)}</div>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} aria-label="Remove" style={{ background: 'none', border: 0, alignSelf: 'flex-start', padding: 4 }}><Trash2 size={16} /></button>
              </div>
            ))}
            <Link to="/shop" className="st-link" style={{ display: 'inline-block', marginTop: 8 }}>← Continue shopping</Link>
          </div>

          <div>
            <div className="sum">
              <label className="st-label" style={{ marginTop: 0 }}>Coupon code</label>
              {coupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.88rem' }}>
                  <span><b style={{ fontWeight: 500 }}>{coupon.code}</b> applied</span>
                  <button className="st-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={removeCoupon}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="st-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" />
                  <button className="st-btn" style={{ padding: '0 16px' }} onClick={apply}>Apply</button>
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <div className="sum-row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
                {discount > 0 && <div className="sum-row green"><span>Discount</span><span>−{inr(discount)}</span></div>}
                <div className="sum-row"><span>Delivery</span><span>{shipping === 0 ? 'Free' : inr(shipping)}</span></div>
                {shipping > 0 && <p className="st-sub" style={{ fontSize: '.74rem', margin: '2px 0 0' }}>Add {inr(FREE_SHIPPING_ABOVE + 1 - (subtotal - discount))} more for free delivery</p>}
                <div className="sum-row total"><span>Total</span><span>{inr(total)}</span></div>
              </div>
            </div>

            <div className="stick-cta">
              <button className="st-btn block" onClick={() => navigate('/checkout')}>Checkout · {inr(total)}</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
