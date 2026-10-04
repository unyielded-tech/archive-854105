// Drop real GIF / MP4 / WebM files into /public/media and list them here.
// Anything left empty falls back to the built-in animated loops.
export const media = {
  heroVideo: '',            // e.g. '/media/hero.mp4'  (looping, muted, autoplay)
  stickers: [] as string[], // e.g. ['/media/fire.gif', '/media/skull.gif']
  whatsapp: '917033077553',
  address: 'New Market, Katihar, Bihar — in front of City Kart',
  phone: '+91 70330 77553',

  // Store location. City Kart's address is Dr. Rajendra Prasad Path, Amla Tola, Katihar 854105.
  mapQuery: 'City Kart, Dr Rajendra Prasad Path, Amla Tola, Katihar, Bihar 854105',
  // Optional: for a perfectly exact pin, open your Google Maps place, tap Share > Embed a map,
  // copy ONLY the address inside src="..." and paste it here. Leave '' to use mapQuery.
  mapEmbedUrl: '',
  // "Get directions" opens this link (your own Google Maps share link).
  mapLink: 'https://share.google/VwSctSwYDJTemrHgX',
}
