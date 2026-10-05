import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AdminShell } from '@/components/admin/AdminShell'
import { listReviews, setReviewHidden, removeReview, type AdminReview } from '@/services/api'

export function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listReviews().then((d) => setReviews(d.reviews)).catch((e: any) => toast.error(e?.message || 'Could not load reviews')).finally(() => setLoading(false))
  }, [])

  const toggle = async (r: AdminReview) => {
    try {
      await setReviewHidden(r.id, !r.hidden)
      setReviews((l) => l.map((x) => (x.id === r.id ? { ...x, hidden: !r.hidden } : x)))
      toast.success(r.hidden ? 'Review is visible again' : 'Review hidden from the shop')
    } catch (e: any) { toast.error(e?.message || 'Could not update') }
  }
  const remove = async (r: AdminReview) => {
    if (!window.confirm('Delete this review for good?')) return
    try { await removeReview(r.id); setReviews((l) => l.filter((x) => x.id !== r.id)); toast.success('Review deleted') } catch (e: any) { toast.error(e?.message || 'Could not delete') }
  }

  return (
    <AdminShell title="Reviews" subtitle="Customer reviews appear on product pages. Hide any that break your rules.">
      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="adm-empty">No reviews yet. Customers can review a product after it is delivered to them.</div>
      ) : (
        reviews.map((r) => (
          <div className="adm-row" key={r.id} style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <p className="adm-name">{r.productName}</p>
              <span className={`adm-tag ${r.hidden ? 'dim' : ''}`}>{r.hidden ? 'Hidden' : 'Visible'}</span>
            </div>
            <p className="adm-meta">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} · {r.name} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            {r.title && <p style={{ margin: '6px 0 0' }}><b style={{ fontWeight: 500 }}>{r.title}</b></p>}
            <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>{r.body}</p>
            <div className="adm-actions">
              <button className="adm-text" onClick={() => toggle(r)}>{r.hidden ? 'Show' : 'Hide'}</button>
              <button className="adm-text danger" onClick={() => remove(r)}>Delete</button>
            </div>
          </div>
        ))
      )}
    </AdminShell>
  )
}
