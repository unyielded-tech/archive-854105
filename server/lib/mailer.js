// Optional transactional email through Resend (https://resend.com).
// Needs RESEND_API_KEY. Without it every function quietly does nothing, so the shop works either way.
//   MAIL_FROM           e.g. "ARCHIVE 854105 <orders@yourdomain.com>"   (default: Resend's test sender)
//   ORDER_NOTIFY_EMAIL  your own email: you get an alert for every new order
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export const mailEnabled = () => !!process.env.RESEND_API_KEY

export async function sendMail({ to, subject, html }) {
  const list = (Array.isArray(to) ? to : [to]).filter(Boolean)
  if (!process.env.RESEND_API_KEY || list.length === 0) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM || 'ARCHIVE 854105 <onboarding@resend.dev>', to: list, subject, html }),
    })
    if (!res.ok) console.error('mail failed:', res.status, (await res.text()).slice(0, 200))
    return res.ok
  } catch (e) {
    console.error('mail error:', e.message)
    return false
  }
}

const shell = (title, body) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
<div style="background:#111;color:#F7F4EF;padding:16px 20px;letter-spacing:.3em;font-size:14px">ARCHIVE 854105</div>
<div style="padding:20px"><h2 style="font-weight:400;margin:0 0 12px">${esc(title)}</h2>${body}</div>
<div style="padding:12px 20px;font-size:12px;color:#777">New Market, Katihar, Bihar — in front of City Kart</div></div>`

function itemsTable(order) {
  const rows = (order.items || []).map((i) =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(i.name)}${i.size ? ` · ${esc(i.size)}` : ''} × ${esc(i.quantity)}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${inr(i.total)}</td></tr>`).join('')
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
<tr><td style="padding-top:8px">Delivery</td><td style="text-align:right;padding-top:8px">${order.shipping ? inr(order.shipping) : 'Free'}</td></tr>
${order.discount ? `<tr><td>Discount</td><td style="text-align:right">−${inr(order.discount)}</td></tr>` : ''}
<tr><td style="padding-top:6px"><b>Total</b></td><td style="text-align:right;padding-top:6px"><b>${inr(order.total)}</b></td></tr></table>`
}

const addr = (a = {}) => `${esc(a.fullName)}, ${esc(a.street)}${a.landmark ? ', ' + esc(a.landmark) : ''}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.pincode)}<br>Phone: ${esc(a.phoneNumber)}`
const payLine = (o) => (o.paymentMethod === 'cod' ? 'Cash on delivery' : o.paymentStatus === 'completed' ? 'Paid online' : 'Online payment pending')

export function orderPlacedMail(order, siteUrl) {
  return {
    subject: `Order ${order.orderId} received — ARCHIVE 854105`,
    html: shell('Thank you for your order', `<p>Hi ${esc(order.customer?.name)}, we have received your order <b>${esc(order.orderId)}</b>.</p>${itemsTable(order)}
<p style="font-size:14px"><b>Deliver to</b><br>${addr(order.address)}</p><p style="font-size:14px">Payment: ${payLine(order)}</p>
<p style="font-size:14px">Track it any time: <a href="${esc(siteUrl)}/track-order/${esc(order.orderId)}">${esc(siteUrl)}/track-order</a></p>`),
  }
}

export function ownerAlertMail(order, siteUrl) {
  return {
    subject: `New order ${order.orderId} · ${inr(order.total)}`,
    html: shell('New order received', `<p><b>${esc(order.customer?.name)}</b> · ${esc(order.customer?.phone)}</p>${itemsTable(order)}
<p style="font-size:14px">${addr(order.address)}</p><p style="font-size:14px">Payment: ${payLine(order)}</p>
<p><a href="${esc(siteUrl)}/admin/orders">Open the admin panel</a></p>`),
  }
}

const STATUS_TEXT = {
  confirmed: 'has been confirmed and is being prepared.',
  shipped: 'is on its way to you.',
  delivered: 'has been delivered. We hope you love it!',
  cancelled: 'has been cancelled.',
}

export function statusMail(order, status, siteUrl) {
  if (!STATUS_TEXT[status]) return null
  return {
    subject: `Your order ${order.orderId} ${status === 'shipped' ? 'has shipped' : `is ${status}`}`,
    html: shell(`Order ${status}`, `<p>Hi ${esc(order.customer?.name)}, your order <b>${esc(order.orderId)}</b> ${STATUS_TEXT[status]}</p>
${order.trackingNumber ? `<p style="font-size:14px">Tracking ID: <b>${esc(order.trackingNumber)}</b></p>` : ''}
<p style="font-size:14px"><a href="${esc(siteUrl)}/track-order/${esc(order.orderId)}">Track your order</a></p>`),
  }
}

export const siteUrlFrom = (req) => process.env.SITE_URL || `https://${req.headers['x-forwarded-host'] || req.headers.host}`
