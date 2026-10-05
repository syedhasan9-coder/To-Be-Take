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

// User Status
export type UserStatusType = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

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

// Login Input DTO Interface
export interface LoginInput {
  username?: string;
  email?: string;
  usernameOrEmail?: string;
  identifier?: string;
  password: string;
  portal?: string;
  requiredRole?: string;
}

// Authenticated User Response Interface
export interface AuthUserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  departmentId?: number | null;
  department?: string | null;
  designation?: string | null;
  storeName?: string | null;
  businessCategory?: string | null;
  status: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ==========================================
// Super Admin & Platform Management Types
// ==========================================

// Permissions
export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  category: string;
}

export interface RolePermissionsResponse {
  roleId: number;
  roleName: string;
  roleCode: string;
  permissions: PermissionItem[];
  allPermissions: PermissionItem[];
}

export interface UpdateRolePermissionsInput {
  roleId: number;
  permissionIds: number[];
}

// User Management Inputs & Item
export interface ManagedUserItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  role: string;
  roleCode: string;
  departmentId?: number | null;
  department?: string | null;
  designation?: string | null;
  storeName?: string | null;
  businessCategory?: string | null;
  status: UserStatusType;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  isLocked: boolean;
  lastLogin?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UpdateUserStatusInput {
  status: UserStatusType;
  reason?: string;
}

export interface CreateAdminInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId: number;
  designation: string;
}

export interface UpdateAdminInput {
  firstName?: string;
  lastName?: string;
  departmentId?: number;
  designation?: string;
  status?: UserStatusType;
}

// Seller Approvals
export type SellerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface SellerApprovalItem {
  id: string;
  sellerId: string;
  sellerUsername: string;
  sellerEmail: string;
  sellerName: string;
  storeName: string | null;
  businessCategory: string | null;
  status: SellerApprovalStatus;
  accountStatus: UserStatusType;
  notes?: string | null;
  rejectionReason?: string | null;
  submittedAt: string | Date;
  reviewedAt?: string | Date | null;
  reviewedByName?: string | null;
  createdAt: string | Date;
}

export interface ReviewSellerApprovalInput {
  status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING';
  reason?: string;
  notes?: string;
}

