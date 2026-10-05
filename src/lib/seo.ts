import { useEffect } from 'react'

const BRAND = 'ARCHIVE 854105'
const DEFAULT_TITLE = `${BRAND} | Premium Luxury Streetwear`
const DEFAULT_DESC = 'Premium luxury streetwear from Katihar, Bihar. Shop shirts, tees and more with cash on delivery.'

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', value)
}

interface Seo { title?: string; description?: string; image?: string; path?: string; jsonLd?: object; noindex?: boolean }

// Sets the page title, description, social-sharing tags and (optionally) Google product data.
export function useSeo({ title, description, image, path, jsonLd, noindex }: Seo) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : ''
  useEffect(() => {
    const fullTitle = title ? `${title} | ${BRAND}` : DEFAULT_TITLE
    const desc = (description || DEFAULT_DESC).replace(/\s+/g, ' ').trim().slice(0, 160)
    const url = window.location.origin + (path ?? window.location.pathname)
    document.title = fullTitle
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', jsonLd ? 'product' : 'website')
    setMeta('property', 'og:site_name', BRAND)
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    if (image) setMeta('property', 'og:image', image)
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = url

    let script = document.getElementById('seo-jsonld') as HTMLScriptElement | null
    if (ld) {
      if (!script) { script = document.createElement('script'); script.id = 'seo-jsonld'; script.type = 'application/ld+json'; document.head.appendChild(script) }
      script.textContent = ld
    } else script?.remove()

    return () => {
      document.title = DEFAULT_TITLE
      document.getElementById('seo-jsonld')?.remove()
    }
  }, [title, description, image, path, ld, noindex])
}
