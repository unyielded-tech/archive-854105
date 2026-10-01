import { Link } from 'react-router-dom'
import { Mail, Phone, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-charcoal text-white mt-16">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <h2 className="text-h6 font-display mb-4">ARCHIVE 854105</h2>
            <p className="text-body-sm text-soft-grey">Premium streetwear. New Market, Katihar, Bihar — in front of City Kart.</p>
            <p className="text-body-sm text-soft-grey mt-4">© 2026 ARCHIVE 854105. All rights reserved.</p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-h6 font-semibold uppercase tracking-wider mb-4">Shop</h3>
            <nav className="space-y-2">
              <Link to="/shop" className="text-body-sm text-soft-grey hover:text-white transition block">
                All Products
              </Link>
              <Link to="/collections" className="text-body-sm text-soft-grey hover:text-white transition block">
                Collections
              </Link>
              <Link to="/shop?sale=true" className="text-body-sm text-soft-grey hover:text-white transition block">
                Sale
              </Link>
              <Link to="/shop?new=true" className="text-body-sm text-soft-grey hover:text-white transition block">
                New Arrivals
              </Link>
            </nav>
          </div>

          {/* Editorial */}
          <div>
            <h3 className="text-h6 font-semibold uppercase tracking-wider mb-4">Editorial</h3>
            <nav className="space-y-2">
              <Link to="/about" className="text-body-sm text-soft-grey hover:text-white transition block">
                About Us
              </Link>
              </nav>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-h6 font-semibold uppercase tracking-wider mb-4">Support</h3>
            <nav className="space-y-2">
              <Link to="/contact" className="text-body-sm text-soft-grey hover:text-white transition block">Contact Us</Link>
              </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-soft-grey pt-8 mt-8">
          {/* Newsletter */}
          <div className="mb-8">
            <h3 className="text-h6 font-semibold uppercase tracking-wider mb-4">Newsletter</h3>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-charcoal border border-soft-grey rounded-md text-white placeholder:text-soft-grey focus:outline-none focus:border-white transition"
              />
              <button className="btn btn-primary">Subscribe</button>
            </form>
          </div>

          {/* Contact & Social */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pt-8 border-t border-soft-grey">
            <div className="flex gap-6">
              <a href="tel:+917033077553" className="flex items-center gap-2 text-body-sm text-soft-grey hover:text-white transition">
                <Phone size={16} />
                +91 70330 77553
              </a>
            </div>

            <div className="flex gap-4">
              <a href="#" className="p-2 hover:bg-soft-grey rounded-md transition">
                <Instagram size={18} />
              </a>
              <a href="#" className="p-2 hover:bg-soft-grey rounded-md transition">
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
