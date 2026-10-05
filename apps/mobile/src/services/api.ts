import {
  ApiResponse,
  CustomerStorefrontData,
  CustomerStorefrontProduct,
  CustomerProductDetailData,
  CustomerCartSummary,
  CustomerWishlistItem,
  CustomerAddressItem,
  CreateAddressInput,
  CheckoutPreviewData,
  CheckoutPreviewInput,
  PlaceOrderInput,
  OrderPlacementResponse,
  CustomerReviewItem,
  SubmitReviewInput,
  CustomerNotificationItem,
  CustomerProfileSummary,
  UpdateCustomerProfileInput,
  PaginatedResponse,
  OrderDetailItem,
} from '@tobetake/shared-types';
import { CustomerUser } from '../types';
import { getCustomerToken, saveCustomerSession } from './storage';

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    [key: string]: string | undefined;
  };
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiAuthResult {
  success: boolean;
  user?: CustomerUser;
  token?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface RawUserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  token?: string;
  createdAt?: string | Date;
}

// Internal authenticated fetcher
async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: any;
    params?: Record<string, string | number | boolean | undefined>;
  } = {},
): Promise<T> {
  const token = await getCustomerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let url = `${API_BASE_URL}${path}`;
  if (options.params) {
    const search = new URLSearchParams();
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        search.append(k, String(v));
      }
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.message || 'API request failed');
  }

  return json.data as T;
}

// ---------------- AUTHENTICATION ---------------- //

