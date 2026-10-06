import {
  CustomerStorefrontData,
  CustomerProductQueryParams,
  CustomerProductDetail,
  CustomerCartSummary,
  CustomerWishlistItem,
  CustomerAddressItem,
  CreateAddressInput,
  UpdateAddressInput,
  CheckoutPreviewData,
  CheckoutPreviewInput,
  PlaceOrderInput,
  OrderPlacementResponse,
  CustomerReviewItem,
  SubmitReviewInput,
  CustomerNotificationItem,
  CustomerProfileSummary,
  UpdateCustomerProfileInput,
  CategoryItem,
  CustomerSellerSpotlight,
} from '@tobetake/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function getCustomerAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('tobetake_customer_token') ||
    sessionStorage.getItem('tobetake_customer_token') ||
    localStorage.getItem('token')
  );
}

export function setCustomerAuthToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tobetake_customer_token', token);
  sessionStorage.setItem('tobetake_customer_token', token);
  localStorage.setItem('token', token);
}

export function removeCustomerAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tobetake_customer_token');
  sessionStorage.removeItem('tobetake_customer_token');
  localStorage.removeItem('token');
  localStorage.removeItem('tobetake_customer_user');
  sessionStorage.removeItem('tobetake_customer_user');
}

export function getCustomerStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw =
    localStorage.getItem('tobetake_customer_user') ||
    sessionStorage.getItem('tobetake_customer_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCustomerStoredUser(user: any) {
  if (typeof window === 'undefined') return;
  const data = JSON.stringify(user);
  localStorage.setItem('tobetake_customer_user', data);
  sessionStorage.setItem('tobetake_customer_user', data);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getCustomerAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }

  return (json.data !== undefined ? json.data : json) as T;
}

export const customerApi = {
  // Storefront
  getStorefront: () => request<CustomerStorefrontData>('/customer/storefront'),
  getCategories: () => request<CategoryItem[]>('/customer/storefront/categories'),
  getSellers: () => request<CustomerSellerSpotlight[]>('/customer/storefront/sellers'),

  // Products & Catalog
  getProducts: (params: CustomerProductQueryParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.categoryId) query.append('categoryId', String(params.categoryId));
    if (params.categorySlug) query.append('categorySlug', params.categorySlug);
    if (params.category) query.append('category', params.category);
    if (params.minPrice !== undefined) query.append('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) query.append('maxPrice', String(params.maxPrice));
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sellerId) query.append('sellerId', params.sellerId);
    if (params.inStock !== undefined) query.append('inStock', String(params.inStock));
    return request<{ products: any[]; pagination: any; availableCategories: any[] }>(`/customer/products?${query.toString()}`);
  },
  getProductDetail: (idOrSlug: string) => request<CustomerProductDetail>(`/customer/products/${idOrSlug}`),

  // Cart
  getCart: () => request<CustomerCartSummary>('/customer/cart'),
  addToCart: (productId: string, quantity = 1) =>
    request<CustomerCartSummary>('/customer/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateCartQuantity: (itemId: string, quantity: number) =>
    request<CustomerCartSummary>(`/customer/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeFromCart: (itemId: string) =>
    request<CustomerCartSummary>(`/customer/cart/${itemId}`, {
      method: 'DELETE',
    }),
  clearCart: () => request<CustomerCartSummary>('/customer/cart', { method: 'DELETE' }),

  // Wishlist
  getWishlist: () => request<CustomerWishlistItem[]>('/customer/wishlist'),
  toggleWishlist: (productId: string) =>
    request<{ wishlisted: boolean; items: CustomerWishlistItem[] }>('/customer/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  removeFromWishlist: (productId: string) =>
    request<CustomerWishlistItem[]>(`/customer/wishlist/${productId}`, {
      method: 'DELETE',
    }),

  // Addresses
  getAddresses: () => request<CustomerAddressItem[]>('/customer/addresses'),
  createAddress: (data: CreateAddressInput) =>
    request<CustomerAddressItem>('/customer/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAddress: (id: string, data: UpdateAddressInput) =>
    request<CustomerAddressItem>(`/customer/addresses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  setDefaultAddress: (id: string) =>
    request<CustomerAddressItem>(`/customer/addresses/${id}/default`, {
      method: 'PATCH',
    }),
  deleteAddress: (id: string) =>
    request<{ success: boolean }>(`/customer/addresses/${id}`, {
      method: 'DELETE',
    }),

  // Checkout & Orders
  getCheckoutPreview: (input?: CheckoutPreviewInput) =>
    request<CheckoutPreviewData>('/customer/checkout/preview', {
      method: 'POST',
      body: JSON.stringify(input || {}),
    }),
  placeOrder: (data: PlaceOrderInput) =>
    request<OrderPlacementResponse>('/customer/checkout/place-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOrders: (status?: string) =>
    request<any[]>(`/customer/orders${status ? `?status=${status}` : ''}`),
  getOrderDetail: (idOrNumber: string) =>
    request<any>(`/customer/orders/${idOrNumber}`),
  cancelOrder: (id: string, reason?: string) =>
    request<any>(`/customer/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  requestReturn: (id: string, reason: string) =>
    request<any>(`/customer/orders/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Reviews
  getReviews: () => request<CustomerReviewItem[]>('/customer/reviews'),
  submitReview: (data: SubmitReviewInput) =>
    request<CustomerReviewItem>('/customer/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: () =>
    request<{ notifications: CustomerNotificationItem[]; unreadCount: number }>('/customer/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/customer/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/customer/notifications/read-all', {
      method: 'PATCH',
    }),

  // Profile
  getProfile: () => request<CustomerProfileSummary>('/customer/profile'),
  updateProfile: (data: UpdateCustomerProfileInput) =>
    request<CustomerProfileSummary>('/customer/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean }>('/customer/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
