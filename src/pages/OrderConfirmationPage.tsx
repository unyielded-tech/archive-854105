import { Link } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { CheckCircle } from 'lucide-react'

export function OrderConfirmationPage() {
  const orderId = 'ARV-2024-001'
  const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()

  return (
    <MainLayout>
      <div className="container py-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-success rounded-full flex items-center justify-center">
                <CheckCircle size={56} className="text-white" />
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-h2 md:text-display-sm font-display mb-4">Thank you for your order!</h1>
          <p className="text-body-lg text-medium-grey mb-8">
            Your order has been confirmed and is being prepared for shipment.
          </p>

          {/* Order Details */}
          <div className="bg-off-white p-8 rounded-md mb-8 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-soft-grey">
              <span className="text-body-sm text-medium-grey">Order Number</span>
              <span className="font-semibold">{orderId}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-soft-grey">
              <span className="text-body-sm text-medium-grey">Order Total</span>
              <span className="font-semibold">₹5,999</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-soft-grey">
              <span className="text-body-sm text-medium-grey">Estimated Delivery</span>
              <span className="font-semibold">{estimatedDelivery}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-medium-grey">Shipping Method</span>
              <span className="font-semibold">Express Delivery</span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white border-2 border-soft-grey p-8 rounded-md mb-8 text-left">
            <h2 className="text-h5 font-semibold mb-4">What's Next?</h2>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="font-semibold text-gold">1</span>
                <span className="text-body-sm">You'll receive an order confirmation email with tracking details</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-gold">2</span>
                <span className="text-body-sm">Your items are being carefully packed in our warehouse</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-gold">3</span>
                <span className="text-body-sm">Once shipped, you can track your package in real-time</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
            <Link to="/account" className="btn btn-secondary">
              View My Orders
            </Link>
          </div>

          {/* FAQ */}
          <div className="mt-12 pt-8 border-t border-soft-grey">
            <p className="text-body-sm text-medium-grey mb-4">
              Have questions? Check our <a href="#" className="hover:underline font-semibold">FAQ</a> or <a href="#" className="hover:underline font-semibold">contact us</a>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