// Audit Logs
export interface AuditLogItem {
  id: string;
  actorId?: string | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  status: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string | Date;
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  actorRole?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Security Center
export interface UserSessionItem {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  userRole: string;
  sessionToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
  isValid: boolean;
  lastActivityAt: string | Date;
  expiresAt: string | Date;
  createdAt: string | Date;
}

export interface SecurityOverview {
  activeSessionsCount: number;
  totalLoginsToday: number;
  failedLoginsToday: number;
  lockedAccountsCount: number;
  recentLoginActivities: AuditLogItem[];
  activeSessions: UserSessionItem[];
  securitySettings: Record<string, string>;
}

export interface RevokeSessionInput {
  sessionId: string;
  reason?: string;
}

// Platform Settings
export interface PlatformSettingItem {
  id: number;
  key: string;
  value: string;
  description?: string | null;
  category: 'GENERAL' | 'REGISTRATION' | 'MAINTENANCE' | 'SECURITY' | 'NOTIFICATIONS';
  isPublic: boolean;
  updatedBy?: string | null;
  updatedAt: string | Date;
}

export interface PlatformSettingsGrouped {
  general: PlatformSettingItem[];
  registration: PlatformSettingItem[];
  maintenance: PlatformSettingItem[];
  security: PlatformSettingItem[];
  notifications: PlatformSettingItem[];
}

export interface UpdatePlatformSettingsInput {
  settings: Array<{
    key: string;
    value: string;
  }>;
}

// Dashboard Summary & Analytics
export interface KpiSummary {
  totalCustomers: number;
  totalSellers: number;
  totalAdmins: number;
  pendingSellerApprovals: number;
  activeUsers: number;
  suspendedUsers: number;
  // Commerce Marketplace KPIs
  totalOrders?: number;
  totalRevenue?: number;
  pendingOrders?: number;
  ordersRequiringAttention?: number;
  pendingReturns?: number;
  pendingPayouts?: number;
  lowStockCount?: number;
  activeProducts?: number;
}

export interface PlatformGrowthPoint {
  date: string;
  customers: number;
  sellers: number;
  admins: number;
  orders?: number;
  revenue?: number;
}

export interface UserDistribution {
  customers: number;
  sellers: number;
  admins: number;
  superAdmins: number;
  total: number;
}

export interface SellerApprovalBreakdown {
  approved: number;
  pending: number;
  rejected: number;
  suspended: number;
  total: number;
}

export interface SystemOverviewStatus {
  platformStatus: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE';
  customerRegistrationEnabled: boolean;
  sellerRegistrationEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  databaseStatus: 'connected' | 'disconnected';
  serverUptime: number;
  environment: string;
  version: string;
}

export interface SystemAlertItem {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string | Date;
}

export interface CommerceKpis {
  totalOrders: number;
  totalSalesVolume: number;
  totalPlatformCommissions: number;
  lowStockProducts: number;
}

export interface SuperAdminDashboardData {
  kpis: KpiSummary;
  commerceKpis?: CommerceKpis;
  growth: PlatformGrowthPoint[];
  userDistribution: UserDistribution;
  sellerApprovalStatus: SellerApprovalBreakdown;
  recentActivity: AuditLogItem[];
  recentUsers: ManagedUserItem[];
  recentOrders?: OrderListItem[];
  recentPayments?: PaymentListItem[];
  recentSellerApprovals?: SellerApprovalItem[];
  recentReturns?: OrderReturnItem[];
  recentReviews?: ProductReviewItem[];
  lowStockProducts?: InventoryItemDto[];
  topProducts?: ProductListItem[];
  systemOverview: SystemOverviewStatus;
  alerts: SystemAlertItem[];
}

export type AdminDashboardData = SuperAdminDashboardData;

// Reports
export interface ReportsData {
  growth: PlatformGrowthPoint[];
  userDistribution: UserDistribution;
  sellerApprovals: SellerApprovalBreakdown;
  activeVsInactive: {
    active: number;
    inactive: number;
    suspended: number;
    pendingVerification: number;
  };
  registrationsByCategory: Array<{
    category: string;
    count: number;
  }>;
  recentAdminActivities: AuditLogItem[];
  summary: {
    totalAccounts: number;
    verifiedEmailRate: number;
    averageLoginsPerDay: number;
    totalOrders?: number;
    totalSalesVolume?: number;
    totalPlatformCommissions?: number;
    averageOrderValue?: number;
  };
  commerceMetrics?: {
    orderStatusCounts: Record<string, number>;
    revenueByMonth: Array<{ month: string; revenue: number; orders: number }>;
    topSellingCategories: Array<{ category: string; sales: number; count: number }>;
    topSellers: Array<{ sellerName: string; storeName: string; revenue: number; ordersCount: number }>;
  };
}

// Profile
export interface UpdateAdminProfileInput {
  firstName: string;
  lastName: string;
  designation?: string;
  departmentId?: number;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

// ==========================================
// Commerce Core Shared Types
// ==========================================

// Category Types
export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: number | null;
  parentName?: string | null;
  isActive: boolean;
  displayOrder: number;
  productCount: number;
  productsCount?: number;
  subcategoriesCount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
  displayOrder?: number;
}

export type ProductStatusType =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'APPROVED'
  | 'FLAGGED';

export interface ProductListItem {
  id: string;
  sellerId: string;
  sellerUsername?: string;
  sellerName?: string;
  sellerEmail?: string | null;
  storeName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  name: string;
  title?: string;
  slug: string;
  sku: string;
  description?: string | null;
  price: number | any;
  compareAtPrice?: number | any;
  costPrice?: number | any;
  status: ProductStatusType;
  moderationStatus?: ProductStatusType;
  moderationNotes?: string | null;
  rejectionReason?: string | null;
  images: string[];
  stockQuantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  inventory?: {
    stockQuantity: number;
    currentStock?: number;
    reservedQuantity?: number;
    reservedStock?: number;
    availableQuantity?: number;
    availableStock?: number;
    lowStockThreshold?: number;
    isLowStock?: boolean;
    isOutOfStock?: boolean;
    location?: string | null;
  };
  isDeleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ProductDetailItem extends ProductListItem {
  location?: string | null;
  lowStockThreshold?: number;
  availableQuantity?: number;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  sku: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  categoryId?: number;
  sellerId: string;
  images?: string[];
  stockQuantity?: number;
  lowStockThreshold?: number;
  location?: string;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  categoryId?: number | null;
  status?: ProductStatusType;
  moderationNotes?: string;
  images?: string[];
  isDeleted?: boolean;
}

export interface ModerateProductInput {
  status: 'ACTIVE' | 'REJECTED' | 'INACTIVE' | 'PENDING_REVIEW';
  moderationNotes?: string;
}

// Inventory Types
export interface InventoryItemDto {
  id: string;
  productId: string;
  productName: string;
  productTitle?: string;
  sku: string;
  categoryId?: number | null;
  categoryName?: string | null;
  sellerId: string;
  sellerName?: string;
  storeName?: string | null;
  stockQuantity: number;
  currentStock?: number;
  reservedQuantity: number;
  reservedStock?: number;
  availableQuantity: number;
  availableStock?: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  status?: string;
  location?: string | null;
  updatedAt: string | Date;
}

export interface UpdateStockInput {
  stockQuantity: number;
  lowStockThreshold?: number;
  location?: string;
  changeType?: string;
  reason?: string;
}

export interface InventoryLogItem {
  id: string;
  inventoryItemId: string;
  changeType: string;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string | null;
  actorId?: string | null;
  createdAt: string | Date;
}

// Order Management Types
export type OrderStatusType =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatusType = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface OrderItemDto {
  id: string;
  orderId: string;
  productId?: string | null;
  sellerId: string;
  sellerName?: string;
  storeName?: string | null;
  productName: string;
  productTitle?: string;
  sku: string;
  quantity: number;
  unitPrice: number | any;
  totalPrice: number | any;
  createdAt: string | Date;
}

export interface OrderStatusHistoryDto {
  id: string;
  orderId: string;
  fromStatus?: OrderStatusType | null;
  toStatus: OrderStatusType;
  status?: OrderStatusType;
  notes?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  createdAt: string | Date;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  itemsCount?: number;
  status: OrderStatusType;
  paymentStatus: PaymentStatusType;
  currency: string;
  subtotal: number | any;
  shippingTotal: number | any;
  taxTotal: number | any;
  discountTotal: number | any;
  total: number | any;
  totalAmount?: number | any;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OrderDetailItem extends OrderListItem {
  customerPhone?: string | null;
  shippingAddress?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  billingAddress?: string | null;
  customerNotes?: string | null;
  adminNotes?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | Date | null;
  confirmedAt?: string | Date | null;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  shippingAmount?: number | any;
  taxAmount?: number | any;
  discountAmount?: number | any;
  items: OrderItemDto[];
  payments: PaymentListItem[];
  shipments: ShipmentListItem[];
  returns: OrderReturnItem[];
  commissions: CommissionRecordItem[];
  statusHistory: OrderStatusHistoryDto[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatusType;
  notes?: string;
  cancellationReason?: string;
}

// Customers Commerce Context
export interface CustomerCommerceItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatusType;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string | Date | null;
  createdAt: string | Date;
}

export interface CustomerCommerceDetail extends ManagedUserItem {
  commerceSummary: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string | Date | null;
  };
  orders: OrderListItem[];
}

// Sellers Commerce Context
export interface SellerCommerceItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  storeName?: string | null;
  businessCategory?: string | null;
  status: UserStatusType;
  approvalStatus?: SellerApprovalStatus;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  totalCommission: number;
  totalPayouts: number;
  pendingPayoutBalance: number;
  createdAt: string | Date;
}

export interface SellerCommerceDetail extends ManagedUserItem {
  commerceSummary: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    platformCommissionPaid: number;
    totalPayouts: number;
    pendingBalance: number;
  };
  products: ProductListItem[];
  recentOrders: OrderListItem[];
  recentPayouts: SellerPayoutItem[];
}

