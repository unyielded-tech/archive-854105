import { create } from 'zustand'
import type { AdminRole } from '@/types'

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
}

export interface AdminState {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setUser: (user: AdminUser | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  hasPermission: (requiredRole: AdminRole | AdminRole[]) => boolean
}

const roleHierarchy: Record<AdminRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  inventory: 1,
  orders: 1,
}

export const useAdminStore = create<AdminState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      error: null,
    })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },

  setError: (error) => {
    set({ error })
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    })
  },

  hasPermission: (requiredRole) => {
    const { user } = get()
    if (!user) return false

    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const userHierarchy = roleHierarchy[user.role] || 0

    return requiredRoles.some((role) => {
      const requiredHierarchy = roleHierarchy[role] || 0
      return userHierarchy >= requiredHierarchy
    })
  },
}))