export async function loginCustomer(identifier: string, password: string): Promise<ApiAuthResult> {
  try {
    const payload = {
      identifier: identifier.trim(),
      password,
    };

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as ApiResponse<RawUserResponse>;

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: result.message || 'Invalid username/email or password.',
        };
      }

      if (response.status === 400) {
        if (Array.isArray(result.message)) {
          return {
            success: false,
            error: result.message.join(', '),
          };
        }
        return {
          success: false,
          error: result.message || 'Please check your login details and try again.',
        };
      }

      return {
        success: false,
        error: result.message || 'Sign in failed. Please try again later.',
      };
    }

    if (result.data) {
      const { roleCode, role } = result.data;
      if (roleCode !== 'CUST' && roleCode !== 'USER') {
        return {
          success: false,
          error:
            'This mobile application is exclusively for customers. Sellers and administrators should access the web portal.',
        };
      }

      const user: CustomerUser = {
        id: result.data.id,
        username: result.data.username,
        email: result.data.email,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        role: role || 'Buyer',
        roleCode: roleCode || 'CUST',
        createdAt: result.data.createdAt,
      };

      const token = result.data.token || '';
      await saveCustomerSession(user, token);

      return {
        success: true,
        user,
        token,
      };
    }

    return {
      success: false,
      error: 'Unexpected server response. Please try again.',
    };
  } catch (error) {
    console.error('Network error during customer login:', error);
    return {
      success: false,
      error: 'Unable to connect to the server. Please check your network connection and try again.',
    };
  }
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function registerCustomer(payload: RegisterPayload): Promise<ApiAuthResult> {
  try {
    const formattedPayload = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      username: payload.username.trim().toLowerCase(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    };

    const response = await fetch(`${API_BASE_URL}/auth/register/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedPayload),
    });

    const result = (await response.json()) as ApiResponse<RawUserResponse>;

    if (!response.ok) {
      if (response.status === 409) {
        return {
          success: false,
          error: 'This username or email is already registered.',
        };
      }

      if (response.status === 400) {
        if (Array.isArray(result.message)) {
          return {
            success: false,
            error: result.message.join(', '),
          };
        }
        return {
          success: false,
          error: result.message || 'Registration details are invalid.',
        };
      }

      return {
        success: false,
        error: result.message || 'Registration failed. Please try again.',
      };
    }

    const userData = result.data;
    const user: CustomerUser = {
      id: userData?.id || 'temp-id',
      username: formattedPayload.username,
      email: formattedPayload.email,
      firstName: formattedPayload.firstName,
      lastName: formattedPayload.lastName,
      role: userData?.role || 'Buyer',
      roleCode: userData?.roleCode || 'CUST',
      createdAt: userData?.createdAt,
    };

    const token = userData?.token || '';
    await saveCustomerSession(user, token);

    return {
      success: true,
      user,
      token,
    };
  } catch (error) {
    console.error('Network error during customer registration:', error);
    return {
      success: false,
      error: 'Unable to connect to the server. Please check your network connection and try again.',
    };
  }
}

// ---------------- STOREFRONT & PRODUCTS ---------------- //

export async function getCustomerStorefront(): Promise<CustomerStorefrontData> {
  return apiRequest<CustomerStorefrontData>('/customer/storefront');
}

export interface ProductsQueryParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popularity';
  page?: number;
  limit?: number;
}

export interface CustomerProductsResponse {
  products: CustomerStorefrontProduct[];
  items: CustomerStorefrontProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  availableCategories?: Array<{
    id: number;
    name: string;
    slug: string;
    parentId?: number | null;
    count?: number;
  }>;
}

export async function getCustomerProducts(
  params?: ProductsQueryParams,
): Promise<CustomerProductsResponse> {
  const res = await apiRequest<any>('/customer/products', {
    params: params as any,
  });
  const products = res?.products || res?.items || (Array.isArray(res) ? res : []);
  return {
    ...res,
    products,
    items: products,
  };
}

export async function getCustomerProductDetail(
  idOrSlug: string,
): Promise<CustomerProductDetailData> {
  return apiRequest<CustomerProductDetailData>(`/customer/products/${idOrSlug}`);
}

// ---------------- CART ---------------- //

export async function getCustomerCart(): Promise<CustomerCartSummary> {
  return apiRequest<CustomerCartSummary>('/customer/cart');
}

export async function addCustomerCartItem(
  productId: string,
  quantity = 1,
): Promise<CustomerCartSummary> {
  return apiRequest<CustomerCartSummary>('/customer/cart', {
    method: 'POST',
    body: { productId, quantity },
  });
}

export async function updateCustomerCartQuantity(
  itemId: string,
  quantity: number,
): Promise<CustomerCartSummary> {
  return apiRequest<CustomerCartSummary>(`/customer/cart/${itemId}`, {
    method: 'PUT',
    body: { quantity },
  });
}

export async function removeCustomerCartItem(itemId: string): Promise<CustomerCartSummary> {
  return apiRequest<CustomerCartSummary>(`/customer/cart/${itemId}`, {
    method: 'DELETE',
  });
}

export async function clearCustomerCart(): Promise<CustomerCartSummary> {
  return apiRequest<CustomerCartSummary>('/customer/cart', {
    method: 'DELETE',
  });
}

// ---------------- WISHLIST ---------------- //

export async function getCustomerWishlist(): Promise<CustomerWishlistItem[]> {
  return apiRequest<CustomerWishlistItem[]>('/customer/wishlist');
}

export async function toggleCustomerWishlist(
  productId: string,
): Promise<{ wishlisted: boolean; items: CustomerWishlistItem[] }> {
  return apiRequest<{ wishlisted: boolean; items: CustomerWishlistItem[] }>(
    `/customer/wishlist/${productId}/toggle`,
    { method: 'POST' },
  );
}

// ---------------- ADDRESSES ---------------- //

export async function getCustomerAddresses(): Promise<CustomerAddressItem[]> {
  return apiRequest<CustomerAddressItem[]>('/customer/addresses');
}

export async function createCustomerAddress(
  data: CreateAddressInput,
): Promise<CustomerAddressItem> {
  return apiRequest<CustomerAddressItem>('/customer/addresses', {
    method: 'POST',
    body: data,
  });
}

export async function deleteCustomerAddress(id: string): Promise<void> {
  return apiRequest<void>(`/customer/addresses/${id}`, {
    method: 'DELETE',
  });
}

// ---------------- CHECKOUT & ORDERS ---------------- //

export async function getCheckoutPreview(
  params?: CheckoutPreviewInput,
): Promise<CheckoutPreviewData> {
  return apiRequest<CheckoutPreviewData>('/customer/checkout/preview', {
    params: params as any,
  });
}

export async function placeCustomerOrder(
  data: PlaceOrderInput,
): Promise<OrderPlacementResponse> {
  return apiRequest<OrderPlacementResponse>('/customer/checkout/place-order', {
    method: 'POST',
    body: data,
  });
}

export async function getCustomerOrders(
  status?: string,
): Promise<PaginatedResponse<OrderDetailItem>> {
  return apiRequest<PaginatedResponse<OrderDetailItem>>('/customer/orders', {
    params: { status },
  });
}

export async function getCustomerOrderDetail(id: string): Promise<OrderDetailItem> {
  return apiRequest<OrderDetailItem>(`/customer/orders/${id}`);
}

export async function cancelCustomerOrder(
  id: string,
  reason: string,
): Promise<OrderDetailItem> {
  return apiRequest<OrderDetailItem>(`/customer/orders/${id}/cancel`, {
    method: 'POST',
    body: { reason },
  });
}

export async function requestCustomerReturn(
  id: string,
  reason: string,
): Promise<OrderDetailItem> {
  return apiRequest<OrderDetailItem>(`/customer/orders/${id}/return`, {
    method: 'POST',
    body: { reason },
  });
}

// ---------------- REVIEWS ---------------- //

export async function getCustomerReviews(): Promise<CustomerReviewItem[]> {
  return apiRequest<CustomerReviewItem[]>('/customer/reviews');
}

export async function submitCustomerReview(
  data: SubmitReviewInput,
): Promise<CustomerReviewItem> {
  return apiRequest<CustomerReviewItem>('/customer/reviews', {
    method: 'POST',
    body: data,
  });
}

// ---------------- NOTIFICATIONS ---------------- //

export async function getCustomerNotifications(): Promise<{
  unreadCount: number;
  notifications: CustomerNotificationItem[];
}> {
  return apiRequest<{
    unreadCount: number;
    notifications: CustomerNotificationItem[];
  }>('/customer/notifications');
}

export async function markCustomerNotificationRead(id: string): Promise<void> {
  return apiRequest<void>(`/customer/notifications/${id}/read`, {
    method: 'PUT',
  });
}

// ---------------- PROFILE ---------------- //

export async function getCustomerProfile(): Promise<CustomerProfileSummary> {
  return apiRequest<CustomerProfileSummary>('/customer/profile');
}

export async function updateCustomerProfile(
  data: UpdateCustomerProfileInput,
): Promise<CustomerProfileSummary> {
  return apiRequest<CustomerProfileSummary>('/customer/profile', {
    method: 'PUT',
    body: data,
  });
}
