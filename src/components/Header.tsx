import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Search, User, ShoppingBag, Heart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import clsx from 'clsx'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const cartItemCount = useCartStore((state) => state.getItemCount())

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/collections', label: 'Collections' },
    { href: '/lookbook', label: 'Lookbook' },
    { href: '/journal', label: 'Journal' },
    { href: '/about', label: 'About' },
  ]

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('q')
    if (query) {
      navigate(`/shop?search=${encodeURIComponent(query as string)}`)
      setSearchOpen(false)
    }
  }

  return (
    <header className="border-b border-soft-grey sticky top-0 z-40 bg-white">
      {/* Announcement Bar */}
      <div className="bg-charcoal text-white py-2 text-center text-sm tracking-widest">
        LUXURY STREETWEAR FROM KATIHAR • BIHAR
      </div>

      {/* Main Header */}
      <nav className="container py-4 md:py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="text-2xl md:text-3xl font-display font-bold tracking-widest">
              ARCHIVE
              <div className="text-sm font-body font-normal tracking-wider">854105</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium uppercase tracking-wider">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="hover:opacity-60 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:opacity-60 transition-opacity"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Account */}
            <Link to="/account" className="p-2 hover:opacity-60 transition-opacity" aria-label="Account">
              <User size={20} />
            </Link>

            {/* Wishlist */}
            <Link to="/wishlist" className="p-2 hover:opacity-60 transition-opacity" aria-label="Wishlist">
              <Heart size={20} />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="p-2 hover:opacity-60 transition-opacity relative"
              aria-label="Shopping Bag"
            >
              <ShoppingBag size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:opacity-60 transition-opacity"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="mt-4 border-t border-soft-grey pt-4">
            <input
              type="text"
              name="q"
              placeholder="Search products..."
              autoFocus
              className="w-full px-0 py-2 text-sm border-b border-charcoal focus:outline-none focus:border-black"
            />
          </form>
        )}
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-soft-grey">
          <div className="container py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium uppercase tracking-wider hover:opacity-60"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
