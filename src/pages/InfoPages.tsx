import type { ReactNode } from 'react'
import { MainLayout } from '@/layouts/MainLayout'
import { useSeo } from '@/lib/seo'
import { media } from '@/config/media'
import { FREE_SHIPPING_ABOVE, SHIPPING, inr } from '@/lib/format'
import '@/styles/store.css'

function Doc({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  useSeo({ title, description: intro })
  return (
    <MainLayout>
      <div className="st-wrap">
        <div className="doc">
          <h1 className="st-page-title">{title}</h1>
          {intro && <p className="st-sub" style={{ marginBottom: 10 }}>{intro}</p>}
          {children}
        </div>
      </div>
    </MainLayout>
  )
}

const wa = `https://wa.me/${media.whatsapp}`

export function FaqPage() {
  const faqs: [string, string][] = [
    ['How do I place an order?', 'Open a product, choose your size, tap Add to bag, then go to your bag and checkout. You only need your name, phone number and delivery address.'],
    ['How can I pay?', 'We currently accept cash on delivery. You pay when your order arrives.'],
    ['How do I track my order?', 'Use the Track order page with your order number and the phone number you ordered with. If you created an account, your orders also appear under My account.'],
    ['How long does delivery take?', `Standard delivery takes 5–7 days and express delivery takes 2–3 days. Delivery is free on orders above ${inr(FREE_SHIPPING_ABOVE)}.`],
    ['Can I visit the store?', `Yes. ${media.address}.`],
    ['I need help with my order', 'Message us on WhatsApp with your order number and we will help you.'],
  ]
  return (
    <Doc title="FAQ" intro="Quick answers to common questions.">
      <div className="faq">
        {faqs.map(([q, a]) => (
          <details key={q}><summary>{q}</summary><p>{a}</p></details>
        ))}
      </div>
      <p style={{ marginTop: 16 }}>Still stuck? <a href={wa} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>Chat with us on WhatsApp</a>.</p>
    </Doc>
  )
}

export function ShippingReturnsPage() {
  return (
    <Doc title="Shipping & returns">
      <h2>Delivery</h2>
      <ul>
        <li>Standard delivery: 5–7 days, {inr(SHIPPING.standard)} (free on orders above {inr(FREE_SHIPPING_ABOVE)}).</li>
        <li>Express delivery: 2–3 days, {inr(SHIPPING.express)}.</li>
        <li>Delivery times start once your order is confirmed. We will message you if anything is delayed.</li>
      </ul>
      <h2>Payment</h2>
      <p>Cash on delivery. Please keep the exact amount ready for the delivery person.</p>
      <h2>Exchanges &amp; returns</h2>
      <p>If your item arrives damaged, faulty or in the wrong size, message us on WhatsApp with your order number and photos as soon as you receive it, and we will arrange a fix. Items should be unworn, unwashed and have their tags attached.</p>
      <h2>Cancellations</h2>
      <p>You can ask us to cancel an order before it is shipped. Contact us on <a href={wa} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>WhatsApp</a> or call {media.phone}.</p>
    </Doc>
  )
}

export function PrivacyPage() {
  return (
    <Doc title="Privacy policy" intro="How ARCHIVE 854105 handles your information.">
      <h2>What we collect</h2>
      <p>When you order or create an account we collect your name, phone number, delivery address and, optionally, your email. We use this only to process and deliver your order and to contact you about it.</p>
      <h2>How we use it</h2>
      <p>Your details are used to confirm, pack and deliver your order, and to answer your questions. We do not sell your personal information.</p>
      <h2>Storage and security</h2>
      <p>Order information is stored securely with our service providers. Only our team can see order details.</p>
      <h2>Your choices</h2>
      <p>To see, correct or delete your information, contact us at {media.phone}.</p>
    </Doc>
  )
}

export function TermsPage() {
  return (
    <Doc title="Terms of service">
      <h2>Orders</h2>
      <p>An order is confirmed once we accept it. We may cancel an order if an item is out of stock or the details are incomplete, and we will let you know.</p>
      <h2>Prices</h2>
      <p>Prices are in Indian rupees and include applicable taxes. We may change prices at any time; the price at checkout is the price you pay.</p>
      <h2>Delivery and payment</h2>
      <p>Delivery timelines are estimates. Payment is due in cash on delivery.</p>
      <h2>Contact</h2>
      <p>Questions about these terms? Reach us at {media.phone}.</p>
    </Doc>
  )
}
