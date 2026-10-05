import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, User, ShoppingBag, Heart } from 'lucide-react'
import { SearchBox } from '@/components/SearchBox'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import '@/styles/store.css'

const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop?new=true', label: 'New' },
  { href: '/shop?sale=true', label: 'Sale' },
  { href: '/collections', label: 'Collections' },
  { href: '/lookbook', label: 'Lookbook' },
  { href: '/journal', label: 'Journal' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const wishCount = useWishlistStore((s) => s.ids.length)

  return (
    <header className="hd">
      <div className="hd-bar">Luxury streetwear from Katihar · Bihar</div>
      <div className="st-wrap">
        <div className="hd-row">
          <button className="hd-icon hd-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="hd-logo">
            Archive
            <small>854105</small>
          </Link>

          <nav className="hd-nav">
            {navLinks.map((l) => (
              <Link key={l.href} to={l.href}>{l.label}</Link>
            ))}
          </nav>

          <div className="hd-search-wrap hd-search-desktop"><SearchBox /></div>

          <div className="hd-icons">
            <Link to="/account" className="hd-icon" aria-label="Account"><User size={21} /></Link>
            <Link to="/wishlist" className="hd-icon" aria-label="Wishlist">
              <Heart size={21} />
              {wishCount > 0 && <span className="hd-badge">{wishCount}</span>}
            </Link>
            <Link to="/cart" className="hd-icon" aria-label="Shopping bag">
              <ShoppingBag size={21} />
              {cartCount > 0 && <span className="hd-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>

        <div className="hd-search-mobile"><SearchBox onDone={() => setMenuOpen(false)} /></div>
      </div>

      {menuOpen && (
        <div className="menu-panel">
          <div className="st-wrap">
            {[{ href: '/', label: 'Home' }, ...navLinks, { href: '/track-order', label: 'Track order' }, { href: '/contact', label: 'Contact' }].map((l) => (
              <Link key={l.href} to={l.href} onClick={() => setMenuOpen(false)}>{l.label}</Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
