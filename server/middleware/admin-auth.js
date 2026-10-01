// ============================================
// ADMIN AUTH MIDDLEWARE
// ============================================
// This middleware ensures:
// 1. User is authenticated (has valid session)
// 2. Session is not expired
// 3. User has admin role
// 4. All checks are server-side (no client-side bypass possible)

export function adminAuthMiddleware(req, res, next) {
  // Check if session exists
  if (!req.session || !req.session.admin) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - No active session',
    })
  }

  // Check session expiry
  const now = Date.now()
  const sessionAge = now - (req.session.createdAt || 0)
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  if (sessionAge > maxAge) {
    req.session.destroy()
    return res.status(401).json({
      success: false,
      error: 'Session expired - Please log in again',
    })
  }

  // Update last activity
  req.session.lastActivity = now

  // Attach admin to request for use in route handlers
  req.admin = req.session.admin

  next()
}

// ============================================
// ROLE CHECKING MIDDLEWARE
// ============================================

const roleHierarchy = {
  owner: 4,
  admin: 3,
  editor: 2,
  inventory: 1,
  orders: 1,
}

export function requireRole(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

  return (req, res, next) => {
    // First check authentication
    adminAuthMiddleware(req, res, () => {
      const userRole = req.admin?.role
      const userHierarchy = roleHierarchy[userRole] || 0

      const hasPermission = roles.some((role) => {
        const requiredHierarchy = roleHierarchy[role] || 0
        return userHierarchy >= requiredHierarchy
      })

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden - Insufficient permissions',
          requiredRole: roles,
          userRole,
        })
      }

      next()
    })
  }
}

// ============================================
// RATE LIMITING
// ============================================

const loginAttempts = new Map()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export function checkRateLimit(identifier) {
  const now = Date.now()
  const attempt = loginAttempts.get(identifier)

  if (attempt) {
    if (attempt.lockoutUntil && now < attempt.lockoutUntil) {
      return {
        limited: true,
        retryAfter: Math.ceil((attempt.lockoutUntil - now) / 1000),
      }
    }

    if (attempt.lastAttempt && now - attempt.lastAttempt < 60000) {
      attempt.count++

      if (attempt.count >= MAX_ATTEMPTS) {
        attempt.lockoutUntil = now + LOCKOUT_DURATION
        return {
          limited: true,
          retryAfter: Math.ceil(LOCKOUT_DURATION / 1000),
        }
      }
    } else {
      attempt.count = 1
    }

    attempt.lastAttempt = now
  } else {
    loginAttempts.set(identifier, {
      count: 1,
      lastAttempt: now,
      lockoutUntil: null,
    })
  }

  return { limited: false }
}

export function resetRateLimit(identifier) {
  loginAttempts.delete(identifier)
}
