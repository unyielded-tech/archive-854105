import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCustomer } from '@/lib/useCustomer'
import { getReviews, postReview, type ReviewData } from '@/services/reviews'
import '@/styles/store.css'

export function RatingPill({ value, count }: { value?: number; count?: number }) {
  if (!value || !count) return null
  return <span className="rate">{value.toFixed(1)} <Star size={10} fill="#fff" /> <span style={{ opacity: 0.85 }}>({count})</span></span>
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} fill={n <= Math.round(value) ? '#d99000' : 'none'} />)}
    </span>
  )
}

export function Reviews({ productId, onChanged }: { productId: string; onChanged?: () => void }) {
  const { user } = useCustomer()
  const [data, setData] = useState<ReviewData | null>(null)
  const [writing, setWriting] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => getReviews(productId).then(setData).catch(() => setData({ summary: { average: 0, count: 0, breakdown: [0, 0, 0, 0, 0] }, reviews: [] }))
  useEffect(() => { load() }, [productId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) return toast.error('Choose a star rating')
    setBusy(true)
    try {
      const r = await postReview({ productId, rating, title, body })
      toast.success(r.message)
      setWriting(false); setRating(0); setTitle(''); setBody('')
      await load()
      onChanged?.()
    } catch (err: any) {
      toast.error(err?.message || 'Could not save your review')
    } finally {
      setBusy(false)
    }
  }

  if (!data) return null
  const { summary, reviews } = data

  return (
    <section className="st-sec" id="reviews">
      <div className="st-sec-head"><h2 className="st-title">Ratings &amp; reviews</h2></div>

      {summary.count > 0 && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'auto 1fr', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '2.6rem', lineHeight: 1 }}>{summary.average.toFixed(1)}</div>
            <Stars value={summary.average} />
            <div className="st-sub" style={{ fontSize: '.72rem' }}>{summary.count} review{summary.count === 1 ? '' : 's'}</div>
          </div>
          <div>
            {[5, 4, 3, 2, 1].map((n) => (
              <div className="rv-bar" key={n}>
                <span>{n}★</span>
                <i><b style={{ width: `${summary.count ? (summary.breakdown[n - 1] / summary.count) * 100 : 0}%` }} /></i>
                <span>{summary.breakdown[n - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!writing ? (
        <button className="st-btn ghost" style={{ marginBottom: 6 }} onClick={() => (user ? setWriting(true) : toast('Sign in to write a review'))}>Write a review</button>
      ) : (
        <form onSubmit={submit} className="sec-box">
          <h2>Your review</h2>
          <div>{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className={`star-btn ${n <= rating ? 'on' : ''}`} onClick={() => setRating(n)} aria-label={`${n} stars`}>★</button>)}</div>
          <label className="st-label">Headline (optional)</label>
          <input className="st-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Great fit and fabric" />
          <label className="st-label">Your review</label>
          <textarea className="st-input" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder="How is the quality, fit and feel?" required />
          <div className="st-two" style={{ marginTop: 12 }}>
            <button type="button" className="st-btn ghost" onClick={() => setWriting(false)} disabled={busy}>Cancel</button>
            <button className="st-btn" disabled={busy}>{busy ? 'Saving…' : 'Submit'}</button>
          </div>
          <p className="st-sub" style={{ fontSize: '.72rem', margin: '8px 0 0' }}>Only customers who received this product can review it.</p>
        </form>
      )}
      {!user && !writing && <p className="st-sub" style={{ fontSize: '.78rem' }}><Link to="/login" style={{ textDecoration: 'underline' }}>Sign in</Link> to review products you have bought.</p>}

      {reviews.length === 0 ? (
        <p className="st-sub" style={{ margin: '10px 0' }}>No reviews yet. Be the first to share your thoughts.</p>
      ) : (
        reviews.map((r) => (
          <div className="rv" key={r.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="rate">{r.rating} <Star size={10} fill="#fff" /></span>
              {r.title && <b style={{ fontWeight: 500, fontSize: '.92rem' }}>{r.title}</b>}
            </div>
            <p style={{ margin: '6px 0 4px', fontSize: '.9rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{r.body}</p>
            <div className="st-sub" style={{ fontSize: '.72rem' }}>{r.name} · Verified buyer · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        ))
      )}
    </section>
  )
}
