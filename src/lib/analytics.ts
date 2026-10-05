// Optional analytics. Nothing loads unless you set these in Vercel:
//   VITE_GA_ID           Google Analytics 4 measurement ID, e.g. G-XXXXXXXXXX
//   VITE_META_PIXEL_ID   Meta (Facebook / Instagram) pixel ID
const env = (import.meta as any).env || {}
const w = window as any
let started = false

export function initAnalytics() {
  if (started) return
  started = true

  if (env.VITE_GA_ID) {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${env.VITE_GA_ID}`
    document.head.appendChild(s)
    w.dataLayer = w.dataLayer || []
    w.gtag = function () { w.dataLayer.push(arguments) }
    w.gtag('js', new Date())
    w.gtag('config', env.VITE_GA_ID, { send_page_view: false })
  }

  if (env.VITE_META_PIXEL_ID) {
    /* eslint-disable */
    ;(function (f: any, b: any, e: any, v: any) {
      if (f.fbq) return
      const n: any = (f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) })
      if (!f._fbq) f._fbq = n
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []
      const t = b.createElement(e); t.async = true; t.src = v
      const s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    w.fbq('init', env.VITE_META_PIXEL_ID)
  }
}

export function trackPage(path: string) {
  w.gtag?.('event', 'page_view', { page_path: path })
  w.fbq?.('track', 'PageView')
}

export function trackEvent(name: 'add_to_cart' | 'begin_checkout' | 'purchase', data: Record<string, unknown> = {}) {
  w.gtag?.('event', name, { currency: 'INR', ...data })
  const fb: Record<string, string> = { add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase' }
  w.fbq?.('track', fb[name], { currency: 'INR', value: data.value })
}
