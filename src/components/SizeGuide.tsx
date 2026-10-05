import { useState } from 'react'
import { X, Ruler } from 'lucide-react'
import { sizeGuide } from '@/config/sizeGuide'
import '@/styles/store.css'

export function SizeGuide() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="link-btn" onClick={() => setOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Ruler size={14} /> Size guide
      </button>
      {open && (
        <>
          <div className="modal-back" onClick={() => setOpen(false)} />
          <div className="modal" role="dialog" aria-modal="true" aria-label="Size guide">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="st-title">Size guide</h2>
              <button className="hd-icon" onClick={() => setOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <p className="st-sub" style={{ margin: '2px 0 10px' }}>Garment measurements in {sizeGuide.unit}.</p>
            <table className="size-table">
              <thead><tr><th>Size</th>{sizeGuide.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {sizeGuide.rows.map((r) => (
                  <tr key={r.size}><td><b style={{ fontWeight: 500 }}>{r.size}</b></td>{r.values.map((v, i) => <td key={i}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: '.82rem', lineHeight: 1.6, color: '#2a2825' }}>
              {sizeGuide.tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </>
      )}
    </>
  )
}
