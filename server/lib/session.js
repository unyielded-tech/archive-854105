import jwt from 'jsonwebtoken'

const COOKIE = 'archive_admin_session'
const MAX_AGE = 24 * 60 * 60 // seconds
const secret = () => process.env.SESSION_SECRET || 'change-me-before-production'
const isProd = () => process.env.NODE_ENV === 'production' || !!process.env.VERCEL

function readCookie(header = '', name) {
  const part = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(name + '='))
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null
}

// Stateless cookie session (works on Vercel serverless, unlike MemoryStore).
export function sessionMiddleware(req, res, next) {
  const session = { destroy(cb) { clearSession(res); cb && cb() } }
  const token = readCookie(req.headers.cookie, COOKIE)
  if (token) {
    try {
      const data = jwt.verify(token, secret())
      session.admin = data.admin
      session.createdAt = data.createdAt
    } catch {}
  }
  req.session = session
  next()
}

export function issueSession(res, admin) {
  const token = jwt.sign({ admin, createdAt: Date.now() }, secret(), { expiresIn: MAX_AGE })
  res.append('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${isProd() ? '; Secure' : ''}`)
}

export function clearSession(res) {
  res.append('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd() ? '; Secure' : ''}`)
}
