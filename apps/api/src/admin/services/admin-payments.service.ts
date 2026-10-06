import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentStatus, Prisma, PrismaService } from '@tobetake/database';
import { PaginatedResult, PaymentListItem } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { PaymentQueryDto } from '../dto/payment.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminPaymentsService {
  private readonly logger = new Logger(AdminPaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List payment transactions with filtering and pagination.
   */
  async listPayments(query: PaymentQueryDto): Promise<PaginatedResult<PaymentListItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentMethod) {
      where.paymentMethod = { contains: query.paymentMethod, mode: 'insensitive' };
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { transactionReference: { contains: s, mode: 'insensitive' } },
        { order: { orderNumber: { contains: s, mode: 'insensitive' } } },
        { order: { customer: { firstName: { contains: s, mode: 'insensitive' } } } },
        { order: { customer: { lastName: { contains: s, mode: 'insensitive' } } } },
        { order: { customer: { email: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        orderNumber: p.order.orderNumber,
        customerId: p.order.customer.id,
        customerName: `${p.order.customer.firstName} ${p.order.customer.lastName}`.trim(),
        customerEmail: p.order.customer.email,
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
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single payment detail.
   */
  async getPaymentDetails(id: string): Promise<PaymentListItem> {
    const p = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!p) {
      throw new NotFoundException(`Payment with ID '${id}' was not found`);
    }

    return {
      id: p.id,
      orderId: p.orderId,
      orderNumber: p.order.orderNumber,
      customerId: p.order.customer.id,
      customerName: `${p.order.customer.firstName} ${p.order.customer.lastName}`.trim(),
      customerEmail: p.order.customer.email,
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
    };
  }

  /**
   * Process refund for a payment.
   */
  async refundPayment(
    id: string,
    admin: AuthenticatedAdminUser,
    reason?: string,
  ): Promise<PaymentListItem> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID '${id}' was not found`);
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException(`Payment '${id}' is already refunded`);
    }

    let existingMeta: Record<string, unknown> = {};
    if (payment.metadata) {
      try {
        existingMeta = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : (payment.metadata as unknown as Record<string, unknown>);
      } catch {
        existingMeta = {};
      }
    }

    const updatedMetaString = JSON.stringify({
      ...existingMeta,
      refundedBy: admin.id,
      refundedAt: new Date().toISOString(),
      refundReason: reason || 'Admin issued refund',
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REFUNDED,
          metadata: updatedMetaString,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      });

      if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
          },
        });
      }

      return p;
    });

    const typedPayment = updated as typeof updated & {
      order?: {
        orderNumber: string;
        customer?: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
      };
    };

    await this.auditService.recordLog({
      actor: admin,
      action: 'PAYMENT_REFUNDED',
      targetType: 'Payment',
      targetId: id,
      details: {
        orderNumber: typedPayment.order?.orderNumber,
        amount: Number(typedPayment.amount),
        previousStatus: payment.status,
        reason: reason || 'Admin issued refund',
      },
    });

    return {
      id: typedPayment.id,
      orderId: typedPayment.orderId,
      orderNumber: typedPayment.order?.orderNumber || '',
      customerId: typedPayment.order?.customer?.id || '',
      customerName: typedPayment.order?.customer
        ? `${typedPayment.order.customer.firstName} ${typedPayment.order.customer.lastName}`.trim()
        : 'Unknown',
      customerEmail: typedPayment.order?.customer?.email || '',
      transactionReference: typedPayment.transactionReference,
      paymentMethod: typedPayment.paymentMethod,
      amount: Number(typedPayment.amount),
      currency: typedPayment.currency,
      status: typedPayment.status,
      failureReason: typedPayment.failureReason,
      metadata: typedPayment.metadata,
      paidAt: typedPayment.paidAt,
      createdAt: typedPayment.createdAt,
      updatedAt: typedPayment.updatedAt,
    };
  }
}

