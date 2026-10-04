import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AccountLayout } from '@/components/AccountLayout'
import { logoutCustomer } from '@/services/customerAuth'
import { getAccount, completeness, type CustomerProfile, type SavedAddress } from '@/services/account'
import { getMyOrders, type StoreOrder } from '@/services/orders'
import { useWishlistStore } from '@/store/wishlistStore'
import { OrderRow } from '@/pages/AccountOrdersPage'
import { media } from '@/config/media'

function Overview({ user }: { user: { uid: string; email: string | null; displayName: string } }) {
  const navigate = useNavigate()
  const wishCount = useWishlistStore((s) => s.ids.length)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [orders, setOrders] = useState<StoreOrder[] | null>(null)

  useEffect(() => {
    getAccount().then((a) => { setProfile(a.profile); setAddresses(a.addresses) }).catch(() => {})
    getMyOrders().then(setOrders).catch(() => setOrders([]))
  }, [user.uid])

  const name = profile?.displayName || user.displayName || user.email || 'Customer'
  const { percent, missing } = completeness(profile, addresses.length)

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="acc-head">
        <div className="avatar">{name.trim().charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.4rem', lineHeight: 1.1 }}>{name}</div>
          <div className="st-sub" style={{ overflowWrap: 'anywhere' }}>{user.email}{profile?.phone ? ` · +91 ${profile.phone}` : ''}</div>
        </div>
      </div>

      {percent < 100 && profile && (
        <div className="banner">
          <b style={{ fontWeight: 500 }}>Your profile is {percent}% complete</b>
          <div className="meter"><i style={{ width: `${percent}%` }} /></div>
          <span className="st-sub" style={{ fontSize: '.78rem' }}>Add {missing.slice(0, 3).join(', ')} for faster checkout and delivery updates. </span>
          <Link to="/account/profile" className="st-link">Complete profile</Link>
        </div>
      )}

      <div className="stats">
        <Link to="/account/orders"><b>{orders === null ? '–' : orders.length}</b><span>Orders</span></Link>
        <Link to="/wishlist"><b>{wishCount}</b><span>Wishlist</span></Link>
        <Link to="/account/addresses"><b>{addresses.length}</b><span>Addresses</span></Link>
      </div>

      <div className="tiles">
        <Link to="/account/orders" className="tile"><b>My orders</b><span>Track, cancel or buy again</span></Link>
        <Link to="/account/profile" className="tile"><b>Profile details</b><span>Name, mobile, birthday</span></Link>
        <Link to="/account/addresses" className="tile"><b>Saved addresses</b><span>Home, work and more</span></Link>
        <Link to="/wishlist" className="tile"><b>Wishlist</b><span>Pieces you saved</span></Link>
        <Link to="/track-order" className="tile"><b>Track an order</b><span>With order number + phone</span></Link>
        <Link to="/account/security" className="tile"><b>Password &amp; security</b><span>Change password</span></Link>
        <Link to="/faq" className="tile"><b>Help centre</b><span>FAQ, shipping, returns</span></Link>
        <a href={`https://wa.me/${media.whatsapp}`} target="_blank" rel="noreferrer" className="tile"><b>Chat with us</b><span>WhatsApp support</span></a>
      </div>

      <div>
        <div className="st-sec-head" style={{ marginTop: 6 }}>
          <h2 className="st-title">Recent orders</h2>
          {orders && orders.length > 0 && <Link to="/account/orders" className="st-link">See all</Link>}
        </div>
        {orders === null ? (
          <div className="st-empty">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="st-empty">You have no orders yet. <Link to="/shop" style={{ textDecoration: 'underline' }}>Start shopping</Link></div>
        ) : (
          orders.slice(0, 2).map((o) => <OrderRow key={o.orderId} order={o} />)
        )}
      </div>

      <button className="st-btn ghost block" onClick={async () => { await logoutCustomer(); toast.success('Signed out'); navigate('/') }}>Sign out</button>
    </div>
  )
}

export function AccountPage() {
  return (
    <AccountLayout title="My account" home>
      {(user) => <Overview user={user} />}
    </AccountLayout>
  )
}
