import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaService, UserStatus } from '@tobetake/database';
import { ManagedUserItem, PaginatedResult } from '@tobetake/shared-types';
import { PasswordService } from '../../common/services/password.service';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { AdminUserQueryDto } from '../dto/admin-user-query.dto';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * Retrieves paginated users filtered by role code ('CUST', 'VENDOR', 'ADMIN', or all).
   */
  async listUsers(
    roleCodes: string[],
    query: AdminUserQueryDto,
  ): Promise<PaginatedResult<ManagedUserItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
    };

    if (roleCodes.length > 0) {
      where.role = {
        code: { in: roleCodes },
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { username: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { storeName: { contains: s, mode: 'insensitive' } },
        { businessCategory: { contains: s, mode: 'insensitive' } },
        { designation: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    if (['username', 'email', 'firstName', 'lastName', 'createdAt', 'status'].includes(sortField)) {
      orderBy[sortField as keyof Prisma.UserOrderByWithRelationInput] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          role: true,
          department: true,
        },
      }),
    ]);

    return {
      items: users.map((u) => ({
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
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves single user details.
   */
  async getUserDetails(id: string): Promise<ManagedUserItem> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      role: user.role.name,
      roleCode: user.role.code,
      departmentId: user.departmentId,
      department: user.department?.name ?? null,
      designation: user.designation,
      storeName: user.storeName,
      businessCategory: user.businessCategory,
      status: user.status as unknown as ManagedUserItem['status'],
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
      isLocked: user.isLocked,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Updates user account status (Activate, Deactivate, Suspend, Reactivate).
   * Backend protection: Non-super-admins CANNOT modify Super Admin accounts.
   */
  async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<ManagedUserItem> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser || targetUser.isDeleted) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    // CRITICAL BACKEND SECURITY CHECK:
    if (
      (targetUser.role.code === 'SPADMIN' || targetUser.role.code === 'ADMIN') &&
      currentAdmin.roleCode !== 'SPADMIN'
    ) {
      this.logger.warn(
        `Security violation: Admin '${currentAdmin.username}' attempted to modify administrator '${targetUser.username}'`,
      );
      throw new ForbiddenException(
        'Super Admin account protection: Standard administrators cannot modify or suspend administrator accounts.',
      );
    }

    // Super Admin cannot suspend itself
    if (targetUser.id === currentAdmin.id && dto.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        'You cannot deactivate or suspend your own active administrator session.',
      );
    }

    const previousStatus = targetUser.status;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status,
        updatedBy: currentAdmin.id,
      },
      include: {
        role: true,
        department: true,
      },
    });

    // Record audit log
    await this.auditService.recordLog({
      actor: currentAdmin,
      action: `USER_STATUS_${dto.status}`,
      targetType: 'User',
      targetId: updatedUser.id,
      status: 'SUCCESS',
      details: {
        targetUsername: updatedUser.username,
        targetRole: updatedUser.role.code,
        previousStatus,
        newStatus: dto.status,
        reason: dto.reason || 'Admin status change',
      },
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      roleId: updatedUser.roleId,
      role: updatedUser.role.name,
      roleCode: updatedUser.role.code,
      departmentId: updatedUser.departmentId,
      department: updatedUser.department?.name ?? null,
      designation: updatedUser.designation,
      storeName: updatedUser.storeName,
      businessCategory: updatedUser.businessCategory,
      status: updatedUser.status as unknown as ManagedUserItem['status'],
      isEmailVerified: updatedUser.isEmailVerified,
      isMobileVerified: updatedUser.isMobileVerified,
      isLocked: updatedUser.isLocked,
      lastLogin: updatedUser.lastLogin,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  /**
   * Creates an Admin account.
   * Backend protection: Non-super-admins CANNOT create Super Admin accounts.
   */
  async createAdmin(
    dto: CreateAdminUserDto,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<ManagedUserItem> {
    // Only Super Admin or Admins with ADMINS_MANAGE can create admins
    if (
      currentAdmin.roleCode !== 'SPADMIN' &&
      !currentAdmin.permissions.includes('ADMINS_MANAGE')
    ) {
      throw new ForbiddenException('You do not have permission to create administrative accounts.');
    }

    // Check duplicate username
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('A user with the specified username or email already exists.');
    }

    // Verify department
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });

    if (!department) {
      throw new BadRequestException(`Department ID ${dto.departmentId} does not exist.`);
    }

    // Resolve ADMIN role
    const adminRole = await this.prisma.userRole.findUnique({
      where: { code: 'ADMIN' },
    });

    if (!adminRole) {
      throw new BadRequestException('Administrator role is not configured.');
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    const newAdmin = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: adminRole.id,
        departmentId: department.id,
        designation: dto.designation,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        createdBy: currentAdmin.id,
      },
      include: {
        role: true,
        department: true,
      },
    });

    // Record audit log
    await this.auditService.recordLog({
      actor: currentAdmin,
      action: 'ADMIN_CREATED',
      targetType: 'Admin',
      targetId: newAdmin.id,
      status: 'SUCCESS',
      details: {
        createdAdminUsername: newAdmin.username,
        createdAdminEmail: newAdmin.email,
        department: department.name,
        designation: newAdmin.designation,
      },
    });

    return {
      id: newAdmin.id,
      username: newAdmin.username,
      email: newAdmin.email,
      firstName: newAdmin.firstName,
      lastName: newAdmin.lastName,
      roleId: newAdmin.roleId,
      role: newAdmin.role.name,
      roleCode: newAdmin.role.code,
      departmentId: newAdmin.departmentId,
      department: newAdmin.department?.name ?? null,
      designation: newAdmin.designation,
      storeName: null,
      businessCategory: null,
      status: newAdmin.status as unknown as ManagedUserItem['status'],
      isEmailVerified: newAdmin.isEmailVerified,
      isMobileVerified: newAdmin.isMobileVerified,
      isLocked: newAdmin.isLocked,
      lastLogin: newAdmin.lastLogin,
      createdAt: newAdmin.createdAt,
      updatedAt: newAdmin.updatedAt,
    };
  }

  /**
   * Updates an Admin account.
   * Backend protection: Non-super-admins CANNOT edit Super Admin accounts.
   */
  async updateAdmin(
    id: string,
    dto: UpdateAdminUserDto,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<ManagedUserItem> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser || targetUser.isDeleted) {
      throw new NotFoundException(`Admin account with ID '${id}' was not found.`);
    }

    // Backend protection:
    if (targetUser.role.code === 'SPADMIN' && currentAdmin.roleCode !== 'SPADMIN') {
      throw new ForbiddenException(
        'Super Admin account protection: Standard administrators cannot modify Super Admin accounts.',
      );
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new BadRequestException(`Department ID ${dto.departmentId} does not exist.`);
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        departmentId: dto.departmentId,
        designation: dto.designation,
        status: dto.status,
        updatedBy: currentAdmin.id,
      },
      include: {
        role: true,
        department: true,
      },
    });

    await this.auditService.recordLog({
      actor: currentAdmin,
      action: 'ADMIN_UPDATED',
      targetType: 'Admin',
      targetId: updated.id,
      status: 'SUCCESS',
      details: {
        targetUsername: updated.username,
        changes: dto,
      },
    });

    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      roleId: updated.roleId,
      role: updated.role.name,
      roleCode: updated.role.code,
      departmentId: updated.departmentId,
      department: updated.department?.name ?? null,
      designation: updated.designation,
      storeName: null,
      businessCategory: null,
      status: updated.status as unknown as ManagedUserItem['status'],
      isEmailVerified: updated.isEmailVerified,
      isMobileVerified: updated.isMobileVerified,
      isLocked: updated.isLocked,
      lastLogin: updated.lastLogin,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * List customers with commerce metrics (order count, total spent, last order).
   */
  async listCustomersCommerce(
    query: AdminUserQueryDto,
  ): Promise<PaginatedResult<import('@tobetake/shared-types').CustomerCommerceItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      role: { code: 'CUST' },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { username: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customerOrders: {
            select: {
              id: true,
              total: true,
              createdAt: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      items: customers.map((c) => {
        const activeOrders = c.customerOrders.filter((o) => o.status !== 'CANCELLED');
        const totalSpent = activeOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const sortedOrders = [...c.customerOrders].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].createdAt : null;

        return {
          id: c.id,
          username: c.username,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          status: c.status as unknown as ManagedUserItem['status'],
          isEmailVerified: c.isEmailVerified,
          isMobileVerified: c.isMobileVerified,
          orderCount: c.customerOrders.length,
          totalSpent,
          lastOrderDate,
          createdAt: c.createdAt,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single customer with detailed commerce history.
   */
  async getCustomerCommerceDetail(
    id: string,
  ): Promise<import('@tobetake/shared-types').CustomerCommerceDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
        customerOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            customer: true,
            _count: { select: { items: true } },
          },
        },
      },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException(`Customer with ID '${id}' was not found`);
    }

    const activeOrders = user.customerOrders.filter((o) => o.status !== 'CANCELLED');
    const totalSpent = activeOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const avgOrderValue = activeOrders.length > 0 ? totalSpent / activeOrders.length : 0;
    const lastOrderDate = user.customerOrders.length > 0 ? user.customerOrders[0].createdAt : null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      role: user.role.name,
      roleCode: user.role.code,
      departmentId: user.departmentId,
      department: user.department?.name ?? null,
      designation: user.designation,
      storeName: user.storeName,
      businessCategory: user.businessCategory,
      status: user.status as unknown as ManagedUserItem['status'],
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
      isLocked: user.isLocked,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      commerceSummary: {
        totalOrders: user.customerOrders.length,
        totalSpent,
        averageOrderValue: avgOrderValue,
        lastOrderDate,
      },
      orders: user.customerOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customerName: `${user.firstName} ${user.lastName}`.trim(),
        customerEmail: user.email,
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
      })),
    };
  }

  /**
   * List sellers with commerce summary metrics.
   */
  async listSellersCommerce(
    query: AdminUserQueryDto,
  ): Promise<PaginatedResult<import('@tobetake/shared-types').SellerCommerceItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      role: { code: 'VENDOR' },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { username: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { storeName: { contains: s, mode: 'insensitive' } },
        { businessCategory: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, sellers] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sellerApprovals: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          sellerProducts: {
            where: { isDeleted: false },
            select: { id: true },
          },
          sellerCommissions: true,
          sellerPayouts: true,
          sellerOrderItems: {
            select: { id: true },
          },
        },
      }),
    ]);

    return {
      items: sellers.map((s) => {
        const latestApproval = s.sellerApprovals[0];
        const totalSales = s.sellerCommissions.reduce((sum, c) => sum + Number(c.orderAmount), 0);
        const totalCommission = s.sellerCommissions.reduce(
          (sum, c) => sum + Number(c.platformFee),
          0,
        );
        const totalSellerEarnings = s.sellerCommissions.reduce(
          (sum, c) => sum + Number(c.sellerEarnings),
          0,
        );
        const totalPayouts = s.sellerPayouts
          .filter((p) => p.status === 'PAID')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const pendingPayoutBalance = Math.max(0, totalSellerEarnings - totalPayouts);

        return {
          id: s.id,
          username: s.username,
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          storeName: s.storeName,
          businessCategory: s.businessCategory,
          status: s.status as unknown as ManagedUserItem['status'],
          approvalStatus: latestApproval?.status,
          totalProducts: s.sellerProducts.length,
          totalOrders: s.sellerOrderItems.length,
          totalSales,
          totalCommission,
          totalPayouts,
          pendingPayoutBalance,
          createdAt: s.createdAt,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single seller with detailed commerce data.
   */
  async getSellerCommerceDetail(
    id: string,
  ): Promise<import('@tobetake/shared-types').SellerCommerceDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
        sellerProducts: {
          where: { isDeleted: false },
          include: { category: true, inventory: true },
          orderBy: { createdAt: 'desc' },
        },
        sellerCommissions: {
          include: { order: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        sellerPayouts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException(`Seller with ID '${id}' was not found`);
    }

    const totalSales = user.sellerCommissions.reduce((sum, c) => sum + Number(c.orderAmount), 0);
    const totalCommission = user.sellerCommissions.reduce(
      (sum, c) => sum + Number(c.platformFee),
      0,
    );
    const totalEarnings = user.sellerCommissions.reduce(
      (sum, c) => sum + Number(c.sellerEarnings),
      0,
    );
    const totalPayouts = user.sellerPayouts
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingBalance = Math.max(0, totalEarnings - totalPayouts);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      role: user.role.name,
      roleCode: user.role.code,
      departmentId: user.departmentId,
      department: user.department?.name ?? null,
      designation: user.designation,
      storeName: user.storeName,
      businessCategory: user.businessCategory,
      status: user.status as unknown as ManagedUserItem['status'],
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
      isLocked: user.isLocked,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      commerceSummary: {
        totalProducts: user.sellerProducts.length,
        totalOrders: user.sellerCommissions.length,
        totalRevenue: totalSales,
        platformCommissionPaid: totalCommission,
        totalPayouts,
        pendingBalance,
      },
      products: user.sellerProducts.map((p) => ({
        id: p.id,
        sellerId: p.sellerId,
        sellerUsername: user.username,
        sellerName: `${user.firstName} ${user.lastName}`.trim(),
        storeName: user.storeName,
        categoryId: p.categoryId,
        categoryName: p.category?.name || null,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        costPrice: p.costPrice ? Number(p.costPrice) : null,
        status: p.status,
        moderationNotes: p.moderationNotes,
        images: p.images,
        stockQuantity: p.inventory?.stockQuantity ?? 0,
        reservedQuantity: p.inventory?.reservedQuantity ?? 0,
        isDeleted: p.isDeleted,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      recentOrders: user.sellerCommissions.map((c) => ({
        id: c.order.id,
        orderNumber: c.order.orderNumber,
        customerId: c.order.customerId,
        customerName: 'Customer',
        customerEmail: '',
        itemCount: 1,
        status: c.order.status,
        paymentStatus: c.order.paymentStatus,
        currency: c.order.currency,
        subtotal: Number(c.order.subtotal),
        shippingTotal: Number(c.order.shippingTotal),
        taxTotal: Number(c.order.taxTotal),
        discountTotal: Number(c.order.discountTotal),
        total: Number(c.order.total),
        createdAt: c.order.createdAt,
        updatedAt: c.order.updatedAt,
      })),
      recentPayouts: user.sellerPayouts.map((p) => ({
        id: p.id,
        payoutNumber: p.payoutNumber,
        sellerId: p.sellerId,
        sellerName: `${user.firstName} ${user.lastName}`.trim(),
        storeName: user.storeName,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        processedAt: p.processedAt,
        processedByName: null,
        notes: p.notes,
        commissionsCount: 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };
  }
}

