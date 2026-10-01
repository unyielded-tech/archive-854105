import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { loginCustomer, registerCustomer, resetCustomerPassword } from '@/services/customerAuth'
import toast from 'react-hot-toast'

export function CustomerAuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const register = location.pathname === '/register'
  const [mode, setMode] = useState(register ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        await registerCustomer(email, password, name)
        toast.success('Account created. Please verify your email.')
      } else {
        await loginCustomer(email, password)
        toast.success('Welcome back.')
      }
      navigate('/account')
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
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="text-xs uppercase tracking-[0.3em] text-medium-grey mb-4">ARCHIVE 854105</p>
          <h1 className="font-display text-4xl mb-3">{mode === 'register' ? 'Create your account' : 'Sign in'}</h1>
          <p className="text-medium-grey mb-8">Your account, orders and saved pieces in one place.</p>

          <form onSubmit={submit} className="space-y-5">
            {mode === 'register' && (
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Full name" className="w-full border-b border-charcoal bg-transparent px-0 py-3 outline-none" />
            )}
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="Email address" className="w-full border-b border-charcoal bg-transparent px-0 py-3 outline-none" />
            <input value={password} onChange={e => setPassword(e.target.value)} required type="password" minLength={6} placeholder="Password" className="w-full border-b border-charcoal bg-transparent px-0 py-3 outline-none" />
            <button disabled={loading} className="w-full bg-black text-white py-4 uppercase tracking-[0.2em] text-xs disabled:opacity-50">
              {loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {mode === 'login' && <button onClick={resetPassword} className="mt-5 text-xs uppercase tracking-widest underline">Forgot password?</button>}

          <div className="mt-8 pt-6 border-t border-soft-grey text-sm">
            {mode === 'login' ? (
              <>New to ARCHIVE? <button onClick={() => setMode('register')} className="underline">Create an account</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode('login')} className="underline">Sign in</button></>
            )}
          </div>
          <Link to="/" className="inline-block mt-6 text-xs uppercase tracking-widest text-medium-grey">Return to store</Link>
        </div>
      </div>
    </MainLayout>
  )
}
