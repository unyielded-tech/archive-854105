import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MainLayout } from '@/layouts/MainLayout'
import { loginCustomer, registerCustomer, resetCustomerPassword } from '@/services/customerAuth'
import '@/styles/store.css'

export function CustomerAuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>(location.pathname === '/register' ? 'register' : 'login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (mode === 'register') {
      if (name.trim().length < 2) return toast.error('Enter your full name')
      if (phone.replace(/\D/g, '').length !== 10) return toast.error('Enter a valid 10-digit mobile number')
      if (password !== confirm) return toast.error('The two passwords do not match')
    }
    setLoading(true)
    try {
      if (mode === 'register') {
        await registerCustomer(email, password, name, phone.replace(/\D/g, ''))
        toast.success('Account created. Please verify your email.')
        navigate('/account/profile?welcome=1')
      } else {
        await loginCustomer(email, password)
        toast.success('Welcome back.')
        navigate('/account')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (!email) return toast.error('Enter your email first.')
    try {
      await resetCustomerPassword(email)
      toast.success('Password reset email sent.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send reset email')
    }
  }

  return (
    <MainLayout>
      <div className="st-wrap">
        <div className="auth">
          <h1 className="st-page-title" style={{ textAlign: 'center' }}>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
          <p className="st-sub" style={{ textAlign: 'center', marginBottom: 16 }}>Your orders, addresses and saved pieces in one place.</p>

          <div className="auth-tabs">
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Sign in</button>
            <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Register</button>
          </div>

          <form onSubmit={submit} className="sec-box">
            {mode === 'register' && (
              <>
                <label className="st-label" style={{ marginTop: 0 }}>Full name</label>
                <input className="st-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                <label className="st-label">Mobile number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="st-input" value="+91" readOnly style={{ width: 64, background: '#f1ede6', textAlign: 'center' }} />
                  <input className="st-input" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} autoComplete="tel-national" required />
                </div>
              </>
            )}
            <label className="st-label" style={mode === 'login' ? { marginTop: 0 } : undefined}>Email address</label>
            <input className="st-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <label className="st-label">Password</label>
            <input className="st-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={6} required />
            {mode === 'register' && (
              <>
                <label className="st-label">Confirm password</label>
                <input className="st-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={6} required />
                <div className="perks" style={{ marginTop: 12 }}>
                  <span>✓ Track and cancel orders in one tap</span>
                  <span>✓ Save addresses for faster checkout</span>
                  <span>✓ Keep your wishlist across devices</span>
                </div>
              </>
            )}
            <button className="st-btn block" style={{ marginTop: 14 }} disabled={loading}>{loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
            {mode === 'login' && <button type="button" className="link-btn" style={{ marginTop: 8 }} onClick={resetPassword}>Forgot password?</button>}
            {mode === 'register' && <p className="st-sub" style={{ fontSize: '.72rem', margin: '10px 0 0' }}>By creating an account you agree to our <Link to="/terms" style={{ textDecoration: 'underline' }}>Terms</Link> and <Link to="/privacy" style={{ textDecoration: 'underline' }}>Privacy policy</Link>.</p>}
          </form>

          <div style={{ textAlign: 'center' }}>
            <Link to="/track-order" className="st-link">Track an order without an account</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
