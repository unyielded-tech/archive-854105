import { Link } from 'react-router-dom'
import { Phone, MapPin } from 'lucide-react'
import { media } from '@/config/media'
import '@/styles/store.css'

export function Footer() {
  return (
    <footer className="ft">
      <div className="st-wrap">
        <div className="ft-grid">
          <div className="ft-brand">
            <h4>ARCHIVE 854105</h4>
            <p style={{ fontSize: '.85rem', lineHeight: 1.6, margin: '0 0 10px' }}>Premium streetwear from Katihar, Bihar.</p>
            <a href={`tel:+${media.whatsapp}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Phone size={14} /> {media.phone}</a>
            <a href={`https://wa.me/${media.whatsapp}`} target="_blank" rel="noreferrer">Order on WhatsApp</a>
            <p style={{ fontSize: '.8rem', display: 'flex', gap: 8, marginTop: 8 }}><MapPin size={14} style={{ flex: 'none', marginTop: 3 }} /> {media.address}</p>
          </div>

          <div>
            <h4>Shop</h4>
            <Link to="/shop">All products</Link>
            <Link to="/shop?new=true">New arrivals</Link>
            <Link to="/shop?sale=true">Sale</Link>
            <Link to="/collections">Collections</Link>
            <Link to="/wishlist">Wishlist</Link>
          </div>

          <div>
            <h4>Explore</h4>
            <Link to="/lookbook">Lookbook</Link>
            <Link to="/journal">Journal</Link>
            <Link to="/about">About us</Link>
            <Link to="/contact">Visit the store</Link>
          </div>

          <div>
            <h4>Help</h4>
            <Link to="/track-order">Track order</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/shipping-returns">Shipping &amp; returns</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>

        <div className="ft-bottom">
          <span>© {new Date().getFullYear()} ARCHIVE 854105. All rights reserved.</span>
          <span>Cash on delivery available</span>
        </div>
      </div>
    </footer>
  )
}
