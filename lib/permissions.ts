import { getCurrentUser } from "./api"

export type UserRole = 'administrator' | 'manager' | 'staff'

export interface User {
  id: number
  username: string
  email?: string
  role: UserRole
}

/**
 * Check if user has permission based on their role
 */
export function hasPermission(requiredRoles: UserRole[]): boolean {
  const user = getCurrentUser()
  if (!user || !user.role) return false
  return requiredRoles.includes(user.role as UserRole)
}

/**
 * Check if user can perform write operations (create, update, delete)
 * Only administrators and managers can write
 */
export function canWrite(): boolean {
  return hasPermission(['administrator', 'manager'])
}

/**
 * Check if user is an administrator
 */
export function isAdmin(): boolean {
  return hasPermission(['administrator'])
}

/**
 * Check if user is a manager or administrator
 */
export function isManagerOrAdmin(): boolean {
  return hasPermission(['administrator', 'manager'])
}

/**
 * Check if user is staff (read-only access)
 */
export function isStaff(): boolean {
  const user = getCurrentUser()
  return user?.role === 'staff'
}

/**
 * Get current user role
 */
export function getUserRole(): UserRole | null {
  const user = getCurrentUser()
  return user?.role as UserRole || null
}
