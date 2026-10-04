import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAdminStore } from '@/store/adminStore'
import { adminCheckSession } from '@/services/api'

// Pages
import { HomePage } from '@/pages/HomePage'
import { ShopPage } from '@/pages/ShopPage'
import { ProductPage } from '@/pages/ProductPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { AccountPage } from '@/pages/AccountPage'
import { AccountOrdersPage, AccountOrderDetailPage } from '@/pages/AccountOrdersPage'
import { AccountProfilePage, AccountAddressesPage, AccountSecurityPage } from '@/pages/AccountSettingsPages'
import { CollectionsPage } from '@/pages/CollectionsPage'
import { ContactPage } from '@/pages/ContactPage'
import { AboutPage } from '@/pages/AboutPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { CustomerAuthPage } from '@/pages/CustomerAuthPage'
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage'
import { TrackOrderPage } from '@/pages/TrackOrderPage'
import { WishlistPage } from '@/pages/WishlistPage'
import { JournalPage, JournalArticlePage } from '@/pages/JournalPage'
import { LookbookPage } from '@/pages/LookbookPage'
import { CollectionDetailPage } from '@/pages/CollectionDetailPage'
import { FaqPage, ShippingReturnsPage, PrivacyPage, TermsPage } from '@/pages/InfoPages'

// Admin Pages
import { AdminLogin } from '@/pages/admin/AdminLogin'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminProducts } from '@/pages/admin/AdminProducts'
import { AdminOrders } from '@/pages/admin/AdminOrders'
import { AdminCustomers } from '@/pages/admin/AdminCustomers'
import { AdminBanner } from '@/pages/admin/AdminBanner'
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute'

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
    <Router>
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
          </>
        )}

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  )
}
