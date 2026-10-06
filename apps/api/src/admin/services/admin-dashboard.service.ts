import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, UserStatus } from '@tobetake/database';
import {
  AuditLogItem,
  ManagedUserItem,
  OrderListItem,
  PlatformGrowthPoint,
  SuperAdminDashboardData,
  SystemAlertItem,
} from '@tobetake/shared-types';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates live database metrics for the Super Admin dashboard including commerce KPIs.
   */
  async getDashboardData(): Promise<SuperAdminDashboardData> {
    const [
      totalCustomers,
      totalSellers,
      totalAdmins,
      totalSuperAdmins,
      pendingApprovals,
      approvedApprovals,
      rejectedApprovals,
      suspendedApprovals,
      activeUsers,
      suspendedUsers,
      recentLogs,
      recentUsersList,
      settingsList,
      dbHealthy,
      allUsersForGrowth,
      // Commerce KPIs
      totalOrders,
      ordersAgg,
      pendingOrders,
      ordersRequiringAttention,
      pendingReturns,
      pendingPayouts,
      activeProducts,
      lowStockItemsCount,
      recentOrdersList,
      recentPaymentsList,
      recentSellerApprovalsList,
      recentReturnsList,
      recentReviewsList,
      lowStockProductsList,
    ] = await Promise.all([
      // 1. User Counts by Role
      this.prisma.user.count({
        where: { role: { code: 'CUST' }, isDeleted: false },
      }),
      this.prisma.user.count({
        where: { role: { code: 'VENDOR' }, isDeleted: false },
      }),
      this.prisma.user.count({
        where: { role: { code: 'ADMIN' }, isDeleted: false },
      }),
      this.prisma.user.count({
        where: { role: { code: 'SPADMIN' }, isDeleted: false },
      }),

      // 2. Seller Approvals Breakdown
      this.prisma.sellerApproval.count({ where: { status: 'PENDING' } }),
      this.prisma.sellerApproval.count({ where: { status: 'APPROVED' } }),
      this.prisma.sellerApproval.count({ where: { status: 'REJECTED' } }),
      this.prisma.sellerApproval.count({ where: { status: 'SUSPENDED' } }),

      // 3. User Status Breakdown
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE, isDeleted: false } }),
      this.prisma.user.count({ where: { status: UserStatus.SUSPENDED, isDeleted: false } }),

      // 4. Recent Activity (Audit Logs)
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),

      // 5. Recent Registered Users
      this.prisma.user.findMany({
        where: { isDeleted: false },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          role: true,
          department: true,
        },
      }),

      // 6. Platform Settings
      this.prisma.platformSetting.findMany(),

      // 7. Database Health
      this.prisma.isHealthy(),

      // 8. User Created Dates for Growth Curve
      this.prisma.user.findMany({
        where: { isDeleted: false },
        select: { createdAt: true, role: { select: { code: true } } },
        orderBy: { createdAt: 'asc' },
      }),

      // 9. Commerce KPIs
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: 'CANCELLED' } },
      }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      this.prisma.orderReturn.count({ where: { status: 'REQUESTED' } }),
      this.prisma.sellerPayout.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count({ where: { status: 'ACTIVE', isDeleted: false } }),
      this.prisma.inventoryItem.count({
        where: {
          stockQuantity: { lte: 5 },
          product: { isDeleted: false },
        },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: { select: { items: true } },
        },
      }),
      // 10. Operational Lists for Admin Console
      this.prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              customer: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      this.prisma.sellerApproval.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              storeName: true,
              businessCategory: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.orderReturn.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
          customer: { select: { firstName: true, lastName: true, email: true } },
          seller: { select: { storeName: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.productReview.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true } },
          customer: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.inventoryItem.findMany({
        where: {
          stockQuantity: { lte: 5 },
          product: { isDeleted: false },
        },
        take: 5,
        orderBy: { stockQuantity: 'asc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              status: true,
              seller: { select: { storeName: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    // Format settings dictionary
    const settingsMap = new Map<string, string>();
    for (const s of settingsList) {
      settingsMap.set(s.key, s.value);
    }

    // Build real Growth Curve data
    const growth = this.calculateGrowthTimeline(allUsersForGrowth);

    // Format recent activity
    const recentActivity: AuditLogItem[] = recentLogs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      actorName: log.actorName,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      status: log.status,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));

    // Format recent users
    const recentUsers: ManagedUserItem[] = recentUsersList.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      roleId: u.roleId,
      role: u.role.name,
      roleCode: u.role.code,
      departmentId: u.departmentId,
      department: u.department?.name ?? null,
      designation: u.designation,
      storeName: u.storeName,
      businessCategory: u.businessCategory,
      status: u.status as unknown as ManagedUserItem['status'],
      isEmailVerified: u.isEmailVerified,
      isMobileVerified: u.isMobileVerified,
      isLocked: u.isLocked,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    // Format recent orders
    const recentOrders: OrderListItem[] = recentOrdersList.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
      customerEmail: o.customer.email,
      itemCount: o._count.items,
      status: o.status,
      paymentStatus: o.paymentStatus,
      currency: o.currency,
      subtotal: Number(o.subtotal),
      shippingTotal: Number(o.shippingTotal),
      taxTotal: Number(o.taxTotal),
      discountTotal: Number(o.discountTotal),
      total: Number(o.total),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    // Format recent payments
    const recentPayments: import('@tobetake/shared-types').PaymentListItem[] = recentPaymentsList.map(
      (p) => ({
        id: p.id,
        orderId: p.orderId,
        orderNumber: p.order?.orderNumber,
        customerName: p.order?.customer
          ? `${p.order.customer.firstName} ${p.order.customer.lastName}`.trim()
          : undefined,
        customerEmail: p.order?.customer?.email,
        transactionReference: p.transactionReference,
        paymentMethod: p.paymentMethod,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        failureReason: p.failureReason,
        metadata: p.metadata,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }),
    );

    // Format recent seller approvals
    const recentSellerApprovals: import('@tobetake/shared-types').SellerApprovalItem[] =
      recentSellerApprovalsList.map((a) => ({
        id: a.id,
        sellerId: a.sellerId,
        sellerUsername: a.seller.username,
        sellerEmail: a.seller.email,
        sellerName: `${a.seller.firstName} ${a.seller.lastName}`.trim(),
        storeName: a.seller.storeName,
        businessCategory: a.seller.businessCategory,
        status: a.status,
        accountStatus: a.seller.status,
        notes: a.notes,
        rejectionReason: a.rejectionReason,
        submittedAt: a.submittedAt,
        reviewedAt: a.reviewedAt,
        createdAt: a.createdAt,
      }));

    // Format recent returns
    const recentReturns: import('@tobetake/shared-types').OrderReturnItem[] = recentReturnsList.map(
      (r) => ({
        id: r.id,
        returnNumber: r.returnNumber,
        orderId: r.orderId,
        orderNumber: r.order?.orderNumber,
        customerId: r.customerId,
        customerName: r.customer
          ? `${r.customer.firstName} ${r.customer.lastName}`.trim()
          : undefined,
        customerEmail: r.customer?.email,
        sellerId: r.sellerId,
        sellerName: r.seller
          ? `${r.seller.firstName} ${r.seller.lastName}`.trim()
          : undefined,
        storeName: r.seller?.storeName,
        reason: r.reason,
        status: r.status,
        refundStatus: r.refundStatus,
        refundAmount: Number(r.refundAmount),
        adminNotes: r.adminNotes,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }),
    );

    // Format recent reviews requiring moderation
    const recentReviews: import('@tobetake/shared-types').ProductReviewItem[] = recentReviewsList.map(
      (rv) => ({
        id: rv.id,
        productId: rv.productId,
        productName: rv.product?.name,
        productTitle: rv.product?.name,
        customerId: rv.customerId,
        customerName: rv.customer
          ? `${rv.customer.firstName} ${rv.customer.lastName}`.trim()
          : undefined,
        customerEmail: rv.customer?.email,
        sellerId: rv.sellerId,
        rating: rv.rating,
        title: rv.title,
        comment: rv.comment,
        status: rv.status,
        isReported: rv.isReported,
        reportReason: rv.reportReason,
        moderationNotes: rv.moderationNotes,
        moderatedAt: rv.moderatedAt,
        createdAt: rv.createdAt,
        updatedAt: rv.updatedAt,
      }),
    );

    // Format low stock products
    const lowStockProducts: import('@tobetake/shared-types').InventoryItemDto[] =
      lowStockProductsList.map((inv) => ({
        id: inv.id,
        productId: inv.productId,
        productName: inv.product?.name,
        productTitle: inv.product?.name,
        sku: inv.sku,
        sellerId: inv.product?.seller ? inv.product.id : '',
        sellerName: inv.product?.seller
          ? `${inv.product.seller.firstName} ${inv.product.seller.lastName}`.trim()
          : undefined,
        storeName: inv.product?.seller?.storeName,
        stockQuantity: inv.stockQuantity,
        reservedQuantity: inv.reservedQuantity,
        availableQuantity: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
        lowStockThreshold: inv.lowStockThreshold,
        isLowStock: inv.stockQuantity > 0 && inv.stockQuantity <= inv.lowStockThreshold,
        isOutOfStock: inv.stockQuantity <= 0,
        location: inv.location,
        updatedAt: inv.updatedAt,
      }));

    // Generate System Alerts
    const alerts: SystemAlertItem[] = [];

    if (pendingApprovals > 0) {
      alerts.push({
        id: 'alert-pending-sellers',
        level: 'warning',
        title: 'Pending Seller Approvals',
        message: `${pendingApprovals} seller onboarding ${pendingApprovals === 1 ? 'request requires' : 'requests require'} review and approval.`,
        timestamp: new Date(),
      });
    }

    if (pendingReturns > 0) {
      alerts.push({
        id: 'alert-pending-returns',
        level: 'warning',
        title: 'Pending Return Requests',
        message: `${pendingReturns} customer return ${pendingReturns === 1 ? 'request needs' : 'requests need'} review.`,
        timestamp: new Date(),
      });
    }

    if (pendingPayouts > 0) {
      alerts.push({
        id: 'alert-pending-payouts',
        level: 'info',
        title: 'Pending Seller Payouts',
        message: `${pendingPayouts} seller payout ${pendingPayouts === 1 ? 'disbursement is' : 'disbursements are'} queued.`,
        timestamp: new Date(),
      });
    }

    if (lowStockItemsCount > 0) {
      alerts.push({
        id: 'alert-low-stock',
        level: 'warning',
        title: 'Low Stock Inventory Alert',
        message: `${lowStockItemsCount} product ${lowStockItemsCount === 1 ? 'item is' : 'items are'} currently low in stock or out of stock.`,
        timestamp: new Date(),
      });
    }

    const isMaintenance = settingsMap.get('maintenance_mode') === 'true';
    if (isMaintenance) {
      alerts.push({
        id: 'alert-maintenance-mode',
        level: 'critical',
        title: 'Maintenance Mode Active',
        message: 'Platform maintenance mode is currently ON. Public visitor access is paused.',
        timestamp: new Date(),
      });
    }

    const customerReg = settingsMap.get('customer_registration_enabled') !== 'false';
    const sellerReg = settingsMap.get('seller_registration_enabled') !== 'false';

    if (!customerReg || !sellerReg) {
      alerts.push({
        id: 'alert-registration-paused',
        level: 'info',
        title: 'Registration Policy Notice',
        message: `Customer registration is ${customerReg ? 'enabled' : 'disabled'}; Seller onboarding is ${sellerReg ? 'enabled' : 'disabled'}.`,
        timestamp: new Date(),
      });
    }

    const totalRevenue = Number(ordersAgg._sum.total || 0);

    return {
      kpis: {
        totalCustomers,
        totalSellers,
        totalAdmins,
        pendingSellerApprovals: pendingApprovals,
        activeUsers,
        suspendedUsers,
        totalOrders,
        totalRevenue,
        pendingOrders,
        ordersRequiringAttention,
        pendingReturns,
        pendingPayouts,
        lowStockCount: lowStockItemsCount,
        activeProducts,
      },
      growth,
      userDistribution: {
        customers: totalCustomers,
        sellers: totalSellers,
        admins: totalAdmins,
        superAdmins: totalSuperAdmins,
        total: totalCustomers + totalSellers + totalAdmins + totalSuperAdmins,
      },
      sellerApprovalStatus: {
        approved: approvedApprovals,
        pending: pendingApprovals,
        rejected: rejectedApprovals,
        suspended: suspendedApprovals,
        total: approvedApprovals + pendingApprovals + rejectedApprovals + suspendedApprovals,
      },
      recentActivity,
      recentUsers,
      recentOrders,
      recentPayments,
      recentSellerApprovals,
      recentReturns,
      recentReviews,
      lowStockProducts,
      systemOverview: {
        platformStatus: isMaintenance
          ? 'MAINTENANCE'
          : (settingsMap.get('platform_status') as 'ONLINE' | 'DEGRADED' | 'MAINTENANCE') ||
            'ONLINE',
        customerRegistrationEnabled: customerReg,
        sellerRegistrationEnabled: sellerReg,
        maintenanceMode: isMaintenance,
        maintenanceMessage:
          settingsMap.get('maintenance_message') ||
          'To Be Take is undergoing scheduled platform enhancements.',
        databaseStatus: dbHealthy ? 'connected' : 'disconnected',
        serverUptime: Math.floor((Date.now() - this.startTime) / 1000),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
      },
      alerts,
    };
  }

  private calculateGrowthTimeline(
    users: Array<{ createdAt: Date; role: { code: string } }>,
  ): PlatformGrowthPoint[] {
    const pointsMap = new Map<string, { customers: number; sellers: number; admins: number }>();

    // Generate month slots for the last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      pointsMap.set(label, { customers: 0, sellers: 0, admins: 0 });
    }

    // Accumulate user counts
    let runningCustomers = 0;
    let runningSellers = 0;
    let runningAdmins = 0;

    for (const u of users) {
      if (u.role.code === 'CUST') runningCustomers++;
      else if (u.role.code === 'VENDOR') runningSellers++;
      else if (u.role.code === 'ADMIN' || u.role.code === 'SPADMIN') runningAdmins++;

      const monthLabel = u.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      if (pointsMap.has(monthLabel)) {
        pointsMap.set(monthLabel, {
          customers: runningCustomers,
          sellers: runningSellers,
          admins: runningAdmins,
        });
      }
    }

    // Fill in forward values
    let lastKnown = { customers: 0, sellers: 0, admins: 0 };
    const points: PlatformGrowthPoint[] = [];

    for (const [date, val] of pointsMap.entries()) {
      if (
        val.customers === 0 &&
        val.sellers === 0 &&
        val.admins === 0 &&
        (lastKnown.customers > 0 || lastKnown.sellers > 0 || lastKnown.admins > 0)
      ) {
        points.push({
          date,
          customers: lastKnown.customers,
          sellers: lastKnown.sellers,
          admins: lastKnown.admins,
        });
      } else {
        lastKnown = val;
        points.push({
          date,
          customers: val.customers,
          sellers: val.sellers,
          admins: val.admins,
        });
      }
    }

    return points;
  }
}