// Payments Types
export interface PaymentListItem {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  transactionReference: string;
  transactionId?: string;
  providerRef?: string;
  provider?: string;
  paymentMethod: string;
  method?: string;
  amount: number | any;
  currency: string;
  status: PaymentStatusType;
  failureReason?: string | null;
  metadata?: string | null;
  settledAt?: string | Date | null;
  paidAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Commissions Types
export interface CommissionRecordItem {
  id: string;
  orderId: string;
  orderNumber?: string;
  sellerId: string;
  sellerName?: string;
  storeName?: string | null;
  payoutId?: string | null;
  orderAmount: number | any;
  commissionRate: number | any;
  ratePercent?: number | any;
  platformFee: number | any;
  platformAmount?: number | any;
  sellerEarnings: number | any;
  sellerAmount?: number | any;
  isPaidToSeller?: boolean;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CommissionSummaryData {
  totalPlatformFee: number;
  totalSellerEarnings: number;
  pendingCommissions: number;
  defaultCommissionRate: number;
  defaultRatePercent?: number;
  defaultFixedFee?: number;
}

// Seller Payouts Types
export type PayoutStatusType = 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED' | 'REJECTED';

export interface SellerPayoutItem {
  id: string;
  payoutNumber: string;
  sellerId: string;
  sellerName?: string;
  storeName?: string | null;
  amount: number | any;
  currency: string;
  status: PayoutStatusType;
  method?: string;
  reference?: string;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
  paidAt?: string | Date | null;
  processedAt?: string | Date | null;
  processedByName?: string | null;
  notes?: string | null;
  commissionsCount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreatePayoutInput {
  sellerId: string;
  amount?: number;
  notes?: string;
}

export interface ProcessPayoutInput {
  status: 'PAID' | 'PROCESSING' | 'REJECTED' | 'CANCELLED';
  notes?: string;
}

// Returns & Refunds Types
export type ReturnStatusType =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RECEIVED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface OrderReturnItem {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  sellerId: string;
  sellerName?: string;
  storeName?: string | null;
  reason: string;
  status: ReturnStatusType;
  refundStatus: PaymentStatusType;
  refundAmount: number | string;
  adminNotes?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ReviewReturnInput {
  status: ReturnStatusType;
  refundStatus?: PaymentStatusType;
  adminNotes?: string;
}

// Shipping Types
export type ShippingStatusType =
  | 'PENDING'
  | 'LABEL_CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED';

export interface ShipmentListItem {
  id: string;
  orderId: string;
  orderNumber?: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string | null;
  status: ShippingStatusType;
  estimatedDelivery?: string | Date | null;
  shippedDate?: string | Date | null;
  deliveredDate?: string | Date | null;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateShipmentInput {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  notes?: string;
}

export interface UpdateShipmentInput {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status?: ShippingStatusType;
  estimatedDelivery?: string;
  shippedDate?: string;
  deliveredDate?: string;
  notes?: string;
}

// Reviews & Moderation Types
export type ReviewStatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'PUBLISHED' | 'HIDDEN';

export interface ProductReviewItem {
  id: string;
  productId: string;
  productName?: string;
  productTitle?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  sellerId: string;
  sellerName?: string;
  storeName?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  content?: string;
  status: ReviewStatusType;
  isReported: boolean;
  isFlagged?: boolean;
  reportReason?: string | null;
  moderationNotes?: string | null;
  adminNotes?: string | null;
  moderatedByName?: string | null;
  moderatedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ModerateReviewInput {
  status: ReviewStatusType;
  moderationNotes?: string;
}

// Notifications Types
export type AdminNotificationType =
  | 'SELLER_APPROVAL'
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'LOW_STOCK'
  | 'RETURN_REQUEST'
  | 'PAYMENT_ALERT'
  | 'SYSTEM_ALERT';

export interface AdminNotificationItem {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  targetUrl?: string | null;
  linkUrl?: string | null;
  isRead: boolean;
  readAt?: string | Date | null;
  metadata?: string | null;
  createdAt: string | Date;
}

export interface NotificationCenterData {
  unreadCount: number;
  notifications: AdminNotificationItem[];
}

// Commerce Aliases for Admin Module
export type AdminCategoryItem = CategoryItem;
export type AdminOrderItem = OrderListItem;
export type AdminOrderDetail = OrderDetailItem;
export type AdminOrderStatus = OrderStatusType;
export type AdminPaymentStatus = PaymentStatusType;
export type AdminProductItem = ProductListItem;
export type AdminProductDetail = ProductDetailItem;
export type AdminProductStatus = ProductStatusType;
export type AdminProductModerationStatus = ProductStatusType;
export type AdminInventoryItem = InventoryItemDto;
export type AdminPaymentItem = PaymentListItem;
export type AdminCommissionRecordItem = CommissionRecordItem;
export type CommissionConfig = CommissionSummaryData;
export type AdminPayoutItem = SellerPayoutItem;
export type AdminPayoutStatus = PayoutStatusType;
export type AdminReturnItem = OrderReturnItem;
export type AdminReturnStatus = ReturnStatusType;
export type AdminShipmentItem = ShipmentListItem;
export type AdminShippingStatus = ShippingStatusType;
export type AdminReviewItem = ProductReviewItem;
export type AdminReviewStatus = ReviewStatusType;

// Global Search Types
export interface AdminSearchResultItem {
  id: string;
  type: 'order' | 'customer' | 'seller' | 'product';
  title: string;
  subtitle: string;
  badgeText?: string;
  status?: string;
  url: string;
}

export interface AdminSearchResponse {
  query: string;
  total: number;
  results: AdminSearchResultItem[];
}

// ==========================================
// Seller / Vendor Portal Shared Types
// ==========================================

export interface SellerDashboardKpis {
  totalSales: number;
  netSales: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingPayout: number;
  totalPaidPayouts: number;
  totalPlatformFees: number;
  averageOrderValue: number;
}

export interface SellerDashboardData {
  kpis: SellerDashboardKpis;
  recentOrders: OrderListItem[];
  topProducts: ProductListItem[];
  lowStockAlerts: InventoryItemDto[];
  recentReviews: ProductReviewItem[];
  recentNotifications: AdminNotificationItem[];
}

export interface SellerEarningsSummary {
  grossSales: number;
  platformFees: number;
  refundDeductions: number;
  netEarnings: number;
  pendingBalance: number;
  totalPaidOut: number;
  transactions: CommissionRecordItem[];
}

export interface CreateSellerProductInput {
  name: string;
  sku: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  categoryId?: number;
  images?: string[];
  stockQuantity?: number;
  lowStockThreshold?: number;
  location?: string;
}

export interface UpdateSellerProductInput {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  categoryId?: number | null;
  status?: ProductStatusType;
  images?: string[];
}

export interface AdjustSellerStockInput {
  stockQuantity: number;
  lowStockThreshold?: number;
  location?: string;
  changeType?: string;
  reason?: string;
}

export interface UpdateSellerProfileInput {
  storeName?: string;
  businessCategory?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  description?: string;
}

export interface UpdateSellerShipmentInput {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status?: ShippingStatusType;
  estimatedDelivery?: string;
  notes?: string;
}

// ==========================================
// Customer / Storefront Marketplace Shared Types
// ==========================================

export interface CustomerHeroBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  tag: string;
  bgColor?: string;
}

export interface CustomerStorefrontProduct extends ProductListItem {
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  discountPercent?: number;
}

export interface CustomerFlashDeal {
  id: string;
  title: string;
  endsAt: string;
  discountLabel: string;
  products: CustomerStorefrontProduct[];
}

export interface CustomerSellerSpotlight {
  id: string;
  storeName: string;
  ownerName: string;
  businessCategory: string;
  city: string;
  productCount: number;
  rating: number;
  joinedDate: string;
  featuredProducts: CustomerStorefrontProduct[];
}

export interface CustomerStorefrontData {
  heroBanners: CustomerHeroBanner[];
  categories: CategoryItem[];
  featuredProducts: CustomerStorefrontProduct[];
  newArrivals: CustomerStorefrontProduct[];
  bestSellers: CustomerStorefrontProduct[];
  flashDeals: CustomerFlashDeal;
  sellerSpotlights: CustomerSellerSpotlight[];
  topDeals: CustomerStorefrontProduct[];
  recentlyViewed?: CustomerStorefrontProduct[];
}

export interface CustomerProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: number;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  sellerId?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popularity';
}

export interface CustomerProductDetail extends ProductDetailItem {
  rating: number;
  reviewCount: number;
  discountPercent?: number;
  inStock: boolean;
  stockQuantity: number;
  specifications?: Record<string, string>;
  seller: {
    id: string;
    storeName: string;
    ownerName: string;
    city?: string;
    rating: number;
    joinedDate: string;
  };
  deliveryInfo: {
    standardEstimatedDays: string;
    expressEstimatedDays: string;
    couriers: string[];
    freeDeliveryThreshold: number;
    returnDays: number;
  };
  reviews: CustomerReviewItem[];
  relatedProducts: CustomerStorefrontProduct[];
}

export interface CustomerCartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
  quantity: number;
  stockQuantity: number;
  inStock: boolean;
  itemTotal: number;
  sellerName?: string;
  storeName?: string;
}

export interface CustomerCartSummary {
  items: CustomerCartItem[];
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode?: string | null;
  grandTotal: number;
  currency: string;
}

export interface AddToCartInput {
  productId: string;
  quantity?: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CustomerWishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  storeName?: string;
  addedAt: string;
}

export interface CustomerAddressItem {
  id: string;
  label: string; // Home, Office, Other
  recipientName: string;
  phone: string;
  streetAddress: string;
  area?: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateAddressInput {
  label?: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  area?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  recipientName?: string;
  phone?: string;
  streetAddress?: string;
  area?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export type CustomerPaymentMethodType =
  | 'COD'
  | 'JAZZCASH'
  | 'EASYPAISA'
  | 'RAAST'
  | 'BANK_TRANSFER';

export interface CheckoutPreviewInput {
  addressId?: string;
  couponCode?: string;
  shippingMethod?: 'STANDARD' | 'EXPRESS';
}

export interface CheckoutPreviewData {
  subtotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  currency: string;
  itemsCount: number;
  couponApplied?: string | null;
  estimatedDelivery: string;
}

export interface PlaceOrderInput {
  addressId?: string;
  shippingAddress?: CreateAddressInput;
  paymentMethod: CustomerPaymentMethodType;
  shippingMethod?: 'STANDARD' | 'EXPRESS';
  customerNotes?: string;
  couponCode?: string;
}

export interface OrderPlacementResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  total: number;
  currency: string;
  status: OrderStatusType;
  paymentStatus: PaymentStatusType;
  paymentMethod: string;
  shippingAddress: string;
  estimatedDelivery: string;
  message: string;
}

export interface CustomerReviewItem {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  productImage?: string;
  customerId: string;
  customerName: string;
  rating: number;
  title?: string | null;
  comment: string;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

export interface SubmitReviewInput {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
}

export interface CustomerNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  targetUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CustomerProfileSummary {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  totalOrders: number;
  totalWishlist: number;
  totalReviews: number;
  unreadNotifications: number;
  joinedDate: string;
}

export interface UpdateCustomerProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export type CustomerProductDetailData = CustomerProductDetail;
export type PaginatedResponse<T> = PaginatedResult<T>;

