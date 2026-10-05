import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AdminShell } from '@/components/admin/AdminShell'
import { listCoupons, saveCoupon, removeCoupon, type AdminCoupon } from '@/services/api'

const blank = { code: '', type: 'percentage' as 'percentage' | 'fixed', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', endDate: '', active: true }
const money = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`

function describe(c: AdminCoupon) {
  const off = c.type === 'percentage' ? `${c.value}% off` : `${money(c.value)} off`
  const parts = [off]
  if (c.minOrderAmount) parts.push(`min ${money(c.minOrderAmount)}`)
  if (c.type === 'percentage' && c.maxDiscount) parts.push(`up to ${money(c.maxDiscount)}`)
  parts.push(c.usageLimit ? `used ${c.usedCount || 0}/${c.usageLimit}` : `used ${c.usedCount || 0}`)
  if (c.endDate) parts.push(`ends ${new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`)
  return parts.join(' · ')
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<typeof blank | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try { setCoupons((await listCoupons()).coupons) } catch (e: any) { toast.error(e?.message || 'Could not load coupons') } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))

  const create = async () => {
    if (!form) return
    setSaving(true)
    try {
      await saveCoupon(null, { ...form, code: form.code.trim().toUpperCase() })
      toast.success('Coupon created')
      setForm(null)
      load()
    } catch (e: any) {
      toast.error(e?.message || 'Could not create the coupon')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (c: AdminCoupon) => {
    try {
      await saveCoupon(c.id, { active: !c.active })
      setCoupons((l) => l.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)))
      toast.success(c.active ? 'Coupon paused' : 'Coupon active')
    } catch (e: any) { toast.error(e?.message || 'Could not update') }
  }

  const remove = async (c: AdminCoupon) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return
    try { await removeCoupon(c.id); setCoupons((l) => l.filter((x) => x.id !== c.id)); toast.success('Coupon deleted') } catch (e: any) { toast.error(e?.message || 'Could not delete') }
  }

  return (
    <AdminShell title="Coupons" subtitle="Discount codes customers enter in their bag">
      <button className="adm-btn block" onClick={() => setForm({ ...blank })}>New coupon</button>

      {loading ? (
        <div className="adm-empty" style={{ marginTop: 18 }}>Loading…</div>
      ) : coupons.length === 0 ? (
        <div className="adm-empty" style={{ marginTop: 18 }}>No coupons yet. Try one like WELCOME10.</div>
      ) : (
        <div style={{ marginTop: 18 }}>
          {coupons.map((c) => (
            <div className="adm-row" key={c.id} style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <p className="adm-name" style={{ letterSpacing: '.08em' }}>{c.code}</p>
                <span className={`adm-tag ${c.active ? '' : 'dim'}`}>{c.active ? 'Active' : 'Paused'}</span>
              </div>
              <p className="adm-meta">{describe(c)}</p>
              <div className="adm-actions">
                <button className="adm-text" onClick={() => toggle(c)}>{c.active ? 'Pause' : 'Activate'}</button>
                <button className="adm-text danger" onClick={() => remove(c)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="adm-sheet" role="dialog" aria-modal="true">
          <div className="adm-sheet-top">
            <h2>New coupon</h2>
            <button className="adm-text" onClick={() => setForm(null)}>Close</button>
          </div>
          <div className="adm-sheet-body">
            <label className="adm-label">Code</label>
            <input className="adm-in" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="WELCOME10" maxLength={20} />

            <label className="adm-label">Discount type</label>
            <div className="adm-chips">
              <button type="button" className={`adm-chip ${form.type === 'percentage' ? 'on' : ''}`} onClick={() => set('type', 'percentage')}>Percent off</button>
              <button type="button" className={`adm-chip ${form.type === 'fixed' ? 'on' : ''}`} onClick={() => set('type', 'fixed')}>Flat ₹ off</button>
            </div>

            <div className="adm-two">
              <div>
                <label className="adm-label">{form.type === 'percentage' ? 'Percent' : 'Amount (₹)'}</label>
                <input className="adm-in" inputMode="decimal" value={form.value} onChange={(e) => set('value', e.target.value)} placeholder={form.type === 'percentage' ? '10' : '200'} />
              </div>
              <div>
                <label className="adm-label">Minimum order (₹)</label>
                <input className="adm-in" inputMode="numeric" value={form.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)} placeholder="Optional" />
              </div>
            </div>

            <div className="adm-two">
              {form.type === 'percentage' && (
                <div>
                  <label className="adm-label">Max discount (₹)</label>
                  <input className="adm-in" inputMode="numeric" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} placeholder="Optional" />
                </div>
              )}
              <div>
                <label className="adm-label">Total uses allowed</label>
                <input className="adm-in" inputMode="numeric" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} placeholder="Unlimited" />
              </div>
            </div>

            <label className="adm-label">Expires on (optional)</label>
            <input className="adm-in" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />

            <label className="adm-label">Status</label>
            <button type="button" role="switch" aria-checked={form.active} className="adm-switch" onClick={() => set('active', !form.active)}>
              <span>{form.active ? 'Active — customers can use it' : 'Paused'}</span><i />
            </button>
          </div>
          <div className="adm-sheet-foot"><div><button className="adm-btn block" onClick={create} disabled={saving}>{saving ? 'Saving…' : 'Create coupon'}</button></div></div>
        </div>
      )}
    </AdminShell>
  )
}
