/**
 * Secure Client API Utilities for To Be Take Web Application
 * Attaches authenticated user credentials and session tokens to outgoing API requests
 */

export interface StoredAuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  storeName?: string | null;
  businessCategory?: string | null;
  departmentId?: number | null;
  department?: string | null;
  designation?: string | null;
}

export function getStoredAuthUser(): StoredAuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionStored = sessionStorage.getItem('tobetake_auth_user');
    if (sessionStored) {
      const parsed = JSON.parse(sessionStored);
      if (parsed && (parsed.id || parsed.email)) return parsed as StoredAuthUser;
    }
    const localStored = localStorage.getItem('tobetake_auth_user');
    if (localStored) {
      const parsed = JSON.parse(localStored);
      if (parsed && (parsed.id || parsed.email)) return parsed as StoredAuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: StoredAuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Atomically clear previous seller/user identity across both storage mechanisms
    sessionStorage.removeItem('tobetake_auth_user');
    localStorage.removeItem('tobetake_auth_user');

    // 2. Persist new authenticated identity
    const authData = JSON.stringify(user);
    sessionStorage.setItem('tobetake_auth_user', authData);
    localStorage.setItem('tobetake_auth_user', authData);

    // 3. Print required development diagnostic
    console.log('[AUTH SESSION ESTABLISHED]', {
      'LOGIN USER': user.username,
      'EMAIL': user.email,
      'USER ID': user.id,
      'ROLE': user.roleCode,
      'SELLER ID': user.id,
      'STORE': user.storeName,
    });
  } catch (err) {
    console.error('Failed to save auth user session:', err);
  }
}

export function clearStoredAuthUser(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('tobetake_auth_user');
    localStorage.removeItem('tobetake_auth_user');
    console.log('[AUTH SESSION CLEARED]');
  } catch (err) {
    console.error('Failed to clear auth user session:', err);
  }
}

export function getAuthHeaders(additionalHeaders?: HeadersInit): Headers {
  const headers = new Headers(additionalHeaders);
  const user = getStoredAuthUser();

  if (user && user.id) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${user.id}`);
    }
    if (!headers.has('x-user-id')) {
      headers.set('x-user-id', user.id);
    }
    if (user.email && !headers.has('x-user-email')) {
      headers.set('x-user-email', user.email);
    }

    console.log('[AUTHENTICATED SELLER IDENTITY]', {
      'LOGIN USER': user.username,
      'EMAIL': user.email,
      'USER ID': user.id,
      'ROLE': user.roleCode,
      'SELLER ID': user.id,
    });
  }

  return headers;
}

/**
 * Authenticated fetch helper for admin and protected API calls
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = getAuthHeaders(init?.headers);

  if (
    !headers.has('Content-Type') &&
    !(init?.body instanceof FormData) &&
    init?.body !== undefined
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Authenticated fetch helper for seller portal API calls
 */
export const sellerFetch = adminFetch;


