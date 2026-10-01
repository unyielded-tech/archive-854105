import { media } from '@/config/media'

const q = encodeURIComponent('City Kart, New Market, Katihar, Bihar')

export function StoreMap({ height = 420 }: { height?: number }) {
  return (
    <div className="relative overflow-hidden border border-black/15" style={{ height }}>
      <iframe title="ARCHIVE 854105 store location" src={`https://www.google.com/maps?q=${q}&z=16&output=embed`}
        width="100%" height="100%" style={{ border: 0, filter: 'grayscale(1) contrast(1.05)' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      <a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noreferrer"
        className="absolute bottom-3 left-3 btn btn-primary">Get directions</a>
    </div>
  )
}

export function ContactBlock() {
  return (
    <div className="space-y-2 text-lg">
      <p>{media.address}</p>
      <p><a className="underline" href={`tel:+${media.whatsapp}`}>{media.phone}</a></p>
      <p><a className="underline" href={`https://wa.me/${media.whatsapp}`} target="_blank" rel="noreferrer">Order on WhatsApp</a></p>
    </div>
  )
}
