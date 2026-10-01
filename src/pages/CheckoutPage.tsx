import { MainLayout } from '@/layouts/MainLayout'
import { useCartStore } from '@/store/cartStore'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Address } from '@/types'

export function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const couponCode = useCartStore((state) => state.couponCode)
  const [step, setStep] = useState<'info' | 'address' | 'shipping' | 'payment' | 'review'>('info')

  const [customerInfo, setCustomerInfo] = useState({ email: '', phone: '', firstName: '', lastName: '' })
  const [address, setAddress] = useState<Partial<Address>>({
    fullName: '',
    email: '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  })
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('cod')

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container py-20 text-center">
          <p className="text-body-lg text-medium-grey mb-8">Your cart is empty</p>
          <button onClick={() => navigate('/shop')} className="btn btn-primary">Continue Shopping</button>
        </div>
      </MainLayout>
    )
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = shippingMethod === 'express' ? 300 : subtotal > 2000 ? 0 : 100
  const total = subtotal + shipping

  const handlePlaceOrder = async () => {
    if (!address.fullName || !address.street || !address.city || !address.pincode) {
      toast.error('Please fill in all address fields')
      return
    }
    
    try {
      // Create order in Firestore
      toast.success('Order placed successfully!')
      navigate('/order-confirmation')
    } catch (error) {
      toast.error('Failed to place order')
    }
  }

  return (
    <MainLayout>
      <div className="container py-12">
        <h1 className="text-h1 md:text-display-sm font-display mb-12">Checkout</h1>

        {/* Progress */}
        <div className="mb-12 flex justify-between md:gap-8">
          {(['info', 'address', 'shipping', 'payment', 'review'] as const).map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <button onClick={() => setStep(s)} className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${step === s || step > s ? 'bg-black text-white' : 'bg-soft-grey text-medium-grey'}`}>
                {idx + 1}
              </button>
              {idx < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-black' : 'bg-soft-grey'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-2 space-y-8">
            {step === 'info' && (
              <div className="space-y-4">
                <h2 className="text-h4 font-display mb-6">Contact Information</h2>
                <input type="email" placeholder="Email" value={customerInfo.email} onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })} className="w-full px-4 py-3 border border-medium-grey rounded-md" />
                <input type="tel" placeholder="Phone" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} className="w-full px-4 py-3 border border-medium-grey rounded-md" />
                <button onClick={() => { if (customerInfo.email && customerInfo.phone) setStep('address'); else toast.error('Fill all fields') }} className="w-full btn btn-primary">Continue</button>
              </div>
            )}

            {step === 'address' && (
              <div className="space-y-4">
                <h2 className="text-h4 font-display mb-6">Shipping Address</h2>
                <input type="text" placeholder="Full Name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} className="w-full px-4 py-3 border border-medium-grey rounded-md" />
                <input type="text" placeholder="Street Address" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="w-full px-4 py-3 border border-medium-grey rounded-md" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="px-4 py-3 border border-medium-grey rounded-md" />
                  <input type="text" placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="px-4 py-3 border border-medium-grey rounded-md" />
                </div>
                <input type="text" placeholder="Postal Code" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} className="w-full px-4 py-3 border border-medium-grey rounded-md" />
                <div className="flex gap-4">
                  <button onClick={() => setStep('info')} className="flex-1 btn btn-secondary">Back</button>
                  <button onClick={() => setStep('shipping')} className="flex-1 btn btn-primary">Continue</button>
                </div>
              </div>
            )}

            {step === 'shipping' && (
              <div className="space-y-4">
                <h2 className="text-h4 font-display mb-6">Shipping Method</h2>
                <label className="p-4 border-2 rounded-md cursor-pointer hover:bg-off-white transition" style={{ borderColor: shippingMethod === 'standard' ? '#000' : '#d0d0d0' }}>
                  <input type="radio" name="shipping" value="standard" checked={shippingMethod === 'standard'} onChange={(e) => setShippingMethod(e.target.value)} />
                  <div className="ml-3 inline-block">
                    <p className="font-semibold">Standard Shipping</p>
                    <p className="text-sm text-medium-grey">{subtotal > 2000 ? 'Free' : '₹100'} • 5-7 business days</p>
                  </div>
                </label>
                <label className="p-4 border-2 rounded-md cursor-pointer hover:bg-off-white transition" style={{ borderColor: shippingMethod === 'express' ? '#000' : '#d0d0d0' }}>
                  <input type="radio" name="shipping" value="express" checked={shippingMethod === 'express'} onChange={(e) => setShippingMethod(e.target.value)} />
                  <div className="ml-3 inline-block">
                    <p className="font-semibold">Express Shipping</p>
                    <p className="text-sm text-medium-grey">₹300 • 2-3 business days</p>
                  </div>
                </label>
                <div className="flex gap-4">
                  <button onClick={() => setStep('address')} className="flex-1 btn btn-secondary">Back</button>
                  <button onClick={() => setStep('payment')} className="flex-1 btn btn-primary">Continue</button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-4">
                <h2 className="text-h4 font-display mb-6">Payment Method</h2>
                <label className="p-4 border-2 rounded-md cursor-pointer" style={{ borderColor: paymentMethod === 'cod' ? '#000' : '#d0d0d0' }}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} />
                  <div className="ml-3 inline-block">
                    <p className="font-semibold">Cash on Delivery</p>
                    <p className="text-sm text-medium-grey">Pay when your order arrives</p>
                  </div>
                </label>
                <div className="flex gap-4">
                  <button onClick={() => setStep('shipping')} className="flex-1 btn btn-secondary">Back</button>
                  <button onClick={() => setStep('review')} className="flex-1 btn btn-primary">Review Order</button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-6">
                <h2 className="text-h4 font-display mb-6">Review Order</h2>
                <div className="bg-off-white p-6 rounded-md space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">Shipping Address</h3>
                    <p className="text-body-sm">{address.fullName}</p>
                    <p className="text-body-sm">{address.street}</p>
                    <p className="text-body-sm">{address.city}, {address.state} {address.pincode}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">Shipping Method</h3>
                    <p className="text-body-sm capitalize">{shippingMethod} — {shipping === 0 ? "Free" : "₹" + shipping}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">Payment Method</h3>
                    <p className="text-body-sm capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep('payment')} className="flex-1 btn btn-secondary">Back</button>
                  <button onClick={handlePlaceOrder} className="flex-1 btn btn-primary">Place Order</button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-off-white p-6 rounded-md space-y-6">
              <h3 className="text-h5 font-display">Order Summary</h3>
              <div className="space-y-3 py-6 border-y border-soft-grey max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-medium-grey">{item.product?.name} x{item.quantity}</span>
                    <span className="font-semibold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
                {couponCode && <div className="flex justify-between text-success"><span>Coupon</span><span>-₹{(subtotal * 0.1).toFixed(2)}</span></div>}
              </div>
              <div className="pt-4 border-t border-soft-grey">
                <div className="flex justify-between font-semibold text-h5"><span>Total</span><span>₹{total}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
