import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAdminStore } from '@/store/adminStore'
import { adminCheckSession } from '@/services/api'

import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initAnalytics, trackPage } from '@/lib/analytics'
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Every other page loads on demand, so the first visit on a phone stays fast.
const L = <T extends Record<string, any>>(load: () => Promise<T>, name: keyof T) =>
  lazy(() => load().then((m) => ({ default: m[name] as any })))

const ShopPage = L(() => import('@/pages/ShopPage'), 'ShopPage')
const ProductPage = L(() => import('@/pages/ProductPage'), 'ProductPage')
const CartPage = L(() => import('@/pages/CartPage'), 'CartPage')
const CheckoutPage = L(() => import('@/pages/CheckoutPage'), 'CheckoutPage')
const AccountPage = L(() => import('@/pages/AccountPage'), 'AccountPage')
const AccountOrdersPage = L(() => import('@/pages/AccountOrdersPage'), 'AccountOrdersPage')
const AccountOrderDetailPage = L(() => import('@/pages/AccountOrdersPage'), 'AccountOrderDetailPage')
const AccountProfilePage = L(() => import('@/pages/AccountSettingsPages'), 'AccountProfilePage')
const AccountAddressesPage = L(() => import('@/pages/AccountSettingsPages'), 'AccountAddressesPage')
const AccountSecurityPage = L(() => import('@/pages/AccountSettingsPages'), 'AccountSecurityPage')
const CollectionsPage = L(() => import('@/pages/CollectionsPage'), 'CollectionsPage')
const CollectionDetailPage = L(() => import('@/pages/CollectionDetailPage'), 'CollectionDetailPage')
const ContactPage = L(() => import('@/pages/ContactPage'), 'ContactPage')
const AboutPage = L(() => import('@/pages/AboutPage'), 'AboutPage')
const CustomerAuthPage = L(() => import('@/pages/CustomerAuthPage'), 'CustomerAuthPage')
const ResetPasswordPage = L(() => import('@/pages/ResetPasswordPage'), 'ResetPasswordPage')
const OrderConfirmationPage = L(() => import('@/pages/OrderConfirmationPage'), 'OrderConfirmationPage')
const TrackOrderPage = L(() => import('@/pages/TrackOrderPage'), 'TrackOrderPage')
const WishlistPage = L(() => import('@/pages/WishlistPage'), 'WishlistPage')
const JournalPage = L(() => import('@/pages/JournalPage'), 'JournalPage')
const JournalArticlePage = L(() => import('@/pages/JournalPage'), 'JournalArticlePage')
const LookbookPage = L(() => import('@/pages/LookbookPage'), 'LookbookPage')
const FaqPage = L(() => import('@/pages/InfoPages'), 'FaqPage')
const ShippingReturnsPage = L(() => import('@/pages/InfoPages'), 'ShippingReturnsPage')
const PrivacyPage = L(() => import('@/pages/InfoPages'), 'PrivacyPage')
const TermsPage = L(() => import('@/pages/InfoPages'), 'TermsPage')

const AdminLogin = L(() => import('@/pages/admin/AdminLogin'), 'AdminLogin')
const AdminDashboard = L(() => import('@/pages/admin/AdminDashboard'), 'AdminDashboard')
const AdminProducts = L(() => import('@/pages/admin/AdminProducts'), 'AdminProducts')
const AdminOrders = L(() => import('@/pages/admin/AdminOrders'), 'AdminOrders')
const AdminCustomers = L(() => import('@/pages/admin/AdminCustomers'), 'AdminCustomers')
const AdminBanner = L(() => import('@/pages/admin/AdminBanner'), 'AdminBanner')
const AdminCoupons = L(() => import('@/pages/admin/AdminCoupons'), 'AdminCoupons')
const AdminReviews = L(() => import('@/pages/admin/AdminReviews'), 'AdminReviews')

// Scroll to top on every page change and report page views (if analytics is configured).
function RouteEffects() {
  const { pathname, search } = useLocation()
  useEffect(() => { initAnalytics() }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
    trackPage(pathname + search)
  }, [pathname, search])
  return null
}

export function App() {
  const setUser = useAdminStore((state) => state.setUser)
  const setLoading = useAdminStore((state) => state.setLoading)

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true)
        const response = await adminCheckSession()
        if (response?.user) {
          setUser(response.user)
        }
      } catch (error) {
        console.debug('No active session')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [setUser, setLoading])

  return (
    <ErrorBoundary>
    <Router>
      <RouteEffects />
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/orders" element={<AccountOrdersPage />} />
        <Route path="/account/orders/:orderId" element={<AccountOrderDetailPage />} />
        <Route path="/account/profile" element={<AccountProfilePage />} />
        <Route path="/account/addresses" element={<AccountAddressesPage />} />
        <Route path="/account/security" element={<AccountSecurityPage />} />
        <Route path="/login" element={<CustomerAuthPage />} />
        <Route path="/register" element={<CustomerAuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:slug" element={<CollectionDetailPage />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        <Route path="/order-confirmation" element={<TrackOrderPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/journal/:slug" element={<JournalArticlePage />} />
        <Route path="/lookbook" element={<LookbookPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Admin Routes: served on Vercel via the /api serverless function. */}
        {(
          <>
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/products" element={<AdminProtectedRoute><AdminProducts /></AdminProtectedRoute>} />
            <Route path="/admin/orders" element={<AdminProtectedRoute><AdminOrders /></AdminProtectedRoute>} />
            <Route path="/admin/customers" element={<AdminProtectedRoute><AdminCustomers /></AdminProtectedRoute>} />
            <Route path="/admin/banner" element={<AdminProtectedRoute><AdminBanner /></AdminProtectedRoute>} />
            <Route path="/admin/coupons" element={<AdminProtectedRoute><AdminCoupons /></AdminProtectedRoute>} />
            <Route path="/admin/reviews" element={<AdminProtectedRoute><AdminReviews /></AdminProtectedRoute>} />
          </>
        )}

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </Router>
    </ErrorBoundary>
  )
}
