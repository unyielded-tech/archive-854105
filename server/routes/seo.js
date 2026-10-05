import express from 'express'
import { getFirebaseDb } from '../lib/firebase-admin.js'
import { siteUrlFrom } from '../lib/mailer.js'

// Search-engine and sharing helpers served from the site root (vercel.json rewrites them to the API).
const router = express.Router()
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n)

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /account\nDisallow: /checkout\nDisallow: /cart\n\nSitemap: ${siteUrlFrom(req)}/sitemap.xml\n`)
})

router.get('/sitemap.xml', async (req, res) => {
  try {
    const base = siteUrlFrom(req)
    const db = getFirebaseDb()
    const urls = ['/', '/shop', '/shop?new=true', '/shop?sale=true', '/collections', '/lookbook', '/journal', '/about', '/contact', '/faq', '/shipping-returns', '/privacy', '/terms'].map((p) => ({ loc: p }))

    const prods = await db.collection('products').where('published', '==', true).get()
    prods.forEach((d) => { const p = d.data(); if (p.slug) urls.push({ loc: `/product/${p.slug}`, lastmod: p.updatedAt }) })
    for (const [col, prefix] of [['collections', '/collections/'], ['articles', '/journal/']]) {
      try {
        const snap = await db.collection(col).where('published', '==', true).get()
        snap.forEach((d) => { const x = d.data(); if (x.slug) urls.push({ loc: prefix + x.slug, lastmod: x.updatedAt }) })
      } catch { /* optional collections */ }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) =>
      `<url><loc>${esc(base + u.loc)}</loc>${u.lastmod ? `<lastmod>${esc(String(u.lastmod).slice(0, 10))}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`
    res.set('Cache-Control', 'public, max-age=3600').type('application/xml').send(xml)
  } catch (e) {
    console.error('sitemap error:', e)
    res.status(500).type('text/plain').send('sitemap unavailable')
  }
})

// /share/<product-slug>: a link that shows a rich preview (photo, name, price) in WhatsApp etc.
// Browsers are sent straight on to the real product page.
router.get('/share/:slug', async (req, res) => {
  const base = siteUrlFrom(req)
  const slug = String(req.params.slug || '')
  const target = `${base}/product/${encodeURIComponent(slug)}`
  try {
    const snap = await getFirebaseDb().collection('products').where('slug', '==', slug).limit(1).get()
    const p = snap.empty ? null : snap.docs[0].data()
    if (!p || p.published === false) return res.redirect(302, `${base}/shop`)

    const price = p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price
    const img = p.images?.[0]?.url || p.images?.[0] || ''
    const title = `${p.name} — ₹${Number(price).toLocaleString('en-IN')} | ARCHIVE 854105`
    const desc = clip(p.description || p.shortDescription || 'Premium streetwear from Katihar, Bihar.', 180)
    res.set('Cache-Control', 'public, max-age=300').type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="product"><meta property="og:site_name" content="ARCHIVE 854105">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(target)}">${img ? `<meta property="og:image" content="${esc(img)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${esc(target)}"><link rel="canonical" href="${esc(target)}"></head>
<body><p><a href="${esc(target)}">Open ${esc(p.name)}</a></p><script>location.replace(${JSON.stringify(target)})</script></body></html>`)
  } catch (e) {
    console.error('share error:', e)
    res.redirect(302, target)
  }
})

export default router
