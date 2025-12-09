import { auth } from './auth';
import { redirect } from 'next/navigation';
import type { UserRole } from '@prisma/client';

/**
 * Get the current session on the server side.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return await auth();
}

/**
 * Get current user from session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication. Redirects to login if not authenticated.
 * Use in server components and server actions.
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return session.user;
}

/**
 * Require specific role. Redirects if user doesn't have required role.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    redirect('/dashboard');
  }

  return user;
}

/**
 * Require Flowency admin role.
 */
export async function requireFlowencyAdmin() {
  return requireRole(['flowency_admin']);
}

/**
 * Require client access. Checks if user belongs to the specified client.
 */
export async function requireClientAccess(clientId: string) {
  const user = await requireAuth();

  // Flowency admins can access any client
  if (user.role === 'flowency_admin') {
    return user;
  }

  // Other users can only access their own client
  if (user.clientId !== clientId) {
    redirect('/dashboard');
  }

  return user;
}

/**
 * Check if user can modify a resource.
 * Flowency admins and client admins can modify, members have limited access.
 */
export function canModify(userRole: UserRole): boolean {
  return userRole === 'flowency_admin' || userRole === 'client_admin';
}

/**
 * Check if user is a Flowency admin.
 */
export function isFlowencyAdmin(userRole: UserRole): boolean {
  return userRole === 'flowency_admin';
}
