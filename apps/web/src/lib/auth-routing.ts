/**
 * Unified Role-Aware Routing and Auth Helper for ToBeTake Web Application
 */

import { getCustomerAuthToken, getCustomerStoredUser } from './customer-api';
import { getStoredAuthUser } from './api';

export type UserRoleCode = 'CUST' | 'VENDOR' | 'ADMIN' | 'SPADMIN';

export interface ResolvedAuthState {
  role: UserRoleCode | null;
  isCustomer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

/**
 * Resolves current client-side auth state across storage tiers
 */
export function getClientAuthState(): ResolvedAuthState {
  if (typeof window === 'undefined') {
    return {
      role: null,
      isCustomer: false,
      isSeller: false,
      isAdmin: false,
      isAuthenticated: false,
    };
  }

  // 1. Check customer token & user
  const customerToken = getCustomerAuthToken();
  const customerUser = getCustomerStoredUser();
  if (customerToken && customerUser && (customerUser.roleCode === 'CUST' || customerUser.role === 'Buyer')) {
    return {
      role: 'CUST',
      isCustomer: true,
      isSeller: false,
      isAdmin: false,
      isAuthenticated: true,
    };
  }

  // 2. Check vendor / admin stored user
  const storedUser = getStoredAuthUser();
  if (storedUser) {
    if (storedUser.roleCode === 'VENDOR') {
      return {
        role: 'VENDOR',
        isCustomer: false,
        isSeller: true,
        isAdmin: false,
        isAuthenticated: true,
      };
    }
    if (storedUser.roleCode === 'ADMIN' || storedUser.roleCode === 'SPADMIN') {
      return {
        role: storedUser.roleCode as UserRoleCode,
        isCustomer: false,
        isSeller: false,
        isAdmin: true,
        isAuthenticated: true,
      };
    }
  }

  return {
    role: null,
    isCustomer: false,
    isSeller: false,
    isAdmin: false,
    isAuthenticated: false,
  };
}

/**
 * Validates and sanitizes safe internal redirect URLs
 */
export function sanitizeRedirectUrl(url: string | null | undefined, fallback = '/'): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  // Ensure it starts with / and not // (prevents open redirect attacks)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('javascript:')) {
    // Disallow redirecting directly back into login pages
    if (trimmed.startsWith('/login')) {
      return fallback;
    }
    return trimmed;
  }
  return fallback;
}

/**
 * Role-aware destination resolver
 */
export function getDefaultRoleHome(role: UserRoleCode | null | undefined): string {
  switch (role) {
    case 'VENDOR':
      return '/seller/dashboard';
    case 'ADMIN':
    case 'SPADMIN':
      return '/admin/dashboard';
    case 'CUST':
    default:
      return '/';
  }
}
