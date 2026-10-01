import { MainLayout } from '@/layouts/MainLayout'
import { useCartStore } from '@/store/cartStore'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useState } from 'react'

export function CartPage() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const [couponCode, setCouponCode] = useState('')

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 2000 ? 0 : 100
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container py-20 text-center">
          <h1 className="text-h1 mb-4">Shopping Bag</h1>
          <p className="text-body-lg text-medium-grey mb-8">Your bag is empty</p>
          <Link to="/shop" className="btn btn-primary btn-lg">Continue Shopping</Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container py-12">
        <h1 className="text-h1 md:text-display-sm font-display mb-12">Shopping Bag</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="space-y-6 border-b border-soft-grey pb-8 mb-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-6">
                  {/* Image */}
                  <Link to={`/product/${item.product?.slug || ''}`} className="flex-shrink-0">
                    <div className="w-24 h-24 bg-off-white rounded-md overflow-hidden">
                      {item.product?.images[0] && (
                        <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1">
                    <Link to={`/product/${item.product?.slug || ''}`} className="text-body-md font-semibold hover:opacity-75">
                      {item.product?.name || 'Product'}
                    </Link>
                    <div className="text-body-sm text-medium-grey mt-1 space-y-0.5">
                      <p>Size: {item.size}</p>
                      <p>Color: {item.color}</p>
                    </div>
                    <p className="text-body-md font-semibold mt-3">₹{item.price}</p>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeItem(item.id)} className="p-2 hover:bg-off-white rounded-md transition">
                      <Trash2 size={16} />
                    </button>

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-medium-grey rounded-md">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-off-white">
                        <Minus size={14} />
                      </button>
                      <span className="px-3 py-1 text-sm font-semibold min-w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-off-white">
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Line total */}
                    <p className="text-body-md font-semibold">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <Link to="/shop" className="text-sm uppercase tracking-wider font-semibold hover:opacity-75">
              ← Continue Shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-off-white p-6 rounded-md space-y-6">
              <h2 className="text-h4 font-display">Order Summary</h2>

              <div className="space-y-3 py-6 border-y border-soft-grey">
                <div className="flex justify-between text-body-sm">
                  <span className="text-medium-grey">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-medium-grey">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                {shipping === 0 && <p className="text-xs text-success uppercase font-semibold">Free shipping on this order</p>}
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Coupon Code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border border-medium-grey rounded-md text-sm focus:outline-none focus:border-black"
                  />
                  <button className="px-4 py-2 bg-black text-white rounded-md text-sm font-semibold hover:bg-charcoal">Apply</button>
                </div>
              </div>

              <div className="py-6 border-t border-soft-grey">
                <div className="flex justify-between mb-6">
                  <span className="text-h5 font-semibold">Total</span>
                  <span className="text-h4 font-semibold">₹{total.toFixed(2)}</span>
                </div>

                <Link to="/checkout" className="block w-full btn btn-primary btn-lg text-center mb-3">
                  Proceed to Checkout
                </Link>

                <button onClick={clearCart} className="w-full btn btn-ghost text-sm">
                  Clear Bag
                </button>
              </div>

              <div className="pt-6 border-t border-soft-grey space-y-2 text-xs text-medium-grey">
                <p>✓ Free shipping on orders over ₹2000</p>
                <p>✓ Easy 30-day returns</p>
                <p>✓ Secure checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
