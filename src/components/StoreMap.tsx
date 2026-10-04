import { media } from '@/config/media'

export function StoreMap({ height = 420 }: { height?: number }) {
  const q = encodeURIComponent(media.mapQuery)
  const embed = media.mapEmbedUrl || `https://www.google.com/maps?q=${q}&z=17&output=embed`
  const link = media.mapLink || `https://www.google.com/maps/search/?api=1&query=${q}`

  return (
    <div style={{ border: '1px solid var(--line)', background: '#fff' }}>
      <div style={{ position: 'relative', height }}>
        <iframe
          title="ARCHIVE 854105 store location"
          src={embed}
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '10px 12px', borderTop: '1px solid var(--line)' }}>
        <span style={{ fontSize: '.8rem', lineHeight: 1.4 }}>{media.address}</span>
        <a href={link} target="_blank" rel="noreferrer" className="st-btn" style={{ minHeight: 38, padding: '0 16px' }}>Get directions</a>
      </div>
    </div>
  )
}

export function ContactBlock() {
  return (
    <div style={{ display: 'grid', gap: 8, fontSize: '1rem' }}>
      <p style={{ margin: 0 }}>{media.address}</p>
      <p style={{ margin: 0 }}><a style={{ textDecoration: 'underline' }} href={`tel:+${media.whatsapp}`}>{media.phone}</a></p>
      <p style={{ margin: 0 }}><a style={{ textDecoration: 'underline' }} href={`https://wa.me/${media.whatsapp}`} target="_blank" rel="noreferrer">Order on WhatsApp</a></p>
    </div>
  )
}
