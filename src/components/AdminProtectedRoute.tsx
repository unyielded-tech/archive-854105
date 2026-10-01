import { ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminStore } from '@/store/adminStore'

interface AdminProtectedRouteProps {
  children: ReactNode
  requiredRole?: string | string[]
}

export function AdminProtectedRoute({
  children,
  requiredRole,
}: AdminProtectedRouteProps) {
  const isAuthenticated = useAdminStore((state) => state.isAuthenticated)
  const isLoading = useAdminStore((state) => state.isLoading)
  const user = useAdminStore((state) => state.user)
  const hasPermission = useAdminStore((state) => state.hasPermission)

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold tracking-widest mb-4">
            ARCHIVE
          </h1>
          <p className="text-medium-grey">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  // Check role if required
  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h1 mb-4">Access Denied</h1>
          <p className="text-body-lg text-medium-grey">
            You don't have permission to access this area.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
