/**
 * Shared type definitions for To Be Take monorepo
 */

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected' | 'unknown';
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Department Types
export interface DepartmentItem {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Admin Registration Input DTO Interface
export interface RegisterAdminInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId: number;
  designation: string;
}

// Sanitized Admin User Response (Excludes password and sensitive fields)
export interface AdminUserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  departmentId: number | null;
  department: string | null;
  designation: string | null;
  status: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Marketplace Business Categories for Seller Registration
export const SELLER_BUSINESS_CATEGORIES = [
  'Electronics & Gadgets',
  'Fashion & Apparel',
  'Beauty & Wellness',
  'Home & Living',
  'Sports & Outdoors',
  'Grocery & Food',
  'Health & Personal Care',
  'Books & Stationery',
  'Toys & Kids',
  'Automotive',
  'Jewelry & Accessories',
  'Other',
] as const;

export type SellerBusinessCategory = (typeof SELLER_BUSINESS_CATEGORIES)[number];

// Seller Registration Input DTO Interface
export interface RegisterSellerInput {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  storeName: string;
  businessCategory: string;
}

// Sanitized Seller User Response (Excludes password and sensitive fields)
export interface SellerUserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  storeName: string | null;
  businessCategory: string | null;
  departmentId?: number | null;
  department?: string | null;
  designation?: string | null;
  status: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// User / Buyer Registration Input DTO Interface
export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
}

// Sanitized Buyer User Response (Excludes password and sensitive fields)
export interface BuyerUserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  departmentId: number | null;
  department: string | null;
  designation: string | null;
  status: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
