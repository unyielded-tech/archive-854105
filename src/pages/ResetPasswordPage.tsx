import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MainLayout } from '@/layouts/MainLayout'
import { getSupabase } from '@/lib/supabase'
import '@/styles/store.css'
import { useSeo } from '@/lib/seo'

// Opened from the "Reset your password" email. Supabase puts a one-time recovery session in the link;
// we wait for it, then let the person choose a new password.
export function ResetPasswordPage() {
  useSeo({ title: 'Reset password', noindex: true })
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const query = new URLSearchParams(window.location.search)
    const err = hash.get('error_description') || query.get('error_description')
    if (err) { setFailed(err.replace(/\+/g, ' ')); return }

    let sb
    try { sb = getSupabase() } catch { setFailed('Sign-in is not set up on this site yet.'); return }

    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) setReady(true)
    })
    sb.auth.getSession().then(({ data: d }) => { if (d.session) setReady(true) })
    const t = setTimeout(() => setFailed((cur) => cur || 'This reset link is invalid or has expired.'), 6000)
    return () => { data.subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  useEffect(() => { if (ready) setFailed('') }, [ready])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 6) return toast.error('Use at least 6 characters')
    if (pw !== pw2) return toast.error('The two passwords do not match')
    setBusy(true)
    try {
      const { error } = await getSupabase().auth.updateUser({ password: pw })
      if (error) throw error
      toast.success('Password updated. You are signed in.')
      navigate('/account', { replace: true })
    } catch (err: any) {
      toast.error(err?.message || 'Could not update the password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MainLayout>
      <div className="st-wrap">
        <div className="auth">
          <h1 className="st-page-title" style={{ textAlign: 'center' }}>Choose a new password</h1>
          {ready ? (
            <form onSubmit={submit} className="sec-box" style={{ marginTop: 14 }}>
              <label className="st-label" style={{ marginTop: 0 }}>New password</label>
              <input className="st-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={6} required />
              <label className="st-label">Confirm new password</label>
              <input className="st-input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" minLength={6} required />
              <button className="st-btn block" style={{ marginTop: 14 }} disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
            </form>
          ) : failed ? (
            <div className="sec-box" style={{ marginTop: 14 }}>
              <p style={{ margin: '0 0 10px' }}>{failed}</p>
              <p className="st-sub" style={{ margin: '0 0 12px' }}>Reset links work once and expire quickly. Request a new one and open it on this same phone.</p>
              <Link to="/login" className="st-btn block">Back to sign in</Link>
            </div>
          ) : (
            <div className="st-empty">Checking your reset link…</div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
