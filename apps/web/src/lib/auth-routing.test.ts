import { sanitizeRedirectUrl, getDefaultRoleHome, getClientAuthState } from './auth-routing';

describe('auth-routing utility', () => {
  describe('sanitizeRedirectUrl', () => {
    it('should allow valid relative paths', () => {
      expect(sanitizeRedirectUrl('/checkout')).toBe('/checkout');
      expect(sanitizeRedirectUrl('/cart')).toBe('/cart');
      expect(sanitizeRedirectUrl('/account/orders')).toBe('/account/orders');
    });

    it('should reject protocol-relative URLs (open redirect vector //evil.com)', () => {
      expect(sanitizeRedirectUrl('//evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('//evil.com/phish')).toBe('/');
    });

    it('should reject backslash URLs (open redirect vector /\\evil.com)', () => {
      expect(sanitizeRedirectUrl('/\\evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('\\evil.com')).toBe('/');
    });

    it('should reject absolute URLs with schemes', () => {
      expect(sanitizeRedirectUrl('https://evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('http://evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/');
      expect(sanitizeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/');
    });

    it('should disallow redirecting back into /login to prevent redirect loops', () => {
      expect(sanitizeRedirectUrl('/login')).toBe('/');
      expect(sanitizeRedirectUrl('/login/user')).toBe('/');
      expect(sanitizeRedirectUrl('/login/seller')).toBe('/');
    });

    it('should return custom fallback when url is null or undefined', () => {
      expect(sanitizeRedirectUrl(null, '/cart')).toBe('/cart');
      expect(sanitizeRedirectUrl(undefined, '/cart')).toBe('/cart');
    });
  });

  describe('getDefaultRoleHome', () => {
    it('should map roles to their respective dashboards', () => {
      expect(getDefaultRoleHome('VENDOR')).toBe('/seller/dashboard');
      expect(getDefaultRoleHome('ADMIN')).toBe('/admin/dashboard');
      expect(getDefaultRoleHome('SPADMIN')).toBe('/admin/dashboard');
      expect(getDefaultRoleHome('CUST')).toBe('/');
      expect(getDefaultRoleHome(null)).toBe('/');
    });
  });
});
